use redis::AsyncCommands;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::{Alert, AlertRule, Event};
use crate::AppState;

/// Publish an event to the Redis pub/sub channel for real-time streaming.
pub async fn publish_event(state: &AppState, event: &Event) -> Result<(), AppError> {
    let channel = format!("events:{}", event.project_id);
    let payload = serde_json::to_string(event)?;

    let mut conn = state
        .redis
        .get_multiplexed_async_connection()
        .await
        .map_err(AppError::Redis)?;

    let _: () = conn
        .publish(channel, payload)
        .await
        .map_err(AppError::Redis)?;

    Ok(())
}

/// Evaluate all enabled alert rules for a given project after event ingestion.
pub async fn evaluate_alerts(
    state: &AppState,
    project_id: Uuid,
    event_name: &str,
    event_level: &str,
) -> Result<Vec<Alert>, AppError> {
    let rules: Vec<AlertRule> = sqlx::query_as(
        r#"
        SELECT id, project_id, name, event_name, level_filter, threshold, window_seconds, enabled, created_at, updated_at
        FROM alert_rules
        WHERE project_id = $1
          AND event_name = $2
          AND enabled = true
          AND (level_filter IS NULL OR level_filter = $3)
        "#,
    )
    .bind(project_id)
    .bind(event_name)
    .bind(event_level)
    .fetch_all(&state.db)
    .await?;

    let mut triggered_alerts = Vec::new();

    for rule in &rules {
        // Count events matching the rule within the time window
        let (count,): (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*)
            FROM events
            WHERE project_id = $1
              AND name = $2
              AND ($3::TEXT IS NULL OR level = $3)
              AND created_at > NOW() - ($4 || ' seconds')::INTERVAL
            "#,
        )
        .bind(project_id)
        .bind(&rule.event_name)
        .bind(&rule.level_filter)
        .bind(rule.window_seconds.to_string())
        .fetch_one(&state.db)
        .await?;

        if count >= rule.threshold {
            let message = format!(
                "Alert '{}': {} events of '{}' (threshold: {}) in the last {} seconds",
                rule.name, count, rule.event_name, rule.threshold, rule.window_seconds
            );

            let alert: Alert = sqlx::query_as(
                r#"
                INSERT INTO alerts (id, rule_id, project_id, message, event_count, triggered_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
                RETURNING id, rule_id, project_id, message, event_count, triggered_at
                "#,
            )
            .bind(Uuid::new_v4())
            .bind(rule.id)
            .bind(project_id)
            .bind(&message)
            .bind(count)
            .fetch_one(&state.db)
            .await?;

            tracing::warn!(
                project_id = %project_id,
                rule_name = %rule.name,
                event_count = count,
                "Alert triggered"
            );

            triggered_alerts.push(alert);
        }
    }

    Ok(triggered_alerts)
}
