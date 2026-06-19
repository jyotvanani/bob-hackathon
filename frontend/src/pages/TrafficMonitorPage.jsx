import React, { useEffect, useRef, useState } from 'react';
import {
  analyzeTraffic,
  getTrafficEvents,
  getTrafficSummary,
  startTrafficSimulator,
  stopTrafficSimulator,
  getSimulatorStatus
} from '../api/trafficApi';
import { useRealtime } from '../realtime/RealtimeContext.jsx';
import RiskBadge from '../components/RiskBadge.jsx';
import RiskScoreCard from '../components/RiskScoreCard.jsx';
import StatCard from '../components/StatCard.jsx';
import Loader from '../components/Loader.jsx';
import { formatDate } from '../utils/formatDate';

const presets = {
  normal: {
    event_type: 'login_attempt',
    email: 'jyot@example.com',
    ip_address: '192.168.1.10',
    device_id: 'android_001',
    user_agent: 'Mozilla/5.0 Chrome Android',
    request_path: '/api/auth/login',
    request_count: 2,
    form_completion_seconds: 90,
    otp_attempts: 1
  },
  bot: {
    event_type: 'onboarding_attempt',
    email: 'bot1@example.com',
    ip_address: '45.99.88.77',
    device_id: 'bot_device_999',
    user_agent: 'python-requests/2.31',
    request_path: '/api/onboarding/apply',
    request_count: 35,
    form_completion_seconds: 3,
    otp_attempts: 7
  },
  critical: {
    event_type: 'credential_stuffing',
    email: 'many-users@example.com',
    ip_address: '99.88.77.66',
    device_id: 'headless_device_777',
    user_agent: 'HeadlessChrome Selenium Bot',
    request_path: '/api/auth/login',
    request_count: 75,
    form_completion_seconds: 2,
    otp_attempts: 10
  }
};

const initial = { ...presets.normal };
const MAX_EVENTS = 80;

