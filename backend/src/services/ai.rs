use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppError;
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct AnalyzeRequest {
    pub project_id: Uuid,
    pub hours: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalyzeResponse {
    pub analysis: String,
    pub anomalies: Vec<AnomalyReport>,
    pub recommendations: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnomalyReport {
    pub event_name: String,
    pub severity: String,
    pub description: String,
}

#[derive(Debug, Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
    max_tokens: u32,
}

#[derive(Debug, Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Debug, Deserialize)]
struct ChatChoice {
    message: ChatMessageResponse,
}

#[derive(Debug, Deserialize)]
struct ChatMessageResponse {
    content: String,
}

pub async fn analyze_events(
    state: &AppState,
    project_id: Uuid,
    hours: i64,
) -> Result<AnalyzeResponse, AppError> {
    // Fetch recent events for the project
    let events: Vec<(String, String, i64)> = sqlx::query_as(
        r#"
        SELECT name, level, COUNT(*) as count
        FROM events
        WHERE project_id = $1
          AND created_at > NOW() - ($2 || ' hours')::INTERVAL
        GROUP BY name, level
        ORDER BY count DESC
        LIMIT 50
        "#,
    )
    .bind(project_id)
    .bind(hours.to_string())
    .fetch_all(&state.db)
    .await?;

    if events.is_empty() {
        return Ok(AnalyzeResponse {
            analysis: "No events found in the specified time range.".into(),
            anomalies: vec![],
            recommendations: vec![],
        });
    }

    // Build event summary for the AI prompt
    let event_summary: String = events
        .iter()
        .map(|(name, level, count)| format!("- {} [{}]: {} occurrences", name, level, count))
        .collect::<Vec<_>>()
        .join("\n");

    let system_prompt = "You are an expert application monitoring analyst. Analyze the following event data and identify anomalies, patterns, and potential issues. Respond in JSON format with fields: analysis (string), anomalies (array of {event_name, severity, description}), recommendations (array of strings).";

    let user_prompt = format!(
        "Here are the aggregated events from the last {} hours:\n\n{}\n\nProvide your analysis in the specified JSON format.",
        hours, event_summary
    );

    let chat_request = ChatRequest {
        model: "gpt-4o-mini".into(),
        messages: vec![
            ChatMessage {
                role: "system".into(),
                content: system_prompt.into(),
            },
            ChatMessage {
                role: "user".into(),
                content: user_prompt,
            },
        ],
        temperature: 0.3,
        max_tokens: 2000,
    };

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header(
            "Authorization",
            format!("Bearer {}", state.config.openai_api_key),
        )
        .json(&chat_request)
        .send()
        .await?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        tracing::error!("OpenAI API error: {} - {}", status, body);
        return Err(AppError::Internal(format!(
            "OpenAI API returned status {}",
            status
        )));
    }

    let chat_response: ChatResponse = response.json().await?;

    let content = chat_response
        .choices
        .first()
        .map(|c| c.message.content.clone())
        .unwrap_or_default();

    // Try to parse the AI response as structured JSON
    // Strip markdown code fences if present
    let cleaned = content
        .trim()
        .strip_prefix("```json")
        .or_else(|| content.trim().strip_prefix("```"))
        .unwrap_or(content.trim())
        .strip_suffix("```")
        .unwrap_or(content.trim())
        .trim();

    match serde_json::from_str::<AnalyzeResponse>(cleaned) {
        Ok(parsed) => Ok(parsed),
        Err(_) => {
            // If parsing fails, return the raw content as the analysis
            Ok(AnalyzeResponse {
                analysis: content,
                anomalies: vec![],
                recommendations: vec![],
            })
        }
    }
}
