# PulseWave

Real-time event analytics platform for monitoring, alerting, and AI-powered anomaly detection.

## Tech Stack

**Backend:** Rust (Axum), PostgreSQL, Redis
**Frontend:** Angular 19, Tailwind CSS
**AI:** OpenAI GPT-4o for anomaly detection
**Infrastructure:** Docker Compose

## Features

- **Event Ingestion** — High-throughput REST API for batch event collection via API keys
- **Real-Time Streaming** — WebSocket-powered live event dashboard with Redis pub/sub
- **Analytics Dashboard** — Time-series charts, event breakdowns, error rate tracking
- **Alert Rules** — Configurable threshold alerts evaluated on event ingest
- **AI Anomaly Detection** — OpenAI-powered analysis of event patterns and anomalies
- **Multi-Project** — Isolated projects with individual API keys and dashboards
- **Rate Limiting** — Redis sliding-window rate limiter on all endpoints

## Architecture

```
Angular Frontend → Nginx → Rust API (Axum)
                              ├── PostgreSQL (events, users, projects)
                              ├── Redis (pub/sub, rate limiting, caching)
                              └── OpenAI API (anomaly detection)
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Rust 1.75+ (for local development)
- Node.js 20+ (for local development)

### Docker (recommended)
```bash
cp .env.example .env
# Edit .env with your OPENAI_API_KEY
docker compose up --build
# Frontend: http://localhost:4200
# API: http://localhost:8080
```

### Local Development

**Infrastructure:**
```bash
docker compose up -d postgres redis
```

**Backend:**
```bash
cd backend
cp ../.env.example ../.env
cargo run
# API running at http://localhost:8080
```

**Frontend:**
```bash
cd frontend
npm install
ng serve
# App running at http://localhost:4200
```

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Login, returns JWT |

### Projects
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/projects` | List user projects |
| POST | `/api/v1/projects` | Create project |
| GET | `/api/v1/projects/:id` | Get project |
| PUT | `/api/v1/projects/:id` | Update project |
| DELETE | `/api/v1/projects/:id` | Delete project |
| POST | `/api/v1/projects/:id/regenerate-key` | Regenerate API key |

### Events
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/events/ingest` | API Key | Batch ingest events |
| GET | `/api/v1/events?project_id=` | JWT | List events with filters |

### Dashboard
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/dashboard/stats?project_id=&period=` | Aggregate statistics |
| GET | `/api/v1/dashboard/timeline?project_id=&period=` | Time-bucketed counts |

### Alerts
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/alerts/rules?project_id=` | List alert rules |
| POST | `/api/v1/alerts/rules` | Create alert rule |
| PUT | `/api/v1/alerts/rules/:id` | Update alert rule |
| DELETE | `/api/v1/alerts/rules/:id` | Delete alert rule |
| GET | `/api/v1/alerts?project_id=` | Alert history |

### AI & WebSocket
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/ai/analyze` | AI anomaly analysis |
| WS | `/api/v1/ws/events/:project_id` | Live event stream |

### Event Ingestion Example
```bash
curl -X POST http://localhost:8080/api/v1/events/ingest \
  -H "X-API-Key: your-project-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {"name": "user.signup", "level": "info", "payload": {"plan": "pro"}},
      {"name": "payment.failed", "level": "error", "payload": {"code": "card_declined"}}
    ]
  }'
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `REDIS_URL` | Yes | — | Redis connection string |
| `JWT_SECRET` | Yes | — | JWT signing secret (min 32 chars) |
| `OPENAI_API_KEY` | No | — | OpenAI API key for AI features |
| `HOST` | No | `127.0.0.1` | Server bind address |
| `PORT` | No | `8080` | Server port |
| `RUST_LOG` | No | `info` | Log level |

## License

MIT
