use axum::{
    extract::{Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct StatsQuery {
    pub project_id: Uuid,
    /// One of: 24h, 7d, 30d
    pub period: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct DashboardStats {
    pub total_events: i64,
    pub error_count: i64,
    pub warning_count: i64,
    pub info_count: i64,
    pub error_rate: f64,
    pub top_events: Vec<TopEvent>,
    pub period: String,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct TopEvent {
    pub name: String,
    pub count: i64,
}

#[derive(Debug, Deserialize)]
pub struct TimelineQuery {
    pub project_id: Uuid,
    /// One of: 24h, 7d, 30d
    pub period: Option<String>,
    /// Bucket size: hour, day
    pub bucket: Option<String>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct TimelineBucket {
    pub bucket_time: chrono::DateTime<chrono::Utc>,
    pub count: i64,
}

fn period_to_interval(period: &str) -> Result<&str, AppError> {
    match period {
        "24h" => Ok("24 hours"),
        "7d" => Ok("7 days"),
        "30d" => Ok("30 days"),
        _ => Err(AppError::BadRequest(
            "Invalid period. Use 24h, 7d, or 30d".into(),
        )),
    }
}

fn bucket_to_trunc(bucket: &str) -> Result<&str, AppError> {
    match bucket {
        "hour" => Ok("hour"),
        "day" => Ok("day"),
        _ => Err(AppError::BadRequest(
            "Invalid bucket. Use hour or day".into(),
        )),
    }
}

pub async fn stats(
    State(state): State<AppState>,
    _auth: AuthUser,
    Query(query): Query<StatsQuery>,
) -> Result<Json<DashboardStats>, AppError> {
    let period = query.period.as_deref().unwrap_or("24h");
    let interval = period_to_interval(period)?;

    // Verify the user owns this project (the AuthUser extractor already verified JWT)
    let _project: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM projects WHERE id = $1 AND owner_id = $2")
            .bind(query.project_id)
            .bind(_auth.user_id)
            .fetch_optional(&state.db)
            .await?;

    if _project.is_none() {
        return Err(AppError::NotFound("Project not found".into()));
    }

    let interval_str = interval.to_string();

    // Total event counts by level
    let counts: Vec<(String, i64)> = sqlx::query_as(&format!(
        r#"
            SELECT level, COUNT(*) as count
            FROM events
            WHERE project_id = $1
              AND created_at > NOW() - INTERVAL '{}'
            GROUP BY level
            "#,
        interval_str
    ))
    .bind(query.project_id)
    .fetch_all(&state.db)
    .await?;

    let mut total_events: i64 = 0;
    let mut error_count: i64 = 0;
    let mut warning_count: i64 = 0;
    let mut info_count: i64 = 0;

    for (level, count) in &counts {
        total_events += count;
        match level.as_str() {
            "error" => error_count = *count,
            "warning" | "warn" => warning_count = *count,
            "info" => info_count = *count,
            _ => {}
        }
    }

    let error_rate = if total_events > 0 {
        (error_count as f64 / total_events as f64) * 100.0
    } else {
        0.0
    };

    // Top events
    let top_events: Vec<TopEvent> = sqlx::query_as(&format!(
        r#"
            SELECT name, COUNT(*) as count
            FROM events
            WHERE project_id = $1
              AND created_at > NOW() - INTERVAL '{}'
            GROUP BY name
            ORDER BY count DESC
            LIMIT 10
            "#,
        interval_str
    ))
    .bind(query.project_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(DashboardStats {
        total_events,
        error_count,
        warning_count,
        info_count,
        error_rate,
        top_events,
        period: period.to_string(),
    }))
}

pub async fn timeline(
    State(state): State<AppState>,
    _auth: AuthUser,
    Query(query): Query<TimelineQuery>,
) -> Result<Json<Vec<TimelineBucket>>, AppError> {
    let period = query.period.as_deref().unwrap_or("24h");
    let bucket = query.bucket.as_deref().unwrap_or("hour");
    let interval = period_to_interval(period)?;
    let trunc = bucket_to_trunc(bucket)?;

    // Verify the user owns this project
    let _project: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM projects WHERE id = $1 AND owner_id = $2")
            .bind(query.project_id)
            .bind(_auth.user_id)
            .fetch_optional(&state.db)
            .await?;

    if _project.is_none() {
        return Err(AppError::NotFound("Project not found".into()));
    }

    let buckets: Vec<TimelineBucket> = sqlx::query_as(&format!(
        r#"
            SELECT DATE_TRUNC('{}', created_at) as bucket_time, COUNT(*) as count
            FROM events
            WHERE project_id = $1
              AND created_at > NOW() - INTERVAL '{}'
            GROUP BY bucket_time
            ORDER BY bucket_time ASC
            "#,
        trunc, interval
    ))
    .bind(query.project_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(buckets))
}
