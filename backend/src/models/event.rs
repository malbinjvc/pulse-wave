use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Event {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub level: String,
    pub payload: Option<serde_json::Value>,
    pub timestamp: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct EventInput {
    pub name: String,
    pub level: String,
    pub payload: Option<serde_json::Value>,
    pub timestamp: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct EventBatch {
    pub events: Vec<EventInput>,
}
