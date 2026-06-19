import React, { useEffect, useRef, useState } from 'react';
import {
  getSummary,
  getRiskDistribution,
  getFraudReasons,
  getLoginTrends
} from '../api/dashboardApi';
import { getAlerts } from '../api/alertApi';
import { getSimulatorStatus } from '../api/trafficApi';
import { useRealtime } from '../realtime/RealtimeContext.jsx';
import StatCard from '../components/StatCard.jsx';
import AlertCard from '../components/AlertCard.jsx';
import Loader from '../components/Loader.jsx';
import RiskDistributionChart from '../charts/RiskDistributionChart.jsx';
import FraudReasonChart from '../charts/FraudReasonChart.jsx';
import LoginTrendChart from '../charts/LoginTrendChart.jsx';

// Debounce dashboard refreshes so a flood of WS events doesn't hammer the API.
const REFRESH_DEBOUNCE_MS = 600;

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [riskDist, setRiskDist] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [trends, setTrends] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [simStatus, setSimStatus] = useState({ running: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pulse, setPulse] = useState(0);
  const lastTrafficRef = useRef(0);
  const refreshTimerRef = useRef(null);

  const { connected, subscribe } = useRealtime();

  async function load() {
    try {
      const [s, rd, fr, lt, al, ss] = await Promise.all([
        getSummary(),
        getRiskDistribution(),
        getFraudReasons(),
        getLoginTrends(),
        getAlerts(),
        getSimulatorStatus()
      ]);
      setSummary(s);
      setRiskDist(rd);
      setReasons(fr);
      setTrends(lt);
      setAlerts(al.slice(0, 5));
      setSimStatus(ss);
      if (s.total_traffic_events !== lastTrafficRef.current) {
        lastTrafficRef.current = s.total_traffic_events;
        setPulse((p) => p + 1);
      }
    } catch (err) {
      setError('Could not load dashboard. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  function scheduleRefresh() {
    if (refreshTimerRef.current) return;
    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      load();
    }, REFRESH_DEBOUNCE_MS);
  }

  useEffect(() => {
    load();
    return () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    return subscribe((msg) => {
      if (!msg) return;
      switch (msg.type) {
        case 'simulator':
          setSimStatus(msg.payload || { running: false });
          break;
        case 'traffic_event':
        case 'login':
        case 'transaction':
        case 'onboarding':
        case 'alert':
        case 'case':
          scheduleRefresh();
          break;
        default:
          break;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe]);

  if (loading && !summary) return <div className="page"><Loader /></div>;

  return (
    <div className="page">
      <div className="page-header row-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>Admin Dashboard</h2>
          <p className="muted">
            Live overview of authentication, transactions, onboarding and traffic.
            <span className={`ws-pill ${connected ? 'ws-on' : 'ws-off'}`}>
              {connected ? 'WebSocket: live' : 'WebSocket: offline'}
            </span>
          </p>
        </div>
        {simStatus.running && (
          <span className="live-pill" key={pulse}>
            <span className="live-pulse" /> Live simulator · {simStatus.rate_per_sec} ev/s
          </span>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stats-grid">
        <StatCard title="Total Users" value={summary?.total_users} accent="blue" />
        <StatCard title="Total Logins" value={summary?.total_logins} accent="indigo" />
        <StatCard title="Total Transactions" value={summary?.total_transactions} accent="teal" />
        <StatCard title="Total Alerts" value={summary?.total_alerts} accent="orange" />
        <StatCard title="High-Risk Logins" value={summary?.high_risk_logins} accent="red" />
        <StatCard title="Open Cases" value={summary?.open_cases} accent="dark" />
        <StatCard title="Onboarding Apps" value={summary?.total_onboarding_applications} accent="indigo" />
        <StatCard title="High-Risk Onboarding" value={summary?.high_risk_onboarding_applications} accent="red" />
        <StatCard title="Traffic Events" value={summary?.total_traffic_events} accent="teal" />
        <StatCard title="Critical Traffic" value={summary?.critical_traffic_events} accent="dark" />
      </div>

      <div className="grid-3">
        <div className="card glass">
          <div className="card-title">Risk Distribution</div>
          <RiskDistributionChart data={riskDist} />
        </div>
        <div className="card glass">
          <div className="card-title">Top Fraud Reasons</div>
          <FraudReasonChart data={reasons} />
        </div>
        <div className="card glass">
          <div className="card-title">Activity Trends (last 7 days)</div>
          <LoginTrendChart data={trends} />
        </div>
      </div>

      <div className="card glass">
        <div className="card-title">Recent Alerts</div>
        {alerts.length === 0 ? (
          <div className="muted">No alerts yet</div>
        ) : (
          <div className="alerts-grid">
            {alerts.map((a) => (
              <AlertCard key={a.id} alert={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
