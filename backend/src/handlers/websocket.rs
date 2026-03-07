use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, State,
    },
    response::Response,
};
use futures_util::{SinkExt, StreamExt};
use uuid::Uuid;

use crate::AppState;

pub async fn ws_events(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Path(project_id): Path<Uuid>,
) -> Response {
    ws.on_upgrade(move |socket| handle_ws(socket, state, project_id))
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
