import React, { useEffect, useState } from 'react';
import {
  applyOnboarding,
  getOnboardingApplications
} from '../api/onboardingApi';
import RiskBadge from '../components/RiskBadge.jsx';
import RiskScoreCard from '../components/RiskScoreCard.jsx';
import Loader from '../components/Loader.jsx';
import { formatDate } from '../utils/formatDate';

const presets = {
  normal: {
    full_name: 'Rahul Patel',
    email: 'rahul@example.com',
    phone: '9876500011',
    dob: '2000-05-10',
    city: 'Surat',
    country: 'India',
    device_id: 'android_new_101',
    ip_address: '192.168.1.50',
    document_id: 'DOC1001',
    document_match_score: 92,
    selfie_match_score: 88,
    form_completion_seconds: 180,
    otp_attempts: 1
  },
  suspicious: {
    full_name: 'Unknown User',
    email: 'fakeuser1@example.com',
    phone: '9999999999',
    dob: '2006-01-01',
    city: 'Delhi',
    country: 'India',
    device_id: 'bot_device_999',
    ip_address: '45.99.88.77',
    document_id: 'DOC9999',
    document_match_score: 45,
    selfie_match_score: 38,
    form_completion_seconds: 8,
    otp_attempts: 5
  },
  critical: {
    full_name: 'Fake Bot User',
    email: 'botuser@example.com',
    phone: '8888888888',
    dob: '2010-01-01',
    city: 'Unknown',
    country: 'Russia',
    device_id: 'bot_device_999',
    ip_address: '45.99.88.77',
    document_id: 'DOC9999',
    document_match_score: 25,
    selfie_match_score: 20,
    form_completion_seconds: 4,
    otp_attempts: 8
  }
};

const initial = { ...presets.normal };

export default function OnboardingPage() {
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getOnboardingApplications();
      setApplications(data);
    } catch (err) {
      setError('Failed to load onboarding applications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function applyPreset(key) {
    setForm({ ...presets[key] });
    setResult(null);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        document_match_score: Number(form.document_match_score) || 0,
        selfie_match_score: Number(form.selfie_match_score) || 0,
        form_completion_seconds: Number(form.form_completion_seconds) || 0,
        otp_attempts: Number(form.otp_attempts) || 0
      };
      const data = await applyOnboarding(payload);
      setResult(data);
      load();
    } catch (err) {
      setError('Onboarding analysis failed. Is the backend running?');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>KYC & Onboarding Fraud Detection</h2>
        <p className="muted">
          Score new applications against duplicate, document, selfie, device,
          and timing signals.
        </p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="preset-row">
            <button type="button" className="btn btn-light" onClick={() => applyPreset('normal')}>
              Normal Onboarding
            </button>
            <button type="button" className="btn btn-light" onClick={() => applyPreset('suspicious')}>
              Suspicious Onboarding
            </button>
            <button type="button" className="btn btn-light" onClick={() => applyPreset('critical')}>
              Critical Onboarding
            </button>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <label>Full Name
              <input name="full_name" value={form.full_name} onChange={handleChange} required />
            </label>
            <label>Email
              <input name="email" value={form.email} onChange={handleChange} required />
            </label>
            <label>Phone
              <input name="phone" value={form.phone} onChange={handleChange} required />
            </label>
            <label>DOB
              <input name="dob" type="date" value={form.dob} onChange={handleChange} />
            </label>
            <label>City
              <input name="city" value={form.city} onChange={handleChange} />
            </label>
            <label>Country
              <input name="country" value={form.country} onChange={handleChange} />
            </label>
            <label>Device ID
              <input name="device_id" value={form.device_id} onChange={handleChange} />
            </label>
            <label>IP Address
              <input name="ip_address" value={form.ip_address} onChange={handleChange} />
            </label>
            <label>Document ID
              <input name="document_id" value={form.document_id} onChange={handleChange} />
            </label>
            <label>Document Match Score
              <input
                name="document_match_score"
                type="number"
                min="0"
                max="100"
                value={form.document_match_score}
                onChange={handleChange}
              />
            </label>
            <label>Selfie Match Score
              <input
                name="selfie_match_score"
                type="number"
                min="0"
                max="100"
                value={form.selfie_match_score}
                onChange={handleChange}
              />
            </label>
            <label>Form Completion Seconds
              <input
                name="form_completion_seconds"
                type="number"
                min="0"
                value={form.form_completion_seconds}
                onChange={handleChange}
              />
            </label>
            <label>OTP Attempts
              <input
                name="otp_attempts"
                type="number"
                min="0"
                value={form.otp_attempts}
                onChange={handleChange}
              />
            </label>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Analyzing...' : 'Analyze Onboarding'}
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
              recommendedAction={result.decision}
            />
          ) : (
            <div className="card placeholder-card">
              <div className="muted">Submit an application to see the engine result.</div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Onboarding Applications</div>
        {loading ? (
          <Loader />
        ) : applications.length === 0 ? (
          <div className="muted">No applications yet</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Country</th>
                  <th>Document ID</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                  <th>Decision</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.full_name}</td>
                    <td>{a.email}</td>
                    <td>{a.phone}</td>
                    <td>{a.city}</td>
                    <td>{a.country}</td>
                    <td>{a.document_id}</td>
                    <td>{a.risk_score}</td>
                    <td><RiskBadge level={a.risk_level} /></td>
                    <td>{a.decision}</td>
                    <td>{formatDate(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
