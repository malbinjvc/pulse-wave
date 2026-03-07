# PulseWave Security Audit Error Log

**Audit Date:** 2026-03-07
**Auditor:** Claude Code (Pre-Commit Security Audit)
**Status:** All critical/high issues FIXED

---

## CRITICAL Issues Found & Fixed

### 1. SQL Injection via `format!` in dashboard.rs
- **Location:** `backend/src/handlers/dashboard.rs:95-103, 131-142, 180-189`
- **Issue:** Used Rust `format!` macro to interpolate values directly into SQL queries. Even though inputs were whitelist-validated, this pattern bypasses parameterized query protections.
- **Fix:** Replaced all `format!` SQL with parameterized queries using `$N` bind parameters. Changed `INTERVAL '{}'` to `($N || ' hours')::INTERVAL` with bound values.

### 2. CORS Allows All Origins
- **Location:** `backend/src/main.rs:99-102`
- **Issue:** `CorsLayer::new().allow_origin(Any)` allowed cross-origin requests from any domain, enabling CSRF-like attacks.
- **Fix:** Changed to `AllowOrigin::list(origins)` reading from `CORS_ORIGINS` env var (defaults to `http://localhost:4200`).

### 3. WebSocket Endpoint Had NO Authentication
- **Location:** `backend/src/handlers/websocket.rs:13-18`
- **Issue:** Any client knowing a project UUID could subscribe to live event streams without authentication. The frontend sent `?token=` but the backend completely ignored it.
- **Fix:** Added JWT validation from the `token` query parameter and project ownership verification before upgrading the WebSocket connection.

### 4. Hardcoded Secrets in docker-compose.yml
- **Location:** `docker-compose.yml:6,36,38`
- **Issue:** `POSTGRES_PASSWORD: pulsewave` and `JWT_SECRET: change-me-in-production-min-32-chars-long` were hardcoded in the committed docker-compose file.
- **Fix:** Replaced all secrets with `${VAR:?error message}` environment variable references that require `.env` file configuration. Added `POSTGRES_PASSWORD`, `JWT_SECRET`, `REDIS_PASSWORD` as required variables.

---

## HIGH Issues Found & Fixed

### 5. Mock API Keys in Frontend Source
- **Location:** `frontend/src/app/pages/projects/projects.component.ts:173,182,191` and `project-detail.component.ts:141`
- **Issue:** Keys like `pw_live_a1b2c3d4e5f6g7h8i9j0` looked like real API keys. While they were demo fallback data, the `pw_live_` prefix could be confused for production keys.
- **Fix:** Changed to obviously fake `pw_demo_xxxxxxxx...` format.

### 6. No Email Format Validation
- **Location:** `backend/src/handlers/auth.rs:16`
- **Issue:** Register endpoint only checked `is_empty()` — no email format validation.
- **Fix:** Added basic email validation (contains `@` and `.`, length 5-254) and name length cap (100 chars). Email is now trimmed and lowercased.

### 7. Frontend Docker Runs as Root
- **Location:** `frontend/Dockerfile`
- **Issue:** nginx container ran as root user.
- **Fix:** Added `USER nginx` directive with proper directory ownership setup.

### 8. No Security Headers in nginx
- **Location:** `frontend/nginx.conf`
- **Issue:** Missing `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`.
- **Fix:** Added all five security headers.

### 9. Missing .gitignore Entries
- **Location:** `.gitignore`
- **Issue:** Missing coverage for `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.crt`, `*.cer`, `.env.production`.
- **Fix:** Added all entries.

---

## MEDIUM Issues (Noted, Acceptable for Portfolio Project)

| # | Issue | Status |
|---|-------|--------|
| 10 | Redis exposed without password | FIXED (added `--requirepass`) |
| 11 | PostgreSQL exposed with weak default password | FIXED (requires `.env` config) |
| 12 | No JWT revocation mechanism | NOTED — acceptable for demo |
| 13 | No HTTPS enforcement in nginx | NOTED — handled at infrastructure level |

---

## Checklist Compliance

- [x] Hardcoded credentials & secrets — cleaned
- [x] Sensitive file exposure — .gitignore updated, no .env files tracked
- [x] SQL injection — all queries parameterized
- [x] XSS & input validation — Angular handles output escaping; input validation added
- [x] Authentication & authorization — WebSocket auth added, all endpoints protected
- [x] CORS & headers — restricted origins, security headers added
- [x] Docker security — multi-stage builds, non-root users in both containers
- [x] No private keys found in repo
- [x] No real API keys or tokens in source
