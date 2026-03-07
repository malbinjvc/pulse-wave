use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct AlertRule {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub event_name: String,
    pub level_filter: Option<String>,
    pub threshold: i64,
    pub window_seconds: i64,
    pub enabled: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAlertRule {
    pub project_id: Uuid,
    pub name: String,
    pub event_name: String,
    pub level_filter: Option<String>,
    pub threshold: i64,
    pub window_seconds: i64,
}

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Alert {
    pub id: Uuid,
    pub rule_id: Uuid,
    pub project_id: Uuid,
    pub message: String,
    pub event_count: i64,
    pub triggered_at: DateTime<Utc>,
}
