# Project Architecture

```
┌─────────────────────────┐         ┌──────────────────────────┐
│  React + Vite Frontend  │  HTTPS  │   FastAPI Backend        │
│  (port 5173)            │ ───────▶│   (port 8000)            │
│  - LoginPage            │         │   - /api/auth            │
│  - AdminDashboard       │         │   - /api/risk            │
│  - RiskAnalysisPage     │         │   - /api/transactions    │
│  - TransactionsPage     │         │   - /api/dashboard       │
│  - Alerts / Cases       │         │   - /api/alerts          │
└─────────────────────────┘         │   - /api/cases           │
                                    └────────────┬─────────────┘
                                                 │
                                                 ▼
                                       ┌────────────────────┐
                                       │  Risk Engine       │
                                       │  (pure functions)  │
                                       └──────────┬─────────┘
                                                  │
                                                  ▼
                                       ┌────────────────────┐
                                       │  SQLAlchemy ORM    │
                                       │  + SQLite DB       │
                                       └────────────────────┘
```

## Backend layout

- `main.py` - FastAPI entry, CORS, startup hooks (table creation + seed)
- `app/config.py` - settings loaded from env (with safe defaults)
- `app/database.py` - SQLAlchemy engine, session, declarative Base
- `app/models/` - ORM models for users, devices, login events, transactions,
  alerts, fraud cases
- `app/schemas/` - Pydantic request / response models
- `app/services/` - business logic: risk_service, device, location, alert, case
- `app/routes/` - HTTP routers, one per domain
- `app/seed/seed_data.py` - idempotent demo seed (only runs when DB is empty)
- `app/init_db.py` - creates tables and seeds on startup
- `app/utils/` - small helpers (time, response shapes)

## Frontend layout

- `src/main.jsx` + `src/App.jsx` - React/Vite entry
- `src/api/` - thin Axios wrappers per domain
- `src/components/` - shared UI (Navbar, Sidebar, RiskBadge, RiskScoreCard, ...)
- `src/charts/` - Recharts-based visualisations
- `src/pages/` - route-level screens
- `src/routes/AppRoutes.jsx` - React Router definitions
- `src/utils/` - constants, formatters, risk helpers
- `src/index.css` - global styling

## Data flow for a login attempt

1. User submits the login form on `LoginPage`.
2. Frontend calls `POST /api/auth/login`.
3. Backend looks up the user, checks password, builds the signal vector.
4. `risk_service.calculate_login_risk` produces score + level + reasons + action.
5. A `LoginEvent` row is persisted. Devices are upserted on success.
6. If the level is Medium / High / Critical, an `Alert` is created.
7. If High / Critical, a `FraudCase` is created and linked to the alert.
8. The frontend renders the score card, reasons, and recommended action.

## Why SQLite

The hackathon prototype favours zero-config setup. SQLite ships with Python and
needs no server. The same SQLAlchemy code works against PostgreSQL by changing
the `DATABASE_URL` env variable.
