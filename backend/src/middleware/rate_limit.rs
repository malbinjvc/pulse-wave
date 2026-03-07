use axum::{
    extract::{ConnectInfo, Request, State},
    middleware::Next,
    response::Response,
};
use std::net::SocketAddr;

use crate::error::AppError;
use crate::AppState;

/// Rate limiting middleware using Redis sliding window.
pub async fn rate_limit(
    State(state): State<AppState>,
    connect_info: ConnectInfo<SocketAddr>,
    request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let ip = connect_info.ip().to_string();
    let path = request.uri().path().to_string();
    let key = format!("rate_limit:{}:{}", ip, path);

    let mut conn = state
        .redis
        .get_multiplexed_async_connection()
        .await
        .map_err(AppError::Redis)?;

    let window = state.config.rate_limit_window_secs;
    let max_requests = state.config.rate_limit_requests;

    let now = chrono::Utc::now().timestamp() as u64;
    let window_start = now - window;

    // Remove old entries outside the window
    let _: () = redis::cmd("ZREMRANGEBYSCORE")
        .arg(&key)
        .arg(0u64)
        .arg(window_start)
        .query_async(&mut conn)
        .await
        .map_err(AppError::Redis)?;

    // Count current requests in the window
    let count: u64 = redis::cmd("ZCARD")
        .arg(&key)
        .query_async(&mut conn)
        .await
        .map_err(AppError::Redis)?;

    if count >= max_requests {
        tracing::warn!(ip = %ip, path = %path, "Rate limit exceeded");
        return Err(AppError::RateLimited);
    }

    // Add current request
    let member = format!("{}:{}", now, uuid::Uuid::new_v4());
    let _: () = redis::cmd("ZADD")
        .arg(&key)
        .arg(now)
        .arg(&member)
        .query_async(&mut conn)
        .await
        .map_err(AppError::Redis)?;

    // Set expiry on the key
    let _: () = redis::cmd("EXPIRE")
        .arg(&key)
        .arg(window + 1)
        .query_async(&mut conn)
        .await
        .map_err(AppError::Redis)?;

    Ok(next.run(request).await)
}