export default function TrafficMonitorPage() {
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState(null);
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [simStatus, setSimStatus] = useState({ running: false, events_generated: 0 });
  const [rate, setRate] = useState(2);
  const [distribution, setDistribution] = useState('mixed');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const seenAtRef = useRef({});
  const [now, setNow] = useState(Date.now());
  const summaryTimerRef = useRef(null);

  const { connected, subscribe } = useRealtime();

  // tick a clock so the "is new" highlight fades smoothly
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  async function refresh() {
    try {
      const [ev, sm, st] = await Promise.all([
        getTrafficEvents(),
        getTrafficSummary(),
        getSimulatorStatus()
      ]);
      setEvents(ev.slice(0, MAX_EVENTS));
      setSummary(sm);
      setSimStatus(st);
      const t = Date.now();
      ev.forEach((e) => {
        if (seenAtRef.current[e.id] === undefined) seenAtRef.current[e.id] = t;
      });
    } catch (err) {
      setError('Failed to load traffic data');
    } finally {
      setLoading(false);
    }
  }

  function scheduleSummaryRefresh() {
    if (summaryTimerRef.current) return;
    summaryTimerRef.current = window.setTimeout(async () => {
      summaryTimerRef.current = null;
      try {
        const sm = await getTrafficSummary();
        setSummary(sm);
      } catch (_) {
        // ignore
      }
    }, 500);
  }

  useEffect(() => {
    refresh();
    return () => {
      if (summaryTimerRef.current) window.clearTimeout(summaryTimerRef.current);
    };
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    return subscribe((msg) => {
      if (!msg) return;
      if (msg.type === 'simulator') {
        setSimStatus(msg.payload || { running: false });
      } else if (msg.type === 'traffic_event') {
        const e = msg.payload;
        if (!e || !e.id) return;
        if (seenAtRef.current[e.id] === undefined) {
          seenAtRef.current[e.id] = Date.now();
        }
        setEvents((prev) => {
          if (prev.some((x) => x.id === e.id)) return prev;
          return [e, ...prev].slice(0, MAX_EVENTS);
        });
        scheduleSummaryRefresh();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe]);

  function isNewEvent(e) {
    const t = seenAtRef.current[e.id];
    return t !== undefined && now - t < 3000;
  }

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
        request_count: Number(form.request_count) || 0,
        form_completion_seconds: Number(form.form_completion_seconds) || 0,
        otp_attempts: Number(form.otp_attempts) || 0
      };
      const data = await analyzeTraffic(payload);
      setResult(data);
    } catch (err) {
      setError('Traffic analysis failed. Is the backend running?');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStart() {
    setError('');
    try {
      await startTrafficSimulator({ rate_per_sec: Number(rate) || 2, distribution });
    } catch (err) {
      setError('Could not start simulator');
    }
  }

  async function handleStop() {
    setError('');
    try {
      await stopTrafficSimulator();
    } catch (err) {
      setError('Could not stop simulator');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Fake User Traffic Detection</h2>
        <p className="muted">
          Detect bots, credential stuffing, and abusive automation patterns.
          <span className={`ws-pill ${connected ? 'ws-on' : 'ws-off'}`}>
            {connected ? 'WebSocket: live' : 'WebSocket: offline'}
          </span>
        </p>
      </div>

      <div className="card glass simulator-card">
        <div className="row-between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="card-title" style={{ marginBottom: 4 }}>
              Real-time traffic simulator
              {simStatus.running && (
                <span className="live-dot">
                  <span className="live-pulse" /> LIVE
                </span>
              )}
            </div>
            <div className="muted small">
              {simStatus.running
                ? `Streaming ${simStatus.rate_per_sec} events/sec · ${simStatus.events_generated} generated this run`
                : 'Click start to stream synthetic traffic into the engine.'}
            </div>
          </div>

          <div className="simulator-controls">
            <label className="inline-field">
              <span>Rate (ev/s)</span>
              <input
                type="number"
                min="0.5"
                max="8"
                step="0.5"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                disabled={simStatus.running}
              />
            </label>

            <label className="inline-field">
              <span>Mix</span>
              <select
                value={distribution}
                onChange={(e) => setDistribution(e.target.value)}
                disabled={simStatus.running}
              >
                <option value="mixed">Mixed</option>
                <option value="normal">Normal users</option>
                <option value="attack">Attack wave</option>
              </select>
            </label>

            {simStatus.running ? (
              <button className="btn btn-danger sim-btn" onClick={handleStop}>
                ■ Stop simulator
              </button>
            ) : (
              <button className="btn btn-primary sim-btn" onClick={handleStart}>
                ▶ Start simulator
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Total Events" value={summary?.total_events} accent="indigo" />
        <StatCard title="High Risk Events" value={summary?.high_risk_events} accent="orange" />
        <StatCard title="Critical Events" value={summary?.critical_events} accent="red" />
        <StatCard title="Blocked Events" value={summary?.blocked_events} accent="dark" />
      </div>

      <div className="grid-2">
        <div className="card glass">
          <div className="preset-row">
            <button type="button" className="btn btn-light" onClick={() => applyPreset('normal')}>
              Normal Traffic
            </button>
            <button type="button" className="btn btn-light" onClick={() => applyPreset('bot')}>
              Bot Traffic
            </button>
            <button type="button" className="btn btn-light" onClick={() => applyPreset('critical')}>
              Critical Bot Attack
            </button>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <label>Event Type
              <input name="event_type" value={form.event_type} onChange={handleChange} />
            </label>
            <label>Email
              <input name="email" value={form.email} onChange={handleChange} />
            </label>
            <label>IP Address
              <input name="ip_address" value={form.ip_address} onChange={handleChange} />
            </label>
            <label>Device ID
              <input name="device_id" value={form.device_id} onChange={handleChange} />
            </label>
            <label>User Agent
              <input name="user_agent" value={form.user_agent} onChange={handleChange} />
            </label>
            <label>Request Path
              <input name="request_path" value={form.request_path} onChange={handleChange} />
            </label>
            <label>Request Count
              <input
                name="request_count"
                type="number"
                min="0"
                value={form.request_count}
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
                {submitting ? 'Analyzing...' : 'Analyze Traffic'}
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
              recommendedAction={result.action_taken}
            />
          ) : (
            <div className="card glass placeholder-card">
              <div className="muted">Submit a traffic event to see the engine result.</div>
            </div>
          )}
        </div>
      </div>

      <div className="card glass">
        <div className="card-title">Live traffic feed</div>
        {loading ? (
          <Loader />
        ) : events.length === 0 ? (
          <div className="muted">No traffic events yet</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Event</th>
                  <th>IP</th>
                  <th>Device</th>
                  <th>User Agent</th>
                  <th>Req</th>
                  <th>Score</th>
                  <th>Level</th>
                  <th>Action</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className={isNewEvent(e) ? 'row-new' : ''}>
                    <td>
                      {e.id}
                      {isNewEvent(e) && <span className="chip chip-new">NEW</span>}
                    </td>
                    <td>{e.event_type}</td>
                    <td>{e.ip_address}</td>
                    <td>{e.device_id}</td>
                    <td className="td-message">{e.user_agent}</td>
                    <td>{e.request_count}</td>
                    <td>{e.risk_score}</td>
                    <td><RiskBadge level={e.risk_level} /></td>
                    <td>{e.action_taken}</td>
                    <td>{formatDate(e.created_at)}</td>
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
