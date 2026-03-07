use axum::{extract::State, Json};
use chrono::Utc;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::ApiKeyAuth;
use crate::models::{Event, EventBatch};
use crate::services::event_processor;
use crate::AppState;

pub async fn ingest_events(
    State(state): State<AppState>,
    api_key: ApiKeyAuth,
    Json(batch): Json<EventBatch>,
) -> Result<Json<IngestResponse>, AppError> {
    if batch.events.is_empty() {
        return Err(AppError::BadRequest("No events provided".into()));
    }

    if batch.events.len() > 1000 {
        return Err(AppError::BadRequest("Maximum 1000 events per batch".into()));
    }

    let project_id = api_key.project_id;
    let mut ingested = Vec::with_capacity(batch.events.len());

    for input in &batch.events {
        let event_id = Uuid::new_v4();
        let timestamp = input.timestamp.unwrap_or_else(Utc::now);
        let now = Utc::now();

        let event: Event = sqlx::query_as(
            r#"
            INSERT INTO events (id, project_id, name, level, payload, timestamp, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, project_id, name, level, payload, timestamp, created_at
            "#,
        )
        .bind(event_id)
        .bind(project_id)
        .bind(&input.name)
        .bind(&input.level)
        .bind(&input.payload)
        .bind(timestamp)
        .bind(now)
        .fetch_one(&state.db)
        .await?;

        // Publish to Redis for real-time streaming (non-blocking, log errors)
        if let Err(e) = event_processor::publish_event(&state, &event).await {
            tracing::warn!(error = %e, "Failed to publish event to Redis");
        }

        // Evaluate alert rules (non-blocking, log errors)
        if let Err(e) =
            event_processor::evaluate_alerts(&state, project_id, &input.name, &input.level).await
        {
            tracing::warn!(error = %e, "Failed to evaluate alerts");
        }

        ingested.push(event);
    }

    tracing::info!(
        project_id = %project_id,
        count = ingested.len(),
        "Events ingested"
    );

    Ok(Json(IngestResponse {
        ingested: ingested.len(),
        events: ingested,
    }))
}

#[derive(serde::Serialize)]
pub struct IngestResponse {
    pub ingested: usize,
    pub events: Vec<Event>,
}
