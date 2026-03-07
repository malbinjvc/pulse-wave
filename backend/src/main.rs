mod config;
mod db;
mod error;
mod handlers;
mod middleware;
mod models;
mod services;

use axum::{
    middleware as axum_middleware,
    routing::{delete, get, post, put},
    Router,
};
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

use crate::config::Config;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub redis: redis::Client,
    pub config: Config,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "pulse_wave_api=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load environment variables
    dotenvy::dotenv().ok();

    // Load config
    let config = Config::from_env().expect("Failed to load configuration");

    // Create database pool
    let db = db::create_pool(&config.database_url)
        .await
        .expect("Failed to create database pool");

    // Create Redis client
    let redis =
        redis::Client::open(config.redis_url.clone()).expect("Failed to create Redis client");

    // Verify Redis connectivity
    let _: () = redis::cmd("PING")
        .query_async(
            &mut redis
                .get_multiplexed_async_connection()
                .await
                .expect("Failed to connect to Redis"),
        )
        .await
        .expect("Redis PING failed");
    tracing::info!("Redis connection verified");

    let state = AppState {
        db,
        redis,
        config: config.clone(),
    };

    let app = build_router(state);

    let addr = SocketAddr::from((
        config
            .host
            .parse::<std::net::IpAddr>()
            .unwrap_or(std::net::IpAddr::V4(std::net::Ipv4Addr::new(0, 0, 0, 0))),
        config.port,
    ));

    tracing::info!("Starting PulseWave API server on {}", addr);

    let listener = TcpListener::bind(addr)
        .await
        .expect("Failed to bind TCP listener");

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await
    .expect("Server error");
}

fn build_router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Public auth routes
    let auth_routes = Router::new()
        .route("/register", post(handlers::auth::register))
        .route("/login", post(handlers::auth::login));

    // Event ingestion (API key auth, not JWT)
    let event_routes = Router::new().route("/ingest", post(handlers::events::ingest_events));

    // Project management (JWT auth)
    let project_routes = Router::new()
        .route("/", get(handlers::projects::list_projects))
        .route("/", post(handlers::projects::create_project))
        .route("/{project_id}", get(handlers::projects::get_project))
        .route("/{project_id}", put(handlers::projects::update_project))
        .route("/{project_id}", delete(handlers::projects::delete_project))
        .route(
            "/{project_id}/api-key",
            post(handlers::projects::regenerate_api_key),
        );

    // Dashboard (JWT auth)
    let dashboard_routes = Router::new()
        .route("/stats", get(handlers::dashboard::stats))
        .route("/timeline", get(handlers::dashboard::timeline));

    // Alert management (JWT auth)
    let alert_routes = Router::new()
        .route(
            "/rules/{project_id}",
            get(handlers::alerts::list_alert_rules),
        )
        .route("/rules", post(handlers::alerts::create_alert_rule))
        .route(
            "/rules/{project_id}/{rule_id}",
            get(handlers::alerts::get_alert_rule),
        )
        .route(
            "/rules/{project_id}/{rule_id}",
            put(handlers::alerts::update_alert_rule),
        )
        .route(
            "/rules/{project_id}/{rule_id}",
            delete(handlers::alerts::delete_alert_rule),
        )
        .route("/history/{project_id}", get(handlers::alerts::list_alerts));

    // AI analysis (JWT auth)
    let ai_routes = Router::new().route("/analyze", post(ai_analyze_handler));

    // WebSocket route (no auth middleware, project_id in path)
    let ws_routes =
        Router::new().route("/events/{project_id}", get(handlers::websocket::ws_events));

    // Rate-limited API routes
    let api_v1 = Router::new()
        .nest("/auth", auth_routes)
        .nest("/events", event_routes)
        .nest("/projects", project_routes)
        .nest("/dashboard", dashboard_routes)
        .nest("/alerts", alert_routes)
        .nest("/ai", ai_routes)
        .nest("/ws", ws_routes)
        .layer(axum_middleware::from_fn_with_state(
            state.clone(),
            middleware::rate_limit::rate_limit,
        ));

    // Health check at root level
    Router::new()
        .route("/health", get(health_check))
        .nest("/api/v1", api_v1)
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state)
}

async fn health_check() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({
        "status": "ok",
        "service": "pulse-wave-api",
        "version": env!("CARGO_PKG_VERSION"),
    }))
}

async fn ai_analyze_handler(
    axum::extract::State(state): axum::extract::State<AppState>,
    _auth: middleware::auth::AuthUser,
    axum::Json(input): axum::Json<services::ai::AnalyzeRequest>,
) -> Result<axum::Json<services::ai::AnalyzeResponse>, error::AppError> {
    let hours = input.hours.unwrap_or(24);
    let result = services::ai::analyze_events(&state, input.project_id, hours).await?;
    Ok(axum::Json(result))
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("Failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    tracing::info!("Shutdown signal received, starting graceful shutdown");
}
