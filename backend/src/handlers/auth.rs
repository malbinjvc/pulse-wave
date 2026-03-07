use axum::{extract::State, Json};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::Utc;
use jsonwebtoken::{encode, EncodingKey, Header};
use uuid::Uuid;

use crate::error::AppError;
use crate::models::{AuthPayload, Claims, CreateUser, LoginUser, User, UserResponse};
use crate::AppState;

pub async fn register(
    State(state): State<AppState>,
    Json(input): Json<CreateUser>,
) -> Result<Json<AuthPayload>, AppError> {
    // Validate input
    if input.email.is_empty() || input.password.is_empty() || input.name.is_empty() {
        return Err(AppError::BadRequest(
            "Email, password, and name are required".into(),
        ));
    }

    if input.password.len() < 8 {
        return Err(AppError::BadRequest(
            "Password must be at least 8 characters".into(),
        ));
    }

    // Check if email already exists
    let existing: Option<(Uuid,)> = sqlx::query_as("SELECT id FROM users WHERE email = $1")
        .bind(&input.email)
        .fetch_optional(&state.db)
        .await?;

    if existing.is_some() {
        return Err(AppError::Conflict("Email already registered".into()));
    }

    let password_hash = hash(&input.password, DEFAULT_COST)?;
    let user_id = Uuid::new_v4();
    let now = Utc::now();

    let user: User = sqlx::query_as(
        r#"
        INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, password_hash, name, created_at, updated_at
        "#,
    )
    .bind(user_id)
    .bind(&input.email)
    .bind(&password_hash)
    .bind(&input.name)
    .bind(now)
    .bind(now)
    .fetch_one(&state.db)
    .await?;

    let token = generate_token(&state, &user)?;

    tracing::info!(user_id = %user.id, email = %user.email, "User registered");

    Ok(Json(AuthPayload {
        token,
        user: UserResponse::from(user),
    }))
}

pub async fn login(
    State(state): State<AppState>,
    Json(input): Json<LoginUser>,
) -> Result<Json<AuthPayload>, AppError> {
    let user: User = sqlx::query_as(
        "SELECT id, email, password_hash, name, created_at, updated_at FROM users WHERE email = $1",
    )
    .bind(&input.email)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::Unauthorized)?;

    if !verify(&input.password, &user.password_hash)? {
        return Err(AppError::Unauthorized);
    }

    let token = generate_token(&state, &user)?;

    tracing::info!(user_id = %user.id, "User logged in");

    Ok(Json(AuthPayload {
        token,
        user: UserResponse::from(user),
    }))
}

fn generate_token(state: &AppState, user: &User) -> Result<String, AppError> {
    let now = Utc::now();
    let exp = now + chrono::Duration::hours(state.config.jwt_expiration_hours);

    let claims = Claims {
        sub: user.id,
        email: user.email.clone(),
        exp: exp.timestamp() as usize,
        iat: now.timestamp() as usize,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(state.config.jwt_secret.as_bytes()),
    )?;

    Ok(token)
}
