import React, { useEffect, useState } from 'react';
import {
  getSummary,
  getRiskDistribution,
  getFraudReasons,
  getLoginTrends
} from '../api/dashboardApi';
import { getAlerts } from '../api/alertApi';
import StatCard from '../components/StatCard.jsx';
import AlertCard from '../components/AlertCard.jsx';
import Loader from '../components/Loader.jsx';
import RiskDistributionChart from '../charts/RiskDistributionChart.jsx';
import FraudReasonChart from '../charts/FraudReasonChart.jsx';
import LoginTrendChart from '../charts/LoginTrendChart.jsx';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [riskDist, setRiskDist] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [trends, setTrends] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [s, rd, fr, lt, al] = await Promise.all([
          getSummary(),
          getRiskDistribution(),
          getFraudReasons(),
          getLoginTrends(),
          getAlerts()
        ]);
        if (cancelled) return;
        setSummary(s);
        setRiskDist(rd);
        setReasons(fr);
        setTrends(lt);
        setAlerts(al.slice(0, 5));
      } catch (err) {
        if (!cancelled) setError('Could not load dashboard. Is the backend running?');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="page"><Loader /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Admin Dashboard</h2>
        <p className="muted">Live overview of authentication and transaction risk.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stats-grid">
        <StatCard title="Total Users" value={summary?.total_users} accent="blue" />
        <StatCard title="Total Logins" value={summary?.total_logins} accent="indigo" />
        <StatCard title="Total Transactions" value={summary?.total_transactions} accent="teal" />
        <StatCard title="Total Alerts" value={summary?.total_alerts} accent="orange" />
        <StatCard title="High-Risk Logins" value={summary?.high_risk_logins} accent="red" />
        <StatCard title="Open Cases" value={summary?.open_cases} accent="dark" />
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="card-title">Risk Distribution</div>
          <RiskDistributionChart data={riskDist} />
        </div>
        <div className="card">
          <div className="card-title">Top Fraud Reasons</div>
          <FraudReasonChart data={reasons} />
        </div>
        <div className="card">
          <div className="card-title">Login Trends (last 7 days)</div>
          <LoginTrendChart data={trends} />
        </div>
      </div>

      <div className="card">
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
