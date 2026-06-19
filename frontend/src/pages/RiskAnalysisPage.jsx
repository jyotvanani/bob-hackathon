import React, { useState } from 'react';
import { analyzeLogin } from '../api/riskApi';
import RiskScoreCard from '../components/RiskScoreCard.jsx';

const initial = {
  user_id: 1,
  device_id: 'android_001',
  city: 'Surat',
  country: 'India',
  login_hour: 11,
  failed_attempt: false
};

export default function RiskAnalysisPage() {
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, type, value, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        user_id: form.user_id ? Number(form.user_id) : null,
        device_id: form.device_id || null,
        city: form.city || null,
        country: form.country || null,
        login_hour: form.login_hour === '' ? null : Number(form.login_hour),
        failed_attempt: !!form.failed_attempt
      };
      const data = await analyzeLogin(payload);
      setResult(data);
    } catch (err) {
      setError('Risk analysis failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Risk Analysis</h2>
        <p className="muted">Analyze a login attempt without actually logging in.</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <form onSubmit={handleSubmit} className="form-grid">
            <label>User ID
              <input name="user_id" type="number" value={form.user_id} onChange={handleChange} />
            </label>
            <label>Device ID
              <input name="device_id" value={form.device_id} onChange={handleChange} />
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
            <label className="checkbox-row">
              <input
                name="failed_attempt"
                type="checkbox"
                checked={!!form.failed_attempt}
                onChange={handleChange}
              />
              Failed login attempt
            </label>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'Analyzing...' : 'Analyze Risk'}
              </button>
            </div>
          </form>
          {error && <div className="error-banner">{error}</div>}
        </div>

        <div>
          {result ? (
            <RiskScoreCard
              riskScore={result.risk_score}
              riskLevel={result.risk_level}
              reasons={result.risk_reasons}
              recommendedAction={result.recommended_action}
            />
          ) : (
            <div className="card placeholder-card">
              <div className="muted">Submit a request to see results.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
