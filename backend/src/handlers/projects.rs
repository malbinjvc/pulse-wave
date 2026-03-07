use axum::{
    extract::{Path, State},
    Json,
};
use chrono::Utc;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::models::{CreateProject, Project, UpdateProject};
use crate::AppState;

pub async fn list_projects(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Vec<Project>>, AppError> {
    let projects: Vec<Project> = sqlx::query_as(
        r#"
        SELECT id, name, description, api_key, owner_id, created_at, updated_at
        FROM projects
        WHERE owner_id = $1
        ORDER BY created_at DESC
        "#,
    )
    .bind(auth.user_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(projects))
}

pub async fn create_project(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(input): Json<CreateProject>,
) -> Result<Json<Project>, AppError> {
    if input.name.is_empty() {
        return Err(AppError::BadRequest("Project name is required".into()));
    }

    let project_id = Uuid::new_v4();
    let api_key = format!("pw_{}", Uuid::new_v4().to_string().replace('-', ""));
    let now = Utc::now();

    let project: Project = sqlx::query_as(
        r#"
        INSERT INTO projects (id, name, description, api_key, owner_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, description, api_key, owner_id, created_at, updated_at
        "#,
    )
    .bind(project_id)
    .bind(&input.name)
    .bind(&input.description)
    .bind(&api_key)
    .bind(auth.user_id)
    .bind(now)
    .bind(now)
    .fetch_one(&state.db)
    .await?;

    tracing::info!(project_id = %project.id, name = %project.name, "Project created");

    Ok(Json(project))
}

pub async fn get_project(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(project_id): Path<Uuid>,
) -> Result<Json<Project>, AppError> {
    let project: Project = sqlx::query_as(
        r#"
        SELECT id, name, description, api_key, owner_id, created_at, updated_at
        FROM projects
        WHERE id = $1 AND owner_id = $2
        "#,
    )
    .bind(project_id)
    .bind(auth.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Project not found".into()))?;

    Ok(Json(project))
}

pub async fn update_project(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(project_id): Path<Uuid>,
    Json(input): Json<UpdateProject>,
) -> Result<Json<Project>, AppError> {
    // Verify ownership
    let existing: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM projects WHERE id = $1 AND owner_id = $2")
            .bind(project_id)
            .bind(auth.user_id)
            .fetch_optional(&state.db)
            .await?;

    if existing.is_none() {
        return Err(AppError::NotFound("Project not found".into()));
    }

    let now = Utc::now();

    let project: Project = sqlx::query_as(
        r#"
        UPDATE projects
        SET name = COALESCE($1, name),
            description = COALESCE($2, description),
            updated_at = $3
        WHERE id = $4 AND owner_id = $5
        RETURNING id, name, description, api_key, owner_id, created_at, updated_at
        "#,
    )
    .bind(&input.name)
    .bind(&input.description)
    .bind(now)
    .bind(project_id)
    .bind(auth.user_id)
    .fetch_one(&state.db)
    .await?;

    tracing::info!(project_id = %project.id, "Project updated");

    Ok(Json(project))
}

pub async fn delete_project(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(project_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query("DELETE FROM projects WHERE id = $1 AND owner_id = $2")
        .bind(project_id)
        .bind(auth.user_id)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Project not found".into()));
    }

    tracing::info!(project_id = %project_id, "Project deleted");

    Ok(Json(serde_json::json!({ "message": "Project deleted" })))
}

pub async fn regenerate_api_key(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(project_id): Path<Uuid>,
) -> Result<Json<Project>, AppError> {
    let new_api_key = format!("pw_{}", Uuid::new_v4().to_string().replace('-', ""));
    let now = Utc::now();

    let project: Project = sqlx::query_as(
        r#"
        UPDATE projects
        SET api_key = $1, updated_at = $2
        WHERE id = $3 AND owner_id = $4
        RETURNING id, name, description, api_key, owner_id, created_at, updated_at
        "#,
    )
    .bind(&new_api_key)
    .bind(now)
    .bind(project_id)
    .bind(auth.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Project not found".into()))?;

    tracing::info!(project_id = %project.id, "API key regenerated");

    Ok(Json(project))
}
