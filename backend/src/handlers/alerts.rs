use axum::{
    extract::{Path, State},
    Json,
};
use chrono::Utc;
use serde::Deserialize;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::models::{Alert, AlertRule, CreateAlertRule};
use crate::AppState;

pub async fn list_alert_rules(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(project_id): Path<Uuid>,
) -> Result<Json<Vec<AlertRule>>, AppError> {
    // Verify ownership
    verify_project_ownership(&state, project_id, auth.user_id).await?;

    let rules: Vec<AlertRule> = sqlx::query_as(
        r#"
        SELECT id, project_id, name, event_name, level_filter, threshold, window_seconds, enabled, created_at, updated_at
        FROM alert_rules
        WHERE project_id = $1
        ORDER BY created_at DESC
        "#,
    )
    .bind(project_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(rules))
}

pub async fn create_alert_rule(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(input): Json<CreateAlertRule>,
) -> Result<Json<AlertRule>, AppError> {
    verify_project_ownership(&state, input.project_id, auth.user_id).await?;

    if input.name.is_empty() || input.event_name.is_empty() {
        return Err(AppError::BadRequest(
            "Name and event_name are required".into(),
        ));
    }

    if input.threshold <= 0 {
        return Err(AppError::BadRequest(
            "Threshold must be a positive integer".into(),
        ));
    }

    if input.window_seconds <= 0 {
        return Err(AppError::BadRequest(
            "Window seconds must be a positive integer".into(),
        ));
    }

    let rule_id = Uuid::new_v4();
    let now = Utc::now();

    let rule: AlertRule = sqlx::query_as(
        r#"
        INSERT INTO alert_rules (id, project_id, name, event_name, level_filter, threshold, window_seconds, enabled, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9)
        RETURNING id, project_id, name, event_name, level_filter, threshold, window_seconds, enabled, created_at, updated_at
        "#,
    )
    .bind(rule_id)
    .bind(input.project_id)
    .bind(&input.name)
    .bind(&input.event_name)
    .bind(&input.level_filter)
    .bind(input.threshold)
    .bind(input.window_seconds)
    .bind(now)
    .bind(now)
    .fetch_one(&state.db)
    .await?;

    tracing::info!(rule_id = %rule.id, name = %rule.name, "Alert rule created");

    Ok(Json(rule))
}

pub async fn get_alert_rule(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((project_id, rule_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<AlertRule>, AppError> {
    verify_project_ownership(&state, project_id, auth.user_id).await?;

    let rule: AlertRule = sqlx::query_as(
        r#"
        SELECT id, project_id, name, event_name, level_filter, threshold, window_seconds, enabled, created_at, updated_at
        FROM alert_rules
        WHERE id = $1 AND project_id = $2
        "#,
    )
    .bind(rule_id)
    .bind(project_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Alert rule not found".into()))?;

    Ok(Json(rule))
}

#[derive(Debug, Deserialize)]
pub struct UpdateAlertRule {
    pub name: Option<String>,
    pub event_name: Option<String>,
    pub level_filter: Option<String>,
    pub threshold: Option<i64>,
    pub window_seconds: Option<i64>,
    pub enabled: Option<bool>,
}

pub async fn update_alert_rule(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((project_id, rule_id)): Path<(Uuid, Uuid)>,
    Json(input): Json<UpdateAlertRule>,
) -> Result<Json<AlertRule>, AppError> {
    verify_project_ownership(&state, project_id, auth.user_id).await?;

    let now = Utc::now();

    let rule: AlertRule = sqlx::query_as(
        r#"
        UPDATE alert_rules
        SET name = COALESCE($1, name),
            event_name = COALESCE($2, event_name),
            level_filter = COALESCE($3, level_filter),
            threshold = COALESCE($4, threshold),
            window_seconds = COALESCE($5, window_seconds),
            enabled = COALESCE($6, enabled),
            updated_at = $7
        WHERE id = $8 AND project_id = $9
        RETURNING id, project_id, name, event_name, level_filter, threshold, window_seconds, enabled, created_at, updated_at
        "#,
    )
    .bind(&input.name)
    .bind(&input.event_name)
    .bind(&input.level_filter)
    .bind(input.threshold)
    .bind(input.window_seconds)
    .bind(input.enabled)
    .bind(now)
    .bind(rule_id)
    .bind(project_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Alert rule not found".into()))?;

    tracing::info!(rule_id = %rule.id, "Alert rule updated");

    Ok(Json(rule))
}

pub async fn delete_alert_rule(
    State(state): State<AppState>,
    auth: AuthUser,
    Path((project_id, rule_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>, AppError> {
    verify_project_ownership(&state, project_id, auth.user_id).await?;

    let result = sqlx::query("DELETE FROM alert_rules WHERE id = $1 AND project_id = $2")
        .bind(rule_id)
        .bind(project_id)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Alert rule not found".into()));
    }

    tracing::info!(rule_id = %rule_id, "Alert rule deleted");

    Ok(Json(serde_json::json!({ "message": "Alert rule deleted" })))
}

pub async fn list_alerts(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(project_id): Path<Uuid>,
) -> Result<Json<Vec<Alert>>, AppError> {
    verify_project_ownership(&state, project_id, auth.user_id).await?;

    let alerts: Vec<Alert> = sqlx::query_as(
        r#"
        SELECT id, rule_id, project_id, message, event_count, triggered_at
        FROM alerts
        WHERE project_id = $1
        ORDER BY triggered_at DESC
        LIMIT 100
        "#,
    )
    .bind(project_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(alerts))
}

async fn verify_project_ownership(
    state: &AppState,
    project_id: Uuid,
    user_id: Uuid,
) -> Result<(), AppError> {
    let project: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM projects WHERE id = $1 AND owner_id = $2")
            .bind(project_id)
            .bind(user_id)
            .fetch_optional(&state.db)
            .await?;

    if project.is_none() {
        return Err(AppError::NotFound("Project not found".into()));
    }

    Ok(())
}
