# AccountGuard AI

AI-Based Account Takeover Detection System for online banking. Hackathon
prototype with a working risk engine, FastAPI backend, React + Vite frontend,
charts, alerts, and a fraud-case workflow.

## Problem statement

Account takeover attacks rely on stolen credentials being used from a new device,
geography, or unusual hour. Static rules generate too many false positives and
manual review queues cannot keep up with digital transaction volume. AccountGuard
AI demonstrates an explainable, rule-based risk engine that scores every login
and transaction on multiple signals and returns a recommended action that an
analyst can understand.

See [docs/problem_statement.md](docs/problem_statement.md) for more.

## Features

- Customer login simulation with risk analysis
- New device, new location, night-time, failed-attempt and suspicious IP detection
- Transaction risk: amount, new beneficiary, location, time
- Risk score 0-100 with Low / Medium / High / Critical levels
- Plain-English risk reasons and recommended actions
- Auto-generated alerts (Medium+) and fraud cases (High / Critical)
- Admin dashboard with totals, charts and recent alerts
- Fraud case workflow with admin notes
- Demo seed data so the dashboard works on first run
- Synthetic data only - no real banking, Aadhaar, or PAN data

## Tech stack

- **Frontend**: React 18, Vite, JavaScript, React Router, Axios, Recharts, plain CSS
- **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy ORM, Pydantic
- **Database**: SQLite (`backend/accountguard.db`, auto-created)

## Folder structure

```
accountguard-ai/
├── README.md, .gitignore, .env.example
├── backend/                FastAPI app + risk engine + SQLite
│   ├── main.py
│   ├── requirements.txt
│   └── app/
│       ├── models, schemas, routes, services, seed, utils
│       └── init_db.py
├── frontend/               React + Vite app
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api, components, pages, charts, utils, routes
│       ├── main.jsx, App.jsx, index.css
├── database/               Reference SQL files
├── docs/                   Architecture, API docs, problem statement
└── tests/                  Pytest tests for risk engine + health
```

## Backend setup

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

Backend runs at http://localhost:8000 and Swagger UI at
http://localhost:8000/docs.

## Frontend setup

```
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173.

If you want to override the API base URL, copy `.env.example` to `.env` inside
`frontend/` and edit `VITE_API_BASE_URL`. The code falls back to
`http://localhost:8000/api` when the env var is missing.

## Running tests

```
pip install pytest
pytest tests -q
```

## Demo credentials

| Role     | Email             | Password |
|----------|-------------------|----------|
| Customer | jyot@example.com  | 123456   |
| Admin    | admin@example.com | admin123 |

## Demo scenarios

The Login page has four preset buttons that auto-fill the form:

1. **Normal Login** - known device, known city, normal hour → Low risk, allow.
2. **Suspicious Login** - new Windows laptop, Delhi, 2 AM → High risk, step-up.
3. **Critical Login** - wrong password, Russia, unknown Linux device, 3 AM →
   Critical, block account, fraud case created.
4. **Admin Login** - admin user from Ahmedabad → Low risk, allow.

The Transactions page has three preset buttons:

1. **Normal Transaction** - ₹1,000 to known beneficiary → Low risk, success.
2. **High Risk** - ₹90,000 to new beneficiary in Delhi at 2 AM → High, blocked.
3. **Critical** - ₹1,50,000 to foreign beneficiary in Russia at 3 AM → Critical,
   blocked.

After running any scenario, open the **Dashboard**, **Alerts** and **Cases**
pages to see how the engine reacted.

## API documentation

Full API reference (with example payloads) lives in
[docs/api_documentation.md](docs/api_documentation.md). Live, interactive docs
are served by FastAPI at http://localhost:8000/docs.

## Screenshots

> Screenshots placeholder. Add `docs/screenshots/dashboard.png`,
> `docs/screenshots/login.png`, etc., during the demo recording.

## Future scope

1. Train a real ML model on historical fraud labels (gradient boosting / NN).
2. Device fingerprinting (canvas, WebGL, font hashing).
3. IP reputation API integration.
4. Behavioural biometrics (typing rhythm, mouse movement).
5. OTP / face verification step-up integration.
6. Real-time event streaming with Kafka and online feature store.
7. SIEM integration for security operations.
8. Bank fraud-team workflow (assign, escalate, SLA timers).
9. Explainable AI dashboard with SHAP-based feature attribution.
10. Multi-channel coverage: mobile banking, net banking, UPI, ATM, call center.

## License

Hackathon prototype - synthetic data only.
