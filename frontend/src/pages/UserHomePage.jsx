import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { getUserRiskHistory } from '../api/riskApi';
import { getTransactions } from '../api/transactionApi';
import RiskBadge from '../components/RiskBadge.jsx';
import StatCard from '../components/StatCard.jsx';
import Loader from '../components/Loader.jsx';
import { formatDate } from '../utils/formatDate';

export default function UserHomePage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const [h, t] = await Promise.all([
          getUserRiskHistory(user.id),
          getTransactions()
        ]);
        if (cancelled) return;
        setHistory(h.history || []);
        setTransactions((t || []).filter((x) => x.user_id === user.id).slice(0, 5));
      } catch (err) {
        if (!cancelled) setError('Could not load your activity');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  const recentRisk = history.slice(0, 5);
  const highRiskCount = history.filter((h) =>
    ['High', 'Critical'].includes(h.risk_level)
  ).length;
  const lastLogin = history[0];

  return (
    <div className="page">
      <div className="page-header">
        <h2>Welcome back, {user.name.split(' ')[0]} 👋</h2>
        <p className="muted">
          Here's a private overview of your account safety.
        </p>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Last login risk"
          value={lastLogin ? `${lastLogin.risk_score}` : '—'}
          subtitle={lastLogin ? lastLogin.risk_level : 'No data'}
          accent="indigo"
        />
        <StatCard title="Logins recorded" value={history.length} accent="blue" />
        <StatCard title="High-risk logins" value={highRiskCount} accent="red" />
        <StatCard title="My transactions" value={transactions.length} accent="teal" />
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-2">
        <div className="card glass">
          <div className="card-title">Recent login activity</div>
          {loading ? (
            <Loader />
          ) : recentRisk.length === 0 ? (
            <div className="muted">No login history yet</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>City</th>
                    <th>Device</th>
                    <th>Score</th>
                    <th>Level</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRisk.map((r) => (
                    <tr key={r.id}>
                      <td>{formatDate(r.created_at)}</td>
                      <td>{r.city || '—'}</td>
                      <td>{r.device_id || '—'}</td>
                      <td>{r.risk_score}</td>
                      <td><RiskBadge level={r.risk_level} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card glass">
          <div className="card-title">Recent transactions</div>
          {loading ? (
            <Loader />
          ) : transactions.length === 0 ? (
            <div className="muted">No transactions yet</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Amount</th>
                    <th>Beneficiary</th>
                    <th>Status</th>
                    <th>Level</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{formatDate(t.created_at)}</td>
                      <td>₹{t.amount.toLocaleString()}</td>
                      <td>{t.beneficiary_name}</td>
                      <td>{t.status}</td>
                      <td><RiskBadge level={t.risk_level} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card glass">
        <div className="card-title">Quick actions</div>
        <div className="quick-actions">
          <Link className="btn btn-primary" to="/risk-analysis">Run risk check</Link>
          <Link className="btn btn-light" to="/transactions">Make a transaction</Link>
          <Link className="btn btn-light" to="/login-simulator">Try login simulator</Link>
        </div>
      </div>
    </div>
  );
}
