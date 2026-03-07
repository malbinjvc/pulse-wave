use axum::{extract::FromRequestParts, http::request::Parts};
use jsonwebtoken::{decode, DecodingKey, Validation};
use uuid::Uuid;

use crate::error::AppError;
use crate::models::Claims;
use crate::AppState;

/// Extractor that validates JWT from the Authorization header and provides the user ID.
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: Uuid,
    #[allow(dead_code)]
    pub email: String,
}

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .ok_or(AppError::Unauthorized)?;

        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or(AppError::Unauthorized)?;

        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(state.config.jwt_secret.as_bytes()),
            &Validation::default(),
        )?;

        Ok(AuthUser {
            user_id: token_data.claims.sub,
            email: token_data.claims.email,
        })
    }
}

/// Extractor that validates a project API key from the X-API-Key header.
/// Returns the project_id associated with the key.
#[derive(Debug, Clone)]
pub struct ApiKeyAuth {
    pub project_id: Uuid,
}

impl FromRequestParts<AppState> for ApiKeyAuth {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let api_key = parts
            .headers
            .get("X-API-Key")
            .and_then(|v| v.to_str().ok())
            .ok_or(AppError::Unauthorized)?;

        let row: Option<(Uuid,)> = sqlx::query_as("SELECT id FROM projects WHERE api_key = $1")
            .bind(api_key)
            .fetch_optional(&state.db)
            .await?;

        match row {
            Some((project_id,)) => Ok(ApiKeyAuth { project_id }),
            None => Err(AppError::Unauthorized),
        }
    }
}
