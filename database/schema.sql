-- AccountGuard AI - SQLite schema (reference only, the FastAPI app auto-creates these)

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    usual_city TEXT,
    usual_country TEXT,
    usual_device_id TEXT,
    usual_login_start_hour INTEGER DEFAULT 8,
    usual_login_end_hour INTEGER DEFAULT 22,
    average_transaction_amount REAL DEFAULT 5000.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    device_id TEXT,
    device_name TEXT,
    browser TEXT,
    os TEXT,
    is_trusted BOOLEAN DEFAULT 0,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS login_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    email TEXT,
    device_id TEXT,
    browser TEXT,
    os TEXT,
    ip_address TEXT,
    city TEXT,
    country TEXT,
    login_hour INTEGER,
    is_successful BOOLEAN DEFAULT 1,
    risk_score INTEGER DEFAULT 0,
    risk_level TEXT DEFAULT 'Low',
    risk_reasons TEXT,
    recommended_action TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    amount REAL DEFAULT 0,
    beneficiary_id TEXT,
    beneficiary_name TEXT,
    is_new_beneficiary BOOLEAN DEFAULT 0,
    city TEXT,
    country TEXT,
    transaction_hour INTEGER,
    risk_score INTEGER DEFAULT 0,
    risk_level TEXT DEFAULT 'Low',
    risk_reasons TEXT,
    status TEXT DEFAULT 'Success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    alert_type TEXT DEFAULT 'Login',
    risk_level TEXT DEFAULT 'Medium',
    message TEXT,
    status TEXT DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fraud_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    alert_id INTEGER REFERENCES alerts(id),
    risk_score INTEGER DEFAULT 0,
    case_status TEXT DEFAULT 'Pending',
    admin_notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
