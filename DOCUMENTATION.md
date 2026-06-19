# AccountGuard AI - Full Documentation

AI-Based Account Takeover Detection System. Hackathon prototype that detects
suspicious bank login and transaction activity using an explainable rule-based
risk engine, with a clean React dashboard and a FastAPI backend on SQLite.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [Tech Stack](#3-tech-stack)
4. [Folder Structure](#4-folder-structure)
5. [Architecture](#5-architecture)
6. [Risk Scoring Engine](#6-risk-scoring-engine)
7. [Database Schema](#7-database-schema)
8. [API Reference](#8-api-reference)
9. [Frontend Pages and Components](#9-frontend-pages-and-components)
10. [Setup and Run](#10-setup-and-run)
11. [Demo Scenarios](#11-demo-scenarios)
12. [Testing](#12-testing)
13. [Security and Data Notes](#13-security-and-data-notes)
14. [Troubleshooting](#14-troubleshooting)
15. [Future Scope](#15-future-scope)

---

## 1. Problem Statement

Account Takeover (ATO) attacks are one of the largest sources of online banking
fraud. An attacker who steals a customer's credentials can:

- Log in from a brand new device.
- Connect from an unusual city or country.
- Attempt logins at odd hours (12 AM - 5 AM).
- Make repeated failed attempts (credential stuffing).
- Move money to a new beneficiary in large amounts.

Static rules ("block country X", "allow IP range Y") generate too many false
positives and are easy for attackers to evade. Manual fraud review queues cannot
keep up with the volume of digital transactions.

AccountGuard AI demonstrates a practical, explainable risk engine that scores
each login and transaction against multiple behavioural signals, returns a
plain-English explanation, and recommends a concrete action.

## 2. Solution Overview

The system has three layers:

1. **Risk engine** - pure functions over the request and the customer profile.
   Produces `risk_score` (0-100), `risk_level` (Low / Medium / High / Critical),
   `risk_reasons[]`, and `recommended_action`.
2. **Backend API** - FastAPI with SQLAlchemy + SQLite. Persists login events,
   transactions, devices, alerts and fraud cases. Auto-creates Medium+ alerts
   and High/Critical fraud cases.
3. **Admin dashboard** - React + Vite app with charts (Recharts) and workflow
   pages for Alerts and Cases.

Key features:

- Customer login simulation with risk analysis.
- New device, new location, night-time, failed attempt, suspicious IP signals.
- Transaction risk: amount, new beneficiary, location, time.
- Recommended action per risk level (allow / step-up / block / freeze).
- Auto-generated alerts and fraud cases.
- Admin dashboard with totals and charts.
- Demo seed data so the dashboard works on first run.
- Synthetic data only.

## 3. Tech Stack

| Layer       | Technology                                     |
|-------------|------------------------------------------------|
| Frontend    | React 18, Vite, JavaScript, React Router, Axios, Recharts, plain CSS |
| Backend     | Python 3.10+, FastAPI, Uvicorn, Pydantic       |
| ORM         | SQLAlchemy                                     |
| Database    | SQLite (`backend/accountguard.db`, auto-created) |
| Tests       | pytest                                         |

## 4. Folder Structure

```
accountguard-ai/
├── README.md                Quick start
├── DOCUMENTATION.md         This file (full reference)
├── .gitignore, .env.example
│
├── backend/
│   ├── requirements.txt
│   ├── main.py              FastAPI entry, lifespan, CORS, routers
│   └── app/
│       ├── config.py        env-driven settings
│       ├── database.py      engine, SessionLocal, Base
│       ├── init_db.py       create_all + seed-on-empty
│       ├── models/          ORM: user, device, login, transaction, alert, case
│       ├── schemas/         Pydantic request/response models
│       ├── routes/          auth, risk, transactions, dashboard, alerts, cases
│       ├── services/        risk engine, device, location, alert, case, txn helpers
│       ├── seed/seed_data.py
│       └── utils/           response + time helpers
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx, App.jsx, index.css
│       ├── api/             apiClient + 6 domain wrappers
│       ├── components/      Navbar, Sidebar, Layout, RiskBadge, RiskScoreCard, StatCard, AlertCard, Loader
│       ├── pages/           LoginPage, AdminDashboard, RiskAnalysisPage, TransactionsPage, AlertsPage, CasesPage, NotFoundPage
│       ├── charts/          RiskDistributionChart, FraudReasonChart, LoginTrendChart
│       ├── routes/AppRoutes.jsx
│       └── utils/           constants, formatDate, riskUtils
│
├── database/
│   ├── schema.sql           Reference DDL
│   └── sample_data.sql      Reference inserts
│
├── docs/
│   ├── problem_statement.md
│   ├── project_architecture.md
│   └── api_documentation.md
│
└── tests/
    ├── test_risk_score.py
    └── test_api_health.py
```

## 5. Architecture

```
┌─────────────────────────┐         ┌──────────────────────────┐
│  React + Vite Frontend  │  HTTP   │   FastAPI Backend        │
│  (port 5173)            │ ──────▶ │   (port 8000)            │
│                         │         │                          │
│  Login / Dashboard /    │         │   /api/auth /api/risk    │
│  Risk Analysis /        │         │   /api/transactions      │
│  Transactions /         │         │   /api/dashboard         │
│  Alerts / Cases         │         │   /api/alerts /api/cases │
└─────────────────────────┘         └────────────┬─────────────┘
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

### Data flow for a login attempt

1. User submits the login form on `LoginPage`.
2. Frontend calls `POST /api/auth/login`.
3. Backend looks up the user, checks password, builds the signal set.
4. `risk_service.calculate_login_risk` returns score + level + reasons + action.
5. A `LoginEvent` row is persisted; devices are upserted on success.
6. If level is Medium / High / Critical, an `Alert` is created.
7. If level is High / Critical, a `FraudCase` is created and linked.
8. The frontend renders the score card with reasons and recommended action.

## 6. Risk Scoring Engine

The engine lives in `backend/app/services/risk_service.py`. It is a pure
function over the request data and the user profile. All thresholds are easy to
tweak in one file.

### Login signals

| Signal                                         | Points |
|------------------------------------------------|--------|
| Unknown user email                             | +30    |
| Failed login / wrong password                  | +20    |
| New / unknown device                           | +25    |
| Missing device information                     | +10    |
| Unusual city                                   | +20    |
| Unusual country                                | +25    |
| Night login (00:00 - 04:59)                    | +15    |
| Login outside user's usual hours (non-night)   | +10    |
| Suspicious IP (placeholder rule)               | +10    |

### Transaction signals

| Signal                                          | Points |
|-------------------------------------------------|--------|
| Amount > 3 × user's `average_transaction_amount`| +25    |
| Amount > 50,000                                 | +20    |
| Amount > 100,000                                | +30    |
| New beneficiary                                 | +25    |
| Transaction at night (00:00 - 04:59)            | +15    |
| Transaction city != usual city                  | +15    |
| Transaction country != usual country            | +25    |

### Levels (cap at 100)

- 0-30 - **Low**
- 31-60 - **Medium**
- 61-85 - **High**
- 86-100 - **Critical**

### Recommended actions

| Level    | Login                                      | Transaction                               |
|----------|--------------------------------------------|-------------------------------------------|
| Low      | Allow login                                | Process transaction                       |
| Medium   | Step-up verification required              | Ask OTP or face verification              |
| High     | Block login and alert fraud team           | Block transaction and send to fraud review|
| Critical | Block account temporarily, create case     | Block transaction and freeze session      |

### Why this approach

- **Explainable**: every score has a list of contributing reasons.
- **Lightweight**: runs in milliseconds, easy to A/B test.
- **ML-ready**: signal extraction is decoupled from scoring, so the same
  features can later feed a supervised fraud model.

## 7. Database Schema

SQLite file: `backend/accountguard.db` (auto-created by SQLAlchemy on startup).

### users

| Column                       | Type    | Notes                |
|------------------------------|---------|----------------------|
| id                           | INTEGER | PK                   |
| name                         | TEXT    |                      |
| email                        | TEXT    | UNIQUE               |
| password                     | TEXT    | plain text, demo only|
| phone                        | TEXT    |                      |
| role                         | TEXT    | customer / admin     |
| usual_city                   | TEXT    |                      |
| usual_country                | TEXT    |                      |
| usual_device_id              | TEXT    |                      |
| usual_login_start_hour       | INTEGER |                      |
| usual_login_end_hour         | INTEGER |                      |
| average_transaction_amount   | REAL    |                      |
| created_at                   | TS      |                      |

### devices
`id, user_id, device_id, device_name, browser, os, is_trusted, first_seen, last_seen`

### login_events
`id, user_id, email, device_id, browser, os, ip_address, city, country,
login_hour, is_successful, risk_score, risk_level, risk_reasons,
recommended_action, created_at`

`risk_reasons` is a comma-separated string for portability.

### transactions
`id, user_id, amount, beneficiary_id, beneficiary_name, is_new_beneficiary,
city, country, transaction_hour, risk_score, risk_level, risk_reasons, status,
created_at`

`status` ∈ {Success, Verification Required, Blocked}.

### alerts
`id, user_id, alert_type, risk_level, message, status, created_at`

`status` ∈ {Open, Reviewing, Resolved, False Positive}.

### fraud_cases
`id, user_id, alert_id, risk_score, case_status, admin_notes, created_at, updated_at`

`case_status` ∈ {Pending, Under Review, Blocked, Resolved, False Positive}.

The reference DDL is in `database/schema.sql`.

## 8. API Reference

Interactive Swagger UI: **http://localhost:8000/docs**
ReDoc: **http://localhost:8000/redoc**

### Health

| Method | Path           | Response                                      |
|--------|----------------|-----------------------------------------------|
| GET    | `/`            | `{ "message": "AccountGuard AI backend is running" }` |
| GET    | `/api/health`  | `{ "status": "ok", "service": "AccountGuard AI" }`    |

### Auth

#### POST /api/auth/login

Request:
```json
{
  "email": "jyot@example.com",
  "password": "123456",
  "device_id": "android_001",
  "device_name": "Samsung Android",
  "browser": "Chrome",
  "os": "Android",
  "ip_address": "192.168.1.10",
  "city": "Surat",
  "country": "India",
  "login_hour": 11
}
```

Response:
```json
{
  "success": true,
  "message": "Login processed",
  "user": { "id": 1, "name": "Jyot Vanani", "email": "jyot@example.com", "role": "customer" },
  "risk_score": 0,
  "risk_level": "Low",
  "risk_reasons": ["Known device", "Known location", "Normal login time"],
  "recommended_action": "Allow login"
}
```

Notes:
- Wrong passwords still create a `LoginEvent` and contribute `+20` to the score.
- An `Alert` is auto-created for Medium / High / Critical.
- A `FraudCase` is auto-created for High / Critical.

### Risk

#### POST /api/risk/analyze-login
Same payload shape as login (no password required). Returns score / level /
reasons / action without persisting.

#### GET /api/risk/user/{user_id}
Returns the most recent 50 login events for a user.

### Transactions

#### POST /api/transactions
```json
{
  "user_id": 1,
  "amount": 90000,
  "beneficiary_id": "BEN999",
  "beneficiary_name": "Unknown Receiver",
  "is_new_beneficiary": true,
  "city": "Delhi",
  "country": "India",
  "transaction_hour": 2
}
```

#### GET /api/transactions
Returns the full transaction history (most recent first).

### Dashboard

| Method | Path                                | Returns                       |
|--------|-------------------------------------|-------------------------------|
| GET    | `/api/dashboard/summary`            | `{ total_users, total_logins, total_transactions, total_alerts, high_risk_logins, open_cases }` |
| GET    | `/api/dashboard/risk-distribution`  | `[{ name: "Low", value: 12 }, ...]` |
| GET    | `/api/dashboard/fraud-reasons`      | `[{ reason, count }, ...]`    |
| GET    | `/api/dashboard/login-trends`       | last 7 days, `[{ date, logins, suspicious }]` |

### Alerts

| Method | Path                       | Body                       |
|--------|----------------------------|----------------------------|
| GET    | `/api/alerts`              | -                          |
| PATCH  | `/api/alerts/{alert_id}`   | `{ "status": "Resolved" }` |

### Cases

| Method | Path                       | Body                                                     |
|--------|----------------------------|----------------------------------------------------------|
| GET    | `/api/cases`               | -                                                        |
| PATCH  | `/api/cases/{case_id}`     | `{ "case_status": "Under Review", "admin_notes": "..." }` |

### Error format

FastAPI raises `HTTPException` with a JSON body like:
```json
{ "detail": "Alert not found" }
```

## 9. Frontend Pages and Components

### Routes

| Path             | Page                  |
|------------------|-----------------------|
| `/`              | LoginPage             |
| `/dashboard`     | AdminDashboard        |
| `/risk-analysis` | RiskAnalysisPage      |
| `/transactions`  | TransactionsPage      |
| `/alerts`        | AlertsPage            |
| `/cases`         | CasesPage             |
| `*`              | NotFoundPage          |

### Pages

- **LoginPage** - form with email, password, device id/name, browser, OS, IP,
  city, country, login hour. Four preset buttons (Normal, Suspicious, Critical,
  Admin). Calls `POST /api/auth/login` and renders the risk card.
- **AdminDashboard** - 6 stat cards plus 3 charts (risk pie, top reasons bar,
  7-day login trend line) and a recent alerts strip.
- **RiskAnalysisPage** - quick "what-if" tester for the engine without
  persisting (`POST /api/risk/analyze-login`).
- **TransactionsPage** - submit a transaction with 3 preset buttons
  (Normal / High / Critical) and see the full transaction table.
- **AlertsPage** - table of all alerts with inline status update.
- **CasesPage** - fraud cases with status + admin notes editing.
- **NotFoundPage** - simple 404.

### Components

`Navbar`, `Sidebar`, `Layout`, `RiskBadge`, `RiskScoreCard`, `StatCard`,
`AlertCard`, `Loader`.

### Charts (Recharts)

- `RiskDistributionChart` - pie chart of login risk levels.
- `FraudReasonChart` - bar chart of top reason counts.
- `LoginTrendChart` - line chart with `logins` and `suspicious` series.

### API client

`src/api/apiClient.js` is a single Axios instance using
`import.meta.env.VITE_API_BASE_URL` with a fallback of
`http://localhost:8000/api`. Domain modules
(`authApi`, `riskApi`, `transactionApi`, `dashboardApi`, `alertApi`, `caseApi`)
wrap individual endpoints.

### Styling

Plain CSS in `src/index.css`. Soft shadows, 12px radius, dark blue sidebar,
green/orange/red/dark-red badges for Low/Medium/High/Critical.

## 10. Setup and Run

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

### Backend

Windows:
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Mac / Linux:
```
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend serves at http://localhost:8000. Swagger at http://localhost:8000/docs.

### Frontend

```
cd frontend
npm install
npm run dev
```

Frontend serves at http://localhost:5173. Optional: copy
`frontend/.env.example` to `frontend/.env` and set
`VITE_API_BASE_URL=http://localhost:8000/api` if needed.

## 11. Demo Scenarios

The demo seed inserts 2 users, 2 devices, 5 login events, 3 transactions,
5 alerts, 3 fraud cases. The Login and Transactions pages have preset buttons
that auto-fill the form for these flows.

### Demo credentials

| Role     | Email             | Password |
|----------|-------------------|----------|
| Customer | jyot@example.com  | 123456   |
| Admin    | admin@example.com | admin123 |

### Login scenarios

1. **Normal Login** - known device, known city, normal hour. Risk Low, allow.
2. **Suspicious Login** - new Windows laptop, Delhi, 2 AM. Risk High, step-up.
3. **Critical Login** - wrong password, Russia, unknown Linux device, 3 AM.
   Risk Critical, block account, fraud case created.
4. **Admin Login** - admin user from Ahmedabad. Risk Low, allow.

### Transaction scenarios

1. **Normal** - ₹1,000 to known beneficiary in Surat at 14:00. Low, success.
2. **High Risk** - ₹90,000 to a new beneficiary in Delhi at 2 AM. High, blocked.
3. **Critical** - ₹1,50,000 to a foreign beneficiary in Russia at 3 AM.
   Critical, blocked.

After running any scenario, open the Dashboard, Alerts, and Cases pages to see
the engine output in context.

## 12. Testing

```
pip install pytest
pytest tests -q
```

Three risk-engine assertions plus a backend health smoke test (4 tests total).
The tests do not need a running server.

## 13. Security and Data Notes

This is a **hackathon prototype**. Do not use it as-is for real banking.

- Passwords are stored in plain text for demo simplicity.
- There is no JWT, session, or CSRF protection.
- CORS is permissive for the local dev server.
- All data is synthetic. No real customer info, IP geolocation, Aadhaar, PAN,
  or bank data is used.
- The "suspicious IP" rule is a placeholder that flags non-private addresses;
  it is not a real reputation feed.

For a production version, see [Future Scope](#15-future-scope).

## 14. Troubleshooting

**Backend port 8000 already in use**
- `netstat -ano | findstr :8000` (Windows) and kill the PID, or run on a
  different port: `uvicorn main:app --reload --port 8001` and point the
  frontend at it via `VITE_API_BASE_URL`.

**Frontend cannot reach the backend**
- Confirm both servers are running.
- Check the browser console: a CORS error usually means the frontend is calling
  a different origin. The backend allows 5173/3000 + `*` by default.

**Dashboard is empty on first run**
- The seed only fires when the `users` table is empty. Stop the backend, delete
  `backend/accountguard.db`, and start again to reset.

**`pip install` fails on Windows**
- Make sure your venv is activated (`venv\Scripts\activate`). If pyodbc /
  compiler errors appear, you can ignore them - this project only needs the
  packages in `requirements.txt`.

**`npm install` is slow or stalls**
- First install can take a few minutes. Retry with `npm install --no-audit
  --no-fund` to skip the audit phase.

## 15. Future Scope

1. Train a real ML model on historical fraud labels (gradient boosting / NN).
2. Device fingerprinting (canvas, WebGL, font hashing).
3. IP reputation API integration (e.g., MaxMind, IPQS).
4. Behavioural biometrics (typing rhythm, mouse movement).
5. OTP / face verification step-up integration.
6. Real-time event streaming with Kafka and an online feature store.
7. SIEM integration for security operations.
8. Fraud-team workflow (assign, escalate, SLA timers, audit log).
9. Explainable AI dashboard with SHAP-style feature attribution.
10. Multi-channel coverage: mobile banking, net banking, UPI, ATM, call center.

---

For a quick start, see [README.md](README.md).
For granular docs, see the `docs/` folder.
