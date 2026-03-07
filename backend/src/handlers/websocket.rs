use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, Query, State,
    },
    response::Response,
};
use futures_util::{SinkExt, StreamExt};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::Deserialize;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::Claims;
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct WsQuery {
    pub token: Option<String>,
}

pub async fn ws_events(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Path(project_id): Path<Uuid>,
    Query(query): Query<WsQuery>,
) -> Result<Response, AppError> {
    // Validate JWT token from query parameter
    let token = query.token.ok_or(AppError::Unauthorized)?;
    let token_data = decode::<Claims>(
        &token,
        &DecodingKey::from_secret(state.config.jwt_secret.as_bytes()),
        &Validation::default(),
    )?;

    // Verify the user owns this project
    let _project: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM projects WHERE id = $1 AND owner_id = $2")
            .bind(project_id)
            .bind(token_data.claims.sub)
            .fetch_optional(&state.db)
            .await?;

    if _project.is_none() {
        return Err(AppError::NotFound("Project not found".into()));
    }

    Ok(ws.on_upgrade(move |socket| handle_ws(socket, state, project_id)))
}

async fn handle_ws(socket: WebSocket, state: AppState, project_id: Uuid) {
    let (mut sender, mut receiver) = socket.split();

    let channel = format!("events:{}", project_id);

    tracing::info!(project_id = %project_id, "WebSocket client connected");

    // Subscribe to Redis pub/sub for this project's events
    let redis_client = state.redis.clone();

    let mut pubsub_conn = match redis_client.get_async_pubsub().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!(error = %e, "Failed to create Redis pubsub connection");
            let _ = sender.send(Message::Close(None)).await;
            return;
        }
    };

    if let Err(e) = pubsub_conn.subscribe(&channel).await {
        tracing::error!(error = %e, channel = %channel, "Failed to subscribe to Redis channel");
        let _ = sender.send(Message::Close(None)).await;
        return;
    }

    let mut pubsub_stream = pubsub_conn.into_on_message();

    // Spawn a task to forward Redis messages to the WebSocket
    let send_task = tokio::spawn(async move {
        while let Some(msg) = pubsub_stream.next().await {
            let payload: String = match msg.get_payload() {
                Ok(p) => p,
                Err(e) => {
                    tracing::warn!(error = %e, "Failed to get Redis message payload");
                    continue;
                }
            };

            if sender.send(Message::Text(payload.into())).await.is_err() {
                break;
            }
        }
    });

    // Spawn a task to handle incoming WebSocket messages (for keep-alive pings)
    let recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Close(_) => break,
                Message::Ping(_data) => {
                    // Pong is handled automatically by axum
                    tracing::trace!("Received ping from WebSocket client");
                }
                _ => {}
            }
        }
    });

    // Wait for either task to complete
    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    }

    tracing::info!(project_id = %project_id, "WebSocket client disconnected");
}
