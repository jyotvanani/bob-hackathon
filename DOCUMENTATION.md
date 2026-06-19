# AccountGuard AI - Full Documentation (v1.1)

AI-Based Account Takeover Detection System. Hackathon prototype that detects
suspicious bank login and transaction activity, blocks fake user traffic, and
catches onboarding fraud. Real-time traffic simulator + role-based auth +
Liquid Glass UI.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [Tech Stack](#3-tech-stack)
4. [Folder Structure](#4-folder-structure)
5. [Architecture](#5-architecture)
6. [Risk Engines](#6-risk-engines)
   - 6.1 Login Risk
   - 6.2 Transaction Risk
   - 6.3 Onboarding (KYC) Risk
   - 6.4 Fake Traffic Risk
7. [Real-Time Traffic Simulator](#7-real-time-traffic-simulator)
8. [Authentication and Roles](#8-authentication-and-roles)
9. [Database Schema](#9-database-schema)
10. [API Reference](#10-api-reference)
11. [Frontend Pages and Components](#11-frontend-pages-and-components)
12. [UI Theme - Liquid Glass](#12-ui-theme---liquid-glass)
13. [Setup and Run](#13-setup-and-run)
14. [Demo Scenarios](#14-demo-scenarios)
15. [Testing](#15-testing)
16. [Security and Data Notes](#16-security-and-data-notes)
17. [Troubleshooting](#17-troubleshooting)
18. [Future Scope](#18-future-scope)

---

## 1. Problem Statement

Account Takeover (ATO) attacks are one of the largest sources of online banking
fraud. An attacker who steals a customer's credentials can log in from a brand
new device, in an unusual geography, at odd hours, and quickly move funds to a
new beneficiary. Adjacent threats include synthetic / fake KYC onboarding and
automated bot traffic (credential stuffing, mass account creation, scraping).

Static rules generate too many false positives and are easy for attackers to
evade. Manual fraud queues cannot keep up with the volume of digital activity.

AccountGuard AI demonstrates four explainable risk engines and a real-time
traffic simulator that shows how a security operations dashboard reacts to a
live attack wave.

## 2. Solution Overview

Four rule-based risk engines:

- **Login risk** - new device, unusual city / country, night-time, failed
  attempts, suspicious IP.
- **Transaction risk** - high amount vs the customer's average, new
  beneficiary, unusual location and time.
- **Onboarding (KYC) risk** - duplicate identity, low document / selfie
  scores, age, country, fast form completion, OTP brute-force.
- **Fake traffic risk** - request frequency, repeated IP / device, suspicious
  user-agent, credential-stuffing patterns.

A traffic simulator background thread streams synthetic events into the engine.
The admin dashboard polls every 2 seconds while the simulator is running, so
all charts and stat cards update in real time.

A simple role-based auth layer routes Customers to a private home page and
Admins to the full security console.

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
├── README.md, DOCUMENTATION.md
├── .gitignore, .env.example
│
├── backend/
│   ├── requirements.txt, main.py
│   └── app/
│       ├── config.py, database.py, init_db.py
│       ├── models/      user, device, login_event, transaction,
│       │                alert, fraud_case, onboarding_application,
│       │                traffic_event
│       ├── schemas/     Pydantic request / response models
│       ├── routes/      auth, risk, transactions, dashboard, alerts,
│       │                cases, onboarding, traffic
│       ├── services/    risk_service, onboarding_service,
│       │                traffic_service, traffic_simulator,
│       │                device_service, location_service,
│       │                alert_service, case_service, transaction_service
│       ├── seed/seed_data.py
│       └── utils/       response, time helpers
│
├── frontend/
│   ├── package.json, vite.config.js, index.html
│   └── src/
│       ├── main.jsx, App.jsx, index.css
│       ├── api/         apiClient + 8 domain wrappers
│       ├── auth/        AuthContext, RequireAuth
│       ├── components/  Navbar, Sidebar, Layout, RiskBadge,
│       │                RiskScoreCard, StatCard, AlertCard, Loader
│       ├── pages/       AuthPage, UserHomePage, LoginPage,
│       │                AdminDashboard, RiskAnalysisPage,
│       │                TransactionsPage, AlertsPage, CasesPage,
│       │                OnboardingPage, TrafficMonitorPage,
│       │                NotFoundPage
│       ├── charts/      RiskDistribution, FraudReason, LoginTrend
│       ├── routes/AppRoutes.jsx
│       └── utils/       constants, formatDate, riskUtils
│
├── database/            Reference SQL files
├── docs/                Granular markdown docs
└── tests/               pytest tests
```

## 5. Architecture

```
┌───────────────────────────┐         ┌──────────────────────────────┐
│ React + Vite Frontend     │  HTTP   │ FastAPI Backend              │
│ (port 5173)               │ ──────▶ │ (port 8000)                  │
│                           │         │                              │
│ AuthPage                  │         │ /api/auth                    │
│ UserHomePage              │         │ /api/risk                    │
│ AdminDashboard            │         │ /api/transactions            │
│ RiskAnalysisPage          │         │ /api/dashboard               │
│ TransactionsPage          │         │ /api/alerts                  │
│ AlertsPage / CasesPage    │         │ /api/cases                   │
│ OnboardingPage            │         │ /api/onboarding              │
│ TrafficMonitorPage        │  poll   │ /api/traffic                 │
│  (live, 1.5s tick)        │ ◀────── │ /api/traffic/simulator       │
└───────────────────────────┘         └────────────┬─────────────────┘
                                                   │
                                                   ▼
                                       ┌────────────────────────────┐
                                       │ Risk Engines (pure fns)    │
                                       │ login / transaction /      │
                                       │ onboarding / traffic       │
                                       └──────────────┬─────────────┘
                                                      │
                                                      ▼
                                  ┌──────────────────────────────────┐
                                  │ SQLAlchemy ORM + SQLite DB       │
                                  │ users, devices, login_events,    │
                                  │ transactions, alerts,            │
                                  │ fraud_cases,                     │
                                  │ onboarding_applications,         │
                                  │ traffic_events                   │
                                  └──────────────────────────────────┘
                                                      ▲
                                                      │
                                       ┌────────────────────────────┐
                                       │ Traffic simulator thread   │
                                       │ inserts synthetic events   │
                                       └────────────────────────────┘
```

## 6. Risk Engines

All engines live under `backend/app/services/`. Each is a pure function over
the request data and the customer profile. Levels are derived from the score:

| Score    | Level      |
|----------|------------|
| 0-30     | Low        |
| 31-60    | Medium     |
| 61-85    | High       |
| 86-100   | Critical   |

Scores are capped at 100.

### 6.1 Login Risk (`risk_service.calculate_login_risk`)

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

Recommended action:

| Level    | Action                                                |
|----------|-------------------------------------------------------|
| Low      | Allow login                                           |
| Medium   | Step-up verification required                         |
| High     | Block login and alert fraud team                      |
| Critical | Block account temporarily and create fraud case       |

### 6.2 Transaction Risk (`risk_service.calculate_transaction_risk`)

| Signal                                          | Points |
|-------------------------------------------------|--------|
| Amount > 3 × user's `average_transaction_amount`| +25    |
| Amount > 50,000                                 | +20    |
| Amount > 100,000                                | +30    |
| New beneficiary                                 | +25    |
| Transaction at night (00:00 - 04:59)            | +15    |
| Transaction city != usual city                  | +15    |
| Transaction country != usual country            | +25    |

Status / action:

| Level    | Status                  | Action                                       |
|----------|-------------------------|----------------------------------------------|
| Low      | Success                 | Process transaction                          |
| Medium   | Verification Required   | Ask OTP or face verification                 |
| High     | Blocked                 | Block transaction and send to fraud review   |
| Critical | Blocked                 | Block transaction and freeze suspicious session |

### 6.3 Onboarding (KYC) Risk (`onboarding_service.calculate_onboarding_risk`)

| Signal                                                                   | Points |
|--------------------------------------------------------------------------|--------|
| Duplicate email already exists in users or applications                  | +25    |
| Duplicate phone already exists in users or applications                  | +25    |
| Duplicate document_id already exists in applications                     | +35    |
| Same device used for more than 3 onboarding applications                 | +25    |
| Same IP used for more than 5 onboarding applications                     | +25    |
| document_match_score < 60                                                | +25    |
| document_match_score < 40                                                | +40    |
| selfie_match_score < 60                                                  | +25    |
| selfie_match_score < 40                                                  | +40    |
| Both document and selfie scores < 40                                     | +15    |
| form_completion_seconds < 20                                             | +20    |
| form_completion_seconds < 10                                             | +30    |
| otp_attempts > 3                                                         | +20    |
| otp_attempts > 5                                                         | +30    |
| age below 18                                                             | +25    |
| country not India                                                        | +25    |

Special rule: a duplicate `document_id` always forces the level to at least
**High**, even if the score did not cross 61.

Decision:

| Level    | Decision                                            |
|----------|-----------------------------------------------------|
| Low      | Approve onboarding                                  |
| Medium   | Ask additional verification                         |
| High     | Send to manual review                               |
| Critical | Reject onboarding and block source                  |

Document IDs are dummy strings (e.g. `DOC1001`). Match scores are demo
integers. There is no real OCR or face recognition.

### 6.4 Fake Traffic Risk (`traffic_service.calculate_traffic_risk`)

| Signal                                                            | Points |
|-------------------------------------------------------------------|--------|
| request_count > 10                                                | +20    |
| request_count > 25                                                | +35    |
| request_count > 50                                                | +50    |
| Same IP seen > 10 times in traffic events                         | +25    |
| Same device seen > 10 times in traffic events                     | +25    |
| form_completion_seconds < 10                                      | +25    |
| form_completion_seconds < 5                                       | +35    |
| otp_attempts > 3                                                  | +20    |
| otp_attempts > 5                                                  | +30    |
| user-agent contains `python-requests`                             | +30    |
| user-agent contains `selenium`                                    | +30    |
| user-agent contains `headless`                                    | +30    |
| user-agent contains `bot` (and not already counted)               | +25    |
| empty / unknown user-agent                                        | +20    |
| Suspicious user-agent + request_count > 25                        | +15    |
| event_type == `credential_stuffing` and request_count > 25        | +20    |

Action:

| Level    | Action                                                |
|----------|-------------------------------------------------------|
| Low      | Allow traffic                                         |
| Medium   | Rate limit request                                    |
| High     | Challenge with CAPTCHA or step-up verification        |
| Critical | Block IP/device temporarily                           |

## 7. Real-Time Traffic Simulator

`backend/app/services/traffic_simulator.py` implements a thread-safe singleton
that generates synthetic `traffic_events` continuously.

- Configurable rate per second (0.5 to 8 ev/s).
- Three distributions: `mixed` (default), `normal` (only well-behaved users),
  `attack` (only suspicious / critical templates).
- Each generated event is scored by the same `calculate_traffic_risk` engine
  used by the live API, so dashboards stay consistent.
- Templates include credential stuffing, mass onboarding, scraping, headless
  browsers, python-requests, normal mobile / desktop traffic.

Endpoints:

| Method | Path                                | Body                                                |
|--------|-------------------------------------|-----------------------------------------------------|
| POST   | `/api/traffic/simulator/start`      | `{ "rate_per_sec": 4, "distribution": "mixed" }`    |
| POST   | `/api/traffic/simulator/stop`       | -                                                   |
| GET    | `/api/traffic/simulator/status`     | -                                                   |

When the simulator is running, the **Fake Traffic** page polls every 1.5 s and
the **Admin Dashboard** polls every 2 s. The Risk Distribution pie, Top Fraud
Reasons bar chart, and Activity Trends line chart now aggregate Login,
Transaction, Onboarding **and** Traffic events, so they all move with the
simulator.

The traffic table flashes a 3-second highlight (and a small NEW chip) on rows
that just arrived, so the live feed is visually obvious during a demo.

## 8. Authentication and Roles

The frontend has a clean Liquid Glass auth page at `/`:

- Sign In / Sign Up tabs.
- Customer / Admin role pills (matched against the user's actual role from the
  database; mismatches are rejected).
- Demo quick-fill buttons for the seeded customer and admin.

After login, routing is role-based:

| Role     | Default landing |
|----------|-----------------|
| Customer | `/home`         |
| Admin    | `/dashboard`    |

The sidebar shows different links per role. Customer-only pages: Home, Risk
Analysis, Transactions, Login Simulator. Admin pages also include Dashboard,
Alerts, Cases, KYC Onboarding, Fake Traffic.

Auth state is stored in `localStorage` (`accountguard:user`) for demo
simplicity. There is no JWT or session middleware. `RequireAuth` guards all
protected routes; admin-only routes are gated with `role="admin"`.

Backend endpoints used:

- `POST /api/auth/login` - returns user + risk score; sign-in is rejected if
  the risk level is High or Critical.
- `POST /api/auth/register` - creates a new user (defaults to `customer`).

## 9. Database Schema

SQLite file: `backend/accountguard.db`. Tables are auto-created on startup. A
demo seed runs only when the `users` table is empty.

### users
`id, name, email (unique), password (plain demo), phone, role, usual_city,
usual_country, usual_device_id, usual_login_start_hour, usual_login_end_hour,
average_transaction_amount, created_at`

### devices
`id, user_id, device_id, device_name, browser, os, is_trusted, first_seen,
last_seen`

### login_events
`id, user_id, email, device_id, browser, os, ip_address, city, country,
login_hour, is_successful, risk_score, risk_level, risk_reasons,
recommended_action, created_at`

### transactions
`id, user_id, amount, beneficiary_id, beneficiary_name, is_new_beneficiary,
city, country, transaction_hour, risk_score, risk_level, risk_reasons, status,
created_at`

### alerts
`id, user_id, alert_type (Login | Transaction), risk_level, message, status
(Open | Reviewing | Resolved | False Positive), created_at`

### fraud_cases
`id, user_id, alert_id, risk_score, case_status (Pending | Under Review |
Blocked | Resolved | False Positive), admin_notes, created_at, updated_at`

### onboarding_applications
`id, full_name, email, phone, dob, city, country, device_id, ip_address,
document_id, document_match_score, selfie_match_score,
form_completion_seconds, otp_attempts, risk_score, risk_level, risk_reasons,
decision, created_at`

### traffic_events
`id, event_type, email, ip_address, device_id, user_agent, request_path,
request_count, form_completion_seconds, otp_attempts, risk_score, risk_level,
risk_reasons, action_taken, created_at`

`risk_reasons` is stored as a comma-separated string for portability.

## 10. API Reference

Interactive Swagger UI: **http://localhost:8000/docs**
ReDoc: **http://localhost:8000/redoc**

### Health

| Method | Path           |
|--------|----------------|
| GET    | `/`            |
| GET    | `/api/health`  |

### Auth

- `POST /api/auth/login` - request: `email, password, device_id, device_name,
  browser, os, ip_address, city, country, login_hour`. Response: `success,
  user, risk_score, risk_level, risk_reasons[], recommended_action`.
- `POST /api/auth/register` - request: `name, email, password, phone, role`.
  Response: `success, message, user`.

### Risk

- `POST /api/risk/analyze-login` - same shape as login (no password). Returns
  score / level / reasons / action without persisting.
- `GET /api/risk/user/{user_id}` - last 50 login events for the user.

### Transactions

- `POST /api/transactions` - create + score a transaction.
- `GET /api/transactions` - all transactions (most recent first).

### Dashboard

| Method | Path                                | Returns                                                                                  |
|--------|-------------------------------------|------------------------------------------------------------------------------------------|
| GET    | `/api/dashboard/summary`            | totals + open cases + onboarding counts + traffic counts                                  |
| GET    | `/api/dashboard/risk-distribution`  | logins + transactions + traffic + onboarding combined per risk level                     |
| GET    | `/api/dashboard/fraud-reasons`      | top reasons aggregated across login, transaction, onboarding and traffic events          |
| GET    | `/api/dashboard/login-trends`       | last 7 days, `[ { date, logins, traffic, suspicious } ]` (logins + traffic + suspicious) |

`summary` payload:
```json
{
  "total_users": 3,
  "total_logins": 14,
  "total_transactions": 16,
  "total_alerts": 17,
  "high_risk_logins": 3,
  "open_cases": 13,
  "total_onboarding_applications": 7,
  "high_risk_onboarding_applications": 6,
  "total_traffic_events": 264,
  "critical_traffic_events": 136
}
```

### Alerts

| Method | Path                       | Body                       |
|--------|----------------------------|----------------------------|
| GET    | `/api/alerts`              | -                          |
| PATCH  | `/api/alerts/{alert_id}`   | `{ "status": "Resolved" }` |

### Cases

| Method | Path                       | Body                                                       |
|--------|----------------------------|------------------------------------------------------------|
| GET    | `/api/cases`               | -                                                          |
| PATCH  | `/api/cases/{case_id}`     | `{ "case_status": "Under Review", "admin_notes": "..." }`  |

### Onboarding

| Method | Path                                       | Notes                                       |
|--------|--------------------------------------------|---------------------------------------------|
| POST   | `/api/onboarding/apply`                    | submit + score an application               |
| GET    | `/api/onboarding/applications`             | list                                        |
| GET    | `/api/onboarding/applications/{id}`        | one                                         |
| PATCH  | `/api/onboarding/applications/{id}`        | `{ "decision": "Manual review" }`           |

### Traffic

| Method | Path                              | Notes                                       |
|--------|-----------------------------------|---------------------------------------------|
| POST   | `/api/traffic/analyze`            | analyse a single event                      |
| GET    | `/api/traffic/events`             | list of recent events                       |
| GET    | `/api/traffic/summary`            | totals, high-risk, critical, blocked        |
| POST   | `/api/traffic/simulator/start`    | `{ rate_per_sec, distribution }`            |
| POST   | `/api/traffic/simulator/stop`     | stop the background thread                  |
| GET    | `/api/traffic/simulator/status`   | running flag, rate, count, started_at       |

## 11. Frontend Pages and Components

### Routes

| Path               | Page                  | Access     |
|--------------------|-----------------------|------------|
| `/`                | AuthPage              | public     |
| `/home`            | UserHomePage          | any user   |
| `/dashboard`       | AdminDashboard        | admin      |
| `/risk-analysis`   | RiskAnalysisPage      | any user   |
| `/transactions`    | TransactionsPage      | any user   |
| `/alerts`          | AlertsPage            | admin      |
| `/cases`           | CasesPage             | admin      |
| `/onboarding`      | OnboardingPage        | admin      |
| `/traffic-monitor` | TrafficMonitorPage    | admin      |
| `/login-simulator` | LoginPage (simulator) | any user   |
| `*`                | NotFoundPage          | public     |

### Pages

- **AuthPage** - Sign In / Sign Up tabs, role pills, validation against the
  user's role in the DB.
- **UserHomePage** - private customer landing showing recent login activity,
  recent transactions, and quick action buttons.
- **AdminDashboard** - 10 stat cards (users, logins, transactions, alerts,
  high-risk logins, open cases, onboarding, high-risk onboarding, traffic,
  critical traffic) + 3 charts + recent alerts. Auto-polls every 2 s while the
  simulator runs and shows a `LIVE simulator · X ev/s` pill.
- **RiskAnalysisPage** - what-if tester for the login engine.
- **TransactionsPage** - submit a transaction with 3 preset buttons; full
  transaction table.
- **AlertsPage** - all alerts with inline status update.
- **CasesPage** - fraud cases with case_status and admin_notes editing.
- **OnboardingPage** - submit a KYC application with 3 preset buttons; full
  applications table with decisions.
- **TrafficMonitorPage** - simulator panel (rate, distribution, start / stop),
  3 single-event presets, 4 stat cards, live feed table where new rows flash
  for 3 seconds.
- **LoginPage** - the login simulator (multi-field form, 4 presets).
- **NotFoundPage** - simple 404.

### Components

`Navbar`, `Sidebar`, `Layout`, `RiskBadge`, `RiskScoreCard`, `StatCard`,
`AlertCard`, `Loader`. Auth context lives in `src/auth/AuthContext.jsx` and
the `RequireAuth` HOC is in `src/auth/RequireAuth.jsx`.

### Charts (Recharts)

- `RiskDistributionChart` - pie of all risk-level events combined.
- `FraudReasonChart` - top 10 reasons across login, transaction, traffic,
  onboarding.
- `LoginTrendChart` - 3 series: logins, traffic, suspicious (Medium+ across
  logins and traffic).

### API client

`src/api/apiClient.js` is a single Axios instance that uses
`import.meta.env.VITE_API_BASE_URL` with a fallback of
`http://localhost:8000/api`. Domain modules: `authApi`, `riskApi`,
`transactionApi`, `dashboardApi`, `alertApi`, `caseApi`, `onboardingApi`,
`trafficApi`.

## 12. UI Theme - Liquid Glass

All UI is themed Apple-style Liquid Glass:

- Animated mesh gradient background (drifting purple / cyan / pink blobs) on
  the auth page and a calmer version across the rest of the app.
- Frosted cards: `background: rgba(255, 255, 255, 0.55)` +
  `backdrop-filter: blur(18-28px) saturate(180-200%)`, translucent borders,
  inset highlight.
- Stat cards have a coloured gradient bar across the top tied to the accent.
- Primary buttons use an indigo→violet gradient with a soft glow; danger
  buttons use red→rose; light buttons are translucent white.
- Pill segmented control on the auth page (Sign In / Sign Up); role pills for
  Customer / Admin.
- Risk badges use translucent semantic colours (green / amber / red); Critical
  has a deep-red gradient with shadow.
- LIVE indicator: pulsing white dot inside a red gradient pill.
- New traffic rows flash a 3-second indigo highlight bar plus a "NEW" chip.
- Tables, inputs, scrollbars, tooltips, alert cards, risk-score cards all
  reskinned consistently.

## 13. Setup and Run

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

Backend at http://localhost:8000. Swagger at http://localhost:8000/docs.

### Frontend

```
cd frontend
npm install
npm run dev
```

Frontend at http://localhost:5173. Optional `.env` for `VITE_API_BASE_URL`
override.

## 14. Demo Scenarios

### Demo credentials

| Role     | Email             | Password |
|----------|-------------------|----------|
| Customer | jyot@example.com  | 123456   |
| Admin    | admin@example.com | admin123 |

### Live attack demo

1. Sign in as **Admin**.
2. Open **Fake Traffic** in the sidebar.
3. Set rate to 4 ev/s, distribution to **Attack wave**, click **Start
   simulator**.
4. Open **Dashboard** in another tab. Watch every chart and stat card move in
   real time.
5. Click **Stop simulator** to return to a quiet state.

### Login simulator (single events)

The Login Simulator page (`/login-simulator`) has four preset buttons:

- **Normal** - score 0, allow.
- **Suspicious** - score around 60-70, step-up.
- **Critical** - score 100, block + create fraud case.
- **Admin** - score around 0, allow.

### Transactions

- **Normal** - ₹1,000 to known beneficiary - Low, success.
- **High Risk** - ₹90,000 to new beneficiary in Delhi at 2 AM - High, blocked.
- **Critical** - ₹1,50,000 to a foreign beneficiary in Russia at 3 AM -
  Critical, blocked.

### Onboarding

- **Normal** - good document and selfie scores, India - Low, approve.
- **Suspicious** - low document score, fast form, OTP retries - Medium / High,
  manual review.
- **Critical** - underage, foreign country, very low scores, very fast form -
  Critical, reject and block source.

### Single fake traffic events

- **Normal** - human Chrome session - Low, allow.
- **Bot** - python-requests, 35 reqs, 3s form, 7 OTPs - Critical, block.
- **Critical** - HeadlessChrome Selenium, 75 reqs, 2s form, 10 OTPs -
  Critical, block.

## 15. Testing

```
pip install pytest
pytest tests -q
```

Three risk-engine assertions plus a backend health smoke test (4 tests total).
Tests do not need a running server.

## 16. Security and Data Notes

This is a **hackathon prototype**. Do not use as-is for real banking.

- Passwords are stored in plain text for demo simplicity.
- There is no JWT / session / CSRF protection.
- CORS is permissive for the local dev server.
- All data is synthetic; there is no real KYC, IP geolocation, Aadhaar, PAN,
  or banking data.
- The "suspicious IP" rule is a placeholder; not a real reputation feed.
- Document IDs are dummy strings; document_match_score and selfie_match_score
  are demo integers and there is **no** real OCR or face recognition.
- The traffic simulator generates synthetic events with no real PII.

## 17. Troubleshooting

**Backend port 8000 already in use** - kill the process or run on a different
port (`uvicorn main:app --reload --port 8001`) and update `VITE_API_BASE_URL`.

**Frontend cannot reach the backend** - confirm both servers are running and
check the browser console for CORS errors. The backend allows ports 5173 /
3000 plus a permissive `*` for local dev.

**Dashboard charts do not move while the simulator runs** - confirm the
simulator is actually streaming (`GET /api/traffic/simulator/status`) and that
the page is the **Admin Dashboard** (admin role). Polling only kicks in while
`status.running` is true.

**Charts feel stale** - the backend `/api/dashboard/risk-distribution`,
`/fraud-reasons`, and `/login-trends` endpoints aggregate across all event
sources. If counts seem stuck, check that the underlying tables are
accumulating with `GET /api/traffic/summary` and `/api/dashboard/summary`.

**`pip install` fails on Windows** - confirm the venv is activated
(`venv\Scripts\activate`).

**`npm install` is slow or stalls** - first install can take a few minutes.
Retry with `npm install --no-audit --no-fund` to skip the audit phase.

**Reset the demo data** - stop the backend, delete `backend/accountguard.db`,
restart the server. The seed will repopulate the database.

## 18. Future Scope

1. Real ML model trained on historical fraud labels (gradient boosting / NN).
2. Device fingerprinting (canvas, WebGL, font hashing).
3. IP reputation API integration (e.g., MaxMind, IPQS).
4. Behavioural biometrics (typing rhythm, mouse movement).
5. OTP / face verification step-up integration.
6. Real-time event streaming with Kafka and an online feature store.
7. SIEM integration for security operations.
8. Fraud-team workflow (assign, escalate, SLA timers, audit log).
9. Explainable AI dashboard with SHAP-style feature attribution.
10. Multi-channel coverage: mobile banking, net banking, UPI, ATM, call center.
11. WebSocket push for the live traffic feed (instead of polling).
12. Real session management (JWT or HttpOnly cookies) and password hashing.

---

For a quick start, see [README.md](README.md). For granular per-feature notes,
see the `docs/` folder.
