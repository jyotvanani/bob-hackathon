import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, register } from '../api/authApi';
import { useAuth } from '../auth/AuthContext.jsx';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [mode, setMode] = useState('signin'); // signin | signup
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError('');
  }

  function fillDemo(kind) {
    if (kind === 'admin') {
      setForm({ ...form, email: 'admin@example.com', password: 'admin123' });
    } else {
      setForm({ ...form, email: 'jyot@example.com', password: '123456' });
    }
    setMode('signin');
    setError('');
    setInfo('');
  }

  function routeAfterLogin(user) {
    const target = user.role === 'admin' ? '/dashboard' : '/home';
    const fromPath = location?.state?.from?.pathname;
    navigate(fromPath && fromPath !== '/' ? fromPath : target, { replace: true });
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const data = await login({
        email: form.email.trim(),
        password: form.password,
        device_id: 'web_session',
        device_name: 'Web Browser',
        browser: 'Browser',
        os: 'Web',
        ip_address: '192.168.1.10',
        city: 'Surat',
        country: 'India',
        login_hour: new Date().getHours()
      });

      if (!data.user) {
        setError('Invalid email or password');
        return;
      }
      if (data.risk_level === 'Critical' || data.risk_level === 'High') {
        setError(
          `Login flagged as ${data.risk_level} risk. Reasons: ${data.risk_reasons.join(', ')}`
        );
        return;
      }

      signIn(data.user);
      routeAfterLogin(data.user);
    } catch (err) {
      setError('Sign-in failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!form.name || !form.email || !form.password) {
      setError('Name, email and password are required');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const data = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone
      });
      if (!data.success) {
        setError(data.message || 'Registration failed');
        return;
      }
      setInfo('Account created. You can sign in now.');
      setMode('signin');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  const isSignIn = mode === 'signin';

  return (
    <div className="auth-shell">
      <div className="auth-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="auth-card glass">
        <div className="auth-brand">
          <span className="brand-logo">🛡️</span>
          <div>
            <div className="brand-title">AccountGuard AI</div>
            <div className="brand-sub">AI-Based Account Takeover Detection</div>
          </div>
        </div>

        <div className="segmented" role="tablist">
          <button
            type="button"
            className={`segmented-tab ${isSignIn ? 'active' : ''}`}
            onClick={() => setMode('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`segmented-tab ${!isSignIn ? 'active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        {!isSignIn && (
          <div className="auth-note muted small">
            Public sign-up creates a <strong>customer</strong> account. Admin
            access is invite-only.
          </div>
        )}

        <form
          onSubmit={isSignIn ? handleSignIn : handleSignUp}
          className="auth-form"
          noValidate
        >
          {!isSignIn && (
            <label className="auth-field">
              <span>Full name</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </label>
          )}

          <label className="auth-field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete={isSignIn ? 'current-password' : 'new-password'}
              required
            />
          </label>

          {!isSignIn && (
            <label className="auth-field">
              <span>Phone (optional)</span>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="0"
                autoComplete="tel"
              />
            </label>
          )}

          {error && <div className="auth-error">{error}</div>}
          {info && <div className="auth-info">{info}</div>}

          <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? 'Working...' : isSignIn ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {isSignIn && (
          <div className="auth-demo">
            <span className="muted small">Demo accounts:</span>
            <button type="button" className="btn-link" onClick={() => fillDemo('customer')}>
              Customer
            </button>
            <span className="muted small">·</span>
            <button type="button" className="btn-link" onClick={() => fillDemo('admin')}>
              Admin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
