# AccountGuard AI

AI-Based Account Takeover Detection System for online banking. Hackathon
prototype with an explainable rule-based risk engine, a real-time traffic
simulator, role-based authentication, and a Liquid Glass admin console.

## Highlights

- Login risk scoring with new device, location, time, IP, and failed-attempt signals.
- Transaction risk scoring (amount, beneficiary, location, time).
- KYC / Onboarding fraud prevention (duplicate identity, low document or selfie scores, age, country, timing, OTP).
- Fake user traffic detection (rate, bot user agents, credential stuffing, repeated IP / device).
- **Real-time fake traffic simulator** that streams synthetic events into the engine. Dashboard charts and stat cards update live.
- Role-based authentication (Customer / Admin) with a clean signup / signin page.
- Liquid Glass UI (frosted cards, mesh gradient background, soft glow), Apple-inspired.
- Synthetic data only. No real KYC, banking, or PII data.

## Tech stack

- **Frontend**: React 18, Vite, JavaScript, React Router, Axios, Recharts, plain CSS
- **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy ORM, Pydantic
- **Database**: SQLite file `backend/accountguard.db` (auto-created)

## Folder structure

```
accountguard-ai/
├── README.md, DOCUMENTATION.md
├── .gitignore, .env.example
├── backend/
│   ├── requirements.txt
│   ├── main.py
│   └── app/
│       ├── config.py, database.py, init_db.py
│       ├── models/        users, devices, login_events, transactions,
│       │                  alerts, fraud_cases, onboarding_applications,
│       │                  traffic_events
│       ├── schemas/       Pydantic request / response models
│       ├── routes/        auth, risk, transactions, dashboard, alerts,
│       │                  cases, onboarding, traffic
│       ├── services/      risk_service, onboarding_service,
│       │                  traffic_service, traffic_simulator,
│       │                  device, location, alert, case
│       ├── seed/seed_data.py
│       └── utils/
├── frontend/
│   ├── package.json, vite.config.js, index.html
│   └── src/
│       ├── main.jsx, App.jsx, index.css
│       ├── api/           apiClient + 8 domain wrappers
│       ├── auth/          AuthContext, RequireAuth
│       ├── components/    Navbar, Sidebar, Layout, RiskBadge,
│       │                  RiskScoreCard, StatCard, AlertCard, Loader
│       ├── pages/         AuthPage, UserHomePage, LoginPage,
│       │                  AdminDashboard, RiskAnalysisPage,
│       │                  TransactionsPage, AlertsPage, CasesPage,
│       │                  OnboardingPage, TrafficMonitorPage,
│       │                  NotFoundPage
│       ├── charts/        RiskDistribution, FraudReason, LoginTrend
│       ├── routes/AppRoutes.jsx
│       └── utils/
├── database/              Reference SQL DDL
├── docs/                  Architecture, API docs, problem statement
└── tests/                 pytest (risk engine + health)
```

## Backend setup

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

Backend runs at http://localhost:8000. Swagger UI at http://localhost:8000/docs.

## Frontend setup

```
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173.

If you need to override the API base URL, copy `frontend/.env.example` to
`frontend/.env` and set `VITE_API_BASE_URL=http://localhost:8000/api`.

## Demo credentials

| Role     | Email             | Password |
|----------|-------------------|----------|
| Customer | jyot@example.com  | 123456   |
| Admin    | admin@example.com | admin123 |

The auth page has demo quick-fill buttons for both. New customer accounts can
also be created from the Sign Up tab.

## Live demo flow

1. Sign in as **Admin** (`admin@example.com / admin123`).
2. Go to **Fake Traffic** in the sidebar. Click **Start simulator** with mix
   set to *Attack wave* and rate ~4 ev/s.
3. Open **Dashboard** in another tab. Watch:
   - Stat cards (Traffic Events, Critical Traffic) tick up every 2 seconds.
   - Risk Distribution pie shifts as Critical events accumulate.
   - Top Fraud Reasons bar chart re-orders in real time.
   - Activity Trends line chart shows a purple traffic spike on today.
4. Open **Alerts**, **Cases**, **Onboarding** to see the existing flows still
   work alongside the live feed.
5. Sign out, sign in as **Customer** (`jyot@example.com / 123456`) to see the
   limited customer home page with personal risk history and recent
   transactions.

## Demo scenarios

The Login Simulator page has four preset buttons:

1. **Normal Login** - known device, known city, normal hour. Risk Low, allow.
2. **Suspicious Login** - new Windows laptop, Delhi, 2 AM. Risk High, step-up.
3. **Critical Login** - wrong password, Russia, unknown Linux device, 3 AM.
   Risk Critical, block account, fraud case created.
4. **Admin Login** - admin user from Ahmedabad. Risk Low, allow.

The Transactions page has three preset buttons (Normal / High Risk / Critical).
The Onboarding page has three preset buttons (Normal / Suspicious / Critical).
The Fake Traffic page has three single-event presets (Normal / Bot / Critical
Bot Attack) plus the real-time simulator with rate and distribution controls.

## Running tests

```
pip install pytest
pytest tests -q
```

Three risk-engine assertions plus a backend health smoke test.

## API overview

Full reference in [DOCUMENTATION.md](DOCUMENTATION.md) and
[docs/api_documentation.md](docs/api_documentation.md). Live Swagger UI at
http://localhost:8000/docs.

| Domain        | Path prefix              |
|---------------|--------------------------|
| Auth          | `/api/auth`              |
| Risk          | `/api/risk`              |
| Transactions  | `/api/transactions`      |
| Dashboard     | `/api/dashboard`         |
| Alerts        | `/api/alerts`            |
| Cases         | `/api/cases`             |
| Onboarding    | `/api/onboarding`        |
| Traffic       | `/api/traffic`           |
| Simulator     | `/api/traffic/simulator` |

## UI theme

The frontend is themed Liquid Glass:

- Animated mesh gradient background (purple / cyan / pink blobs).
- Frosted cards with `backdrop-filter: blur` + saturate.
- Indigo→violet primary buttons with soft glow.
- Pulse-ring LIVE indicator while the simulator is running.
- New events on the traffic feed flash with a 3-second highlight bar.

## Future scope

1. Train a real ML model on historical fraud labels.
2. Device fingerprinting (canvas, WebGL, font hashing).
3. IP reputation API integration.
4. Behavioural biometrics (typing, mouse).
5. OTP / face verification step-up integration.
6. Real-time event streaming with Kafka and online feature store.
7. SIEM integration.
8. Fraud-team workflow with assign / escalate / SLA.
9. Explainable AI dashboard with SHAP-style attribution.
10. Multi-channel coverage: mobile banking, net banking, UPI, ATM, call center.

## License

Hackathon prototype - synthetic data only.
