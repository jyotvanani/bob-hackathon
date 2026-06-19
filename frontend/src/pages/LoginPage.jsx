import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';
import RiskScoreCard from '../components/RiskScoreCard.jsx';

const presets = {
  normal: {
    email: 'jyot@example.com',
    password: '123456',
    device_id: 'android_001',
    device_name: 'Samsung Android',
    browser: 'Chrome',
    os: 'Android',
    ip_address: '192.168.1.10',
    city: 'Surat',
    country: 'India',
    login_hour: 11
  },
  suspicious: {
    email: 'jyot@example.com',
    password: '123456',
    device_id: 'windows_999',
    device_name: 'Unknown Windows Laptop',
    browser: 'Edge',
    os: 'Windows',
    ip_address: '10.10.10.10',
    city: 'Delhi',
    country: 'India',
    login_hour: 2
  },
  critical: {
    email: 'jyot@example.com',
    password: 'wrongpass',
    device_id: 'linux_unknown_777',
    device_name: 'Unknown Linux Device',
    browser: 'Firefox',
    os: 'Linux',
    ip_address: '45.99.88.77',
    city: 'Unknown',
    country: 'Russia',
    login_hour: 3
  },
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
    device_id: 'admin_laptop_001',
    device_name: 'Admin Laptop',
    browser: 'Chrome',
    os: 'Windows',
    ip_address: '192.168.1.20',
    city: 'Ahmedabad',
    country: 'India',
    login_hour: 10
  }
};

const initial = {
  email: '',
  password: '',
  device_id: '',
  device_name: '',
  browser: '',
  os: '',
  ip_address: '',
  city: '',
  country: '',
  login_hour: ''
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function applyPreset(key) {
    setForm({ ...presets[key], login_hour: presets[key].login_hour });
    setResult(null);
    setError('');
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const payload = {
        ...form,
        login_hour: form.login_hour === '' ? null : Number(form.login_hour)
      };
      const data = await login(payload);
      setResult(data);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Login request failed. Is the backend running?';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Login Simulator</h2>
        <p className="muted">
          Try the demo presets to see how the risk engine reacts to different login patterns.
        </p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="preset-row">
            <button type="button" className="btn btn-light" onClick={() => applyPreset('normal')}>
              Normal Login
            </button>
            <button type="button" className="btn btn-light" onClick={() => applyPreset('suspicious')}>
              Suspicious Login
            </button>
            <button type="button" className="btn btn-light" onClick={() => applyPreset('critical')}>
              Critical Login
            </button>
            <button type="button" className="btn btn-light" onClick={() => applyPreset('admin')}>
              Admin Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <label>Email
              <input name="email" value={form.email} onChange={handleChange} required />
            </label>
            <label>Password
              <input name="password" type="text" value={form.password} onChange={handleChange} required />
            </label>
            <label>Device ID
              <input name="device_id" value={form.device_id} onChange={handleChange} />
            </label>
            <label>Device Name
              <input name="device_name" value={form.device_name} onChange={handleChange} />
            </label>
            <label>Browser
              <input name="browser" value={form.browser} onChange={handleChange} />
            </label>
            <label>OS
              <input name="os" value={form.os} onChange={handleChange} />
            </label>
            <label>IP Address
              <input name="ip_address" value={form.ip_address} onChange={handleChange} />
            </label>
            <label>City
              <input name="city" value={form.city} onChange={handleChange} />
            </label>
            <label>Country
              <input name="country" value={form.country} onChange={handleChange} />
            </label>
            <label>Login Hour (0-23)
              <input
                name="login_hour"
                type="number"
                min="0"
                max="23"
                value={form.login_hour}
                onChange={handleChange}
              />
            </label>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'Analyzing...' : 'Login & Analyze'}
              </button>
            </div>
          </form>

          {error && <div className="error-banner">{error}</div>}
        </div>

        <div>
          {result ? (
            <>
              <RiskScoreCard
                riskScore={result.risk_score}
                riskLevel={result.risk_level}
                reasons={result.risk_reasons}
                recommendedAction={result.recommended_action}
              />
              <div className="card" style={{ marginTop: 16 }}>
                <div className="row-between">
                  <div>
                    <div className="muted small">Login result</div>
                    <div className="strong">
                      {result.success ? 'Login allowed' : 'Login blocked or restricted'}
                    </div>
                    {result.user && (
                      <div className="muted small">
                        Welcome, {result.user.name} ({result.user.role})
                      </div>
                    )}
                  </div>
                  <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="card placeholder-card">
              <div className="muted">Submit a login to see the risk analysis here.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
