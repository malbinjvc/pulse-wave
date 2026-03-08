#!/usr/bin/env python3
"""Generate PulseWave Project Report PDF using fpdf2."""

from fpdf import FPDF, XPos, YPos
import os

class ProjectReport(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, "PulseWave - Project Report", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="R")
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def section_title(self, title):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(30, 60, 120)
        self.cell(0, 10, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def subsection(self, title):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(50, 50, 50)
        self.cell(0, 8, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def body_text(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def bullet(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.set_x(self.l_margin)
        self.multi_cell(w=0, h=5.5, text="  - " + text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def table_row(self, col1, col2, bold=False):
        style = "B" if bold else ""
        self.set_font("Helvetica", style, 10)
        if bold:
            self.set_fill_color(230, 235, 245)
            self.set_text_color(30, 60, 120)
        else:
            self.set_fill_color(255, 255, 255)
            self.set_text_color(40, 40, 40)
        self.cell(55, 7, col1, border=1, fill=True)
        self.cell(0, 7, col2, border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)


def main():
    pdf = ProjectReport()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)

    # ── Page 1: Title ──
    pdf.add_page()
    pdf.ln(40)
    pdf.set_font("Helvetica", "B", 32)
    pdf.set_text_color(30, 60, 120)
    pdf.cell(0, 15, "PulseWave", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.set_font("Helvetica", "", 16)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 10, "Real-Time Event Analytics Platform", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.ln(10)
    pdf.set_font("Helvetica", "", 12)
    pdf.cell(0, 8, "Project Report", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.cell(0, 8, "March 2026", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.ln(20)
    pdf.set_font("Helvetica", "I", 10)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 8, "Backend: Rust (Axum) | Frontend: Angular 19 | AI: OpenAI GPT-4o", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.cell(0, 8, "PostgreSQL | Redis | Docker Compose | GitHub Actions CI", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")

    # ── Page 2: Overview ──
    pdf.add_page()
    pdf.section_title("1. Project Overview")
    pdf.body_text(
        "PulseWave is a full-stack real-time event analytics platform designed for monitoring application "
        "events, alerting on anomalies, and providing AI-powered pattern analysis. It serves as a "
        "production-grade portfolio project demonstrating expertise in Rust backend development, "
        "Angular frontend engineering, and modern DevOps practices."
    )
    pdf.body_text(
        "The platform allows developers to ingest events from any application via API keys, visualize "
        "them in real-time through WebSocket streaming, set up configurable alert rules, and leverage "
        "OpenAI GPT-4o for automated anomaly detection and recommendations."
    )

    pdf.section_title("2. Tech Stack")
    pdf.table_row("Component", "Technology", bold=True)
    pdf.table_row("Backend", "Rust 1.88+ with Axum 0.8 web framework")
    pdf.table_row("Frontend", "Angular 19 with standalone components, Signals")
    pdf.table_row("Styling", "Tailwind CSS with dark theme")
    pdf.table_row("Database", "PostgreSQL 16 with SQLx async driver")
    pdf.table_row("Cache / Pub-Sub", "Redis 7 (rate limiting, real-time streaming)")
    pdf.table_row("AI", "OpenAI GPT-4o-mini for anomaly detection")
    pdf.table_row("Auth", "JWT (jsonwebtoken crate) + bcrypt password hashing")
    pdf.table_row("Infrastructure", "Docker Compose, multi-stage builds")
    pdf.table_row("CI/CD", "GitHub Actions (5 jobs: lint, test, build, Docker)")
    pdf.ln(4)

    # ── Features ──
    pdf.section_title("3. Features")

    pdf.subsection("Event Ingestion")
    pdf.bullet("High-throughput REST API for batch event collection (up to 1000 events/batch)")
    pdf.bullet("API key authentication per project (X-API-Key header)")
    pdf.bullet("Automatic timestamp assignment if not provided")

    pdf.subsection("Real-Time Streaming")
    pdf.bullet("WebSocket-powered live event dashboard using Redis pub/sub")
    pdf.bullet("JWT-authenticated WebSocket connections with project ownership verification")
    pdf.bullet("Exponential backoff reconnection (up to 10 attempts)")

    pdf.subsection("Analytics Dashboard")
    pdf.bullet("Time-series event counts bucketed by hour or day")
    pdf.bullet("Event breakdowns by level (error, warning, info)")
    pdf.bullet("Error rate calculation and top event rankings")
    pdf.bullet("Configurable periods: 24h, 7d, 30d")

    pdf.subsection("Alert System")
    pdf.bullet("Configurable threshold-based alert rules per event name")
    pdf.bullet("Sliding window evaluation on each event ingest")
    pdf.bullet("Level filtering support (e.g., only trigger on errors)")
    pdf.bullet("Full CRUD for alert rules with enable/disable toggle")

    pdf.subsection("AI Anomaly Detection")
    pdf.bullet("OpenAI GPT-4o-mini integration for pattern analysis")
    pdf.bullet("Structured JSON response: analysis, anomalies, recommendations")
    pdf.bullet("Aggregated event summaries sent as context (last N hours)")

    pdf.subsection("Multi-Project Support")
    pdf.bullet("Isolated projects with individual API keys and dashboards")
    pdf.bullet("Owner-scoped data access (all queries filter by user_id)")
    pdf.bullet("API key regeneration endpoint")

    # ── Architecture ──
    pdf.add_page()
    pdf.section_title("4. Architecture")
    pdf.body_text(
        "The system follows a layered architecture with clear separation of concerns:"
    )
    pdf.body_text(
        "Angular Frontend --> Nginx Reverse Proxy --> Rust API (Axum)\n"
        "    |-- PostgreSQL (events, users, projects, alerts)\n"
        "    |-- Redis (pub/sub for WebSocket, sliding-window rate limiting)\n"
        "    |-- OpenAI API (anomaly detection)"
    )

    pdf.subsection("Backend Structure")
    pdf.bullet("handlers/ - Route handlers for auth, events, projects, dashboard, alerts, WebSocket")
    pdf.bullet("middleware/ - JWT auth extractor, API key extractor, Redis rate limiter")
    pdf.bullet("services/ - AI analysis service, event processor (Redis pub/sub + alert evaluation)")
    pdf.bullet("models/ - Strongly-typed structs with SQLx FromRow derivation")
    pdf.bullet("error.rs - Centralized error enum with thiserror + IntoResponse")
    pdf.bullet("config.rs - Environment-based configuration with validation")

    pdf.subsection("Frontend Structure")
    pdf.bullet("7 page components: Login, Dashboard, Events, Projects, Project Detail, Alerts, Settings")
    pdf.bullet("7 services: Auth, API, Project, Event, Alert, WebSocket, Dashboard")
    pdf.bullet("7 shared components: Sidebar, Header, Stats Card, Chart, Event Table, Alert Badge, Loading")
    pdf.bullet("Auth guard with route protection, HTTP interceptor for JWT injection")
    pdf.bullet("Lazy-loaded routes for optimal bundle size")

    # ── API Endpoints ──
    pdf.section_title("5. API Endpoints")
    pdf.table_row("Endpoint", "Description", bold=True)
    pdf.table_row("POST /auth/register", "Create account with email, password, name")
    pdf.table_row("POST /auth/login", "Authenticate and receive JWT token")
    pdf.table_row("GET /projects", "List user's projects (JWT)")
    pdf.table_row("POST /projects", "Create project with auto-generated API key")
    pdf.table_row("GET /projects/:id", "Get project details (owner-scoped)")
    pdf.table_row("PUT /projects/:id", "Update project name/description")
    pdf.table_row("DELETE /projects/:id", "Delete project and cascade events")
    pdf.table_row("POST /projects/:id/api-key", "Regenerate project API key")
    pdf.table_row("POST /events/ingest", "Batch ingest events (API key auth)")
    pdf.table_row("GET /dashboard/stats", "Aggregate stats by period")
    pdf.table_row("GET /dashboard/timeline", "Time-bucketed event counts")
    pdf.table_row("POST /alerts/rules", "Create alert rule")
    pdf.table_row("GET /alerts/rules/:pid", "List alert rules for project")
    pdf.table_row("GET /alerts/history/:pid", "Alert trigger history")
    pdf.table_row("POST /ai/analyze", "AI anomaly analysis (OpenAI)")
    pdf.table_row("WS /ws/events/:pid", "Live event WebSocket stream")
    pdf.ln(4)

    # ── Security ──
    pdf.add_page()
    pdf.section_title("6. Security Audit & Hardening")
    pdf.body_text(
        "A comprehensive pre-commit security audit was performed following the project's mandatory "
        "security checklist. The following critical and high-severity issues were identified and fixed:"
    )

    pdf.subsection("Critical Fixes")
    pdf.bullet("SQL Injection: Replaced format! string interpolation with parameterized $N bind queries in all dashboard handlers")
    pdf.bullet("CORS: Replaced allow_origin(Any) with configurable CORS_ORIGINS environment variable")
    pdf.bullet("WebSocket Auth: Added JWT validation and project ownership verification before WebSocket upgrade")
    pdf.bullet("Hardcoded Secrets: Removed all hardcoded passwords/secrets from docker-compose.yml; now requires .env")

    pdf.subsection("High-Priority Fixes")
    pdf.bullet("Email format validation and input length limits added to registration")
    pdf.bullet("Frontend nginx container now runs as non-root user")
    pdf.bullet("Security headers added: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy")
    pdf.bullet("Mock API keys changed from pw_live_ to obviously fake pw_demo_ prefix")
    pdf.bullet(".gitignore extended with *.pem, *.key, *.p12, *.pfx, *.crt coverage")

    pdf.subsection("Security Design Patterns")
    pdf.bullet("All SQL queries use parameterized binding (sqlx $N params)")
    pdf.bullet("Passwords hashed with bcrypt at DEFAULT_COST")
    pdf.bullet("JWT tokens with configurable expiration (default 24h)")
    pdf.bullet("Redis sliding-window rate limiter on all API endpoints")
    pdf.bullet("Owner-scoped queries: every data access filters by user_id")
    pdf.bullet("Multi-stage Docker builds with non-root users in both containers")
    pdf.bullet("No secrets in source code; all via environment variables")

    # ── CI/CD ──
    pdf.section_title("7. CI/CD Pipeline")
    pdf.body_text("GitHub Actions workflow with 5 jobs running on every push and PR to main:")

    pdf.table_row("Job", "Description", bold=True)
    pdf.table_row("Backend Check & Lint", "cargo fmt --check + cargo clippy -D warnings + cargo build --release")
    pdf.table_row("Backend Tests", "PostgreSQL + Redis services, migrations, cargo test")
    pdf.table_row("Frontend Lint", "Angular linting via ng lint")
    pdf.table_row("Frontend Build", "Production build with ng build --configuration=production")
    pdf.table_row("Docker Build", "Multi-stage builds for both API and frontend images")
    pdf.ln(4)

    # ── Database Schema ──
    pdf.section_title("8. Database Schema")
    pdf.body_text("PostgreSQL schema with 5 tables and proper indexing:")
    pdf.bullet("users - id (UUID PK), email (unique), password_hash, name, timestamps")
    pdf.bullet("projects - id (UUID PK), name, description, api_key (unique), owner_id (FK users), timestamps")
    pdf.bullet("events - id (UUID PK), project_id (FK), name, level, payload (JSONB), timestamp, created_at")
    pdf.bullet("alert_rules - id (UUID PK), project_id (FK), name, event_name, level_filter, threshold, window_seconds, enabled")
    pdf.bullet("alerts - id (UUID PK), rule_id (FK), project_id (FK), message, event_count, triggered_at")
    pdf.body_text("Indexes on: events(project_id, created_at), events(project_id, name), projects(api_key), projects(owner_id)")

    # ── Environment ──
    pdf.add_page()
    pdf.section_title("9. Configuration")
    pdf.table_row("Variable", "Purpose", bold=True)
    pdf.table_row("DATABASE_URL", "PostgreSQL connection string")
    pdf.table_row("REDIS_URL", "Redis connection (with password)")
    pdf.table_row("JWT_SECRET", "JWT signing secret (min 32 chars)")
    pdf.table_row("OPENAI_API_KEY", "OpenAI API key (optional)")
    pdf.table_row("CORS_ORIGINS", "Allowed CORS origins (comma-separated)")
    pdf.table_row("RATE_LIMIT_REQUESTS", "Max requests per window (default 100)")
    pdf.table_row("RATE_LIMIT_WINDOW_SECS", "Rate limit window in seconds (default 60)")
    pdf.table_row("JWT_EXPIRATION_HOURS", "Token expiry (default 24h)")
    pdf.ln(4)

    # ── Quick Start ──
    pdf.section_title("10. Quick Start")
    pdf.subsection("Docker (Recommended)")
    pdf.body_text(
        "1. cp .env.example .env\n"
        "2. Edit .env with your passwords and JWT secret\n"
        "3. docker compose up --build\n"
        "4. Frontend: http://localhost:4200 | API: http://localhost:8080"
    )
    pdf.subsection("Local Development")
    pdf.body_text(
        "1. docker compose up -d postgres redis\n"
        "2. cd backend && cargo run\n"
        "3. cd frontend && npm install && ng serve"
    )

    # ── Summary ──
    pdf.section_title("11. Portfolio Value")
    pdf.body_text(
        "PulseWave demonstrates the following skills relevant to senior full-stack engineering roles:"
    )
    pdf.bullet("Rust systems programming with async/await (Tokio, Axum)")
    pdf.bullet("Angular 19 with modern patterns (standalone components, signals, lazy loading)")
    pdf.bullet("Real-time systems with WebSocket + Redis pub/sub")
    pdf.bullet("AI integration with structured prompt engineering (OpenAI)")
    pdf.bullet("Production security practices (parameterized queries, JWT, rate limiting, CORS)")
    pdf.bullet("Infrastructure-as-code with Docker Compose and multi-stage builds")
    pdf.bullet("CI/CD pipeline design with GitHub Actions")
    pdf.bullet("Database design with PostgreSQL (JSONB, indexing, cascading deletes)")

    # Output
    output_path = os.path.join(os.path.dirname(__file__), "PulseWave_Project_Report.pdf")
    pdf.output(output_path)
    print(f"Report generated: {output_path}")


if __name__ == "__main__":
    main()
