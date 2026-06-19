import React, { useEffect, useState } from 'react';
import { createTransaction, getTransactions } from '../api/transactionApi';
import RiskBadge from '../components/RiskBadge.jsx';
import RiskScoreCard from '../components/RiskScoreCard.jsx';
import Loader from '../components/Loader.jsx';
import { formatDate } from '../utils/formatDate';

const presets = {
  normal: {
    user_id: 1,
    amount: 1000,
    beneficiary_id: 'BEN001',
    beneficiary_name: 'Known Receiver',
    is_new_beneficiary: false,
    city: 'Surat',
    country: 'India',
    transaction_hour: 14
  },
  high: {
    user_id: 1,
    amount: 90000,
    beneficiary_id: 'BEN999',
    beneficiary_name: 'Unknown Receiver',
    is_new_beneficiary: true,
    city: 'Delhi',
    country: 'India',
    transaction_hour: 2
  },
  critical: {
    user_id: 1,
    amount: 150000,
    beneficiary_id: 'BEN777',
    beneficiary_name: 'Foreign Receiver',
    is_new_beneficiary: true,
    city: 'Unknown',
    country: 'Russia',
    transaction_hour: 3
  }
};

const initial = { ...presets.normal };

export default function TransactionsPage() {
  const [form, setForm] = useState(initial);
  const [transactions, setTransactions] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      setError('Could not load transactions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleChange(e) {
    const { name, type, value, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  function applyPreset(key) {
    setForm({ ...presets[key] });
    setResult(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setResult(null);
    try {
      const payload = {
        user_id: Number(form.user_id),
        amount: Number(form.amount),
        beneficiary_id: form.beneficiary_id,
        beneficiary_name: form.beneficiary_name,
        is_new_beneficiary: !!form.is_new_beneficiary,
        city: form.city,
        country: form.country,
        transaction_hour:
          form.transaction_hour === '' ? null : Number(form.transaction_hour)
      };
      const data = await createTransaction(payload);
      setResult(data);
      load();
    } catch (err) {
      setError('Could not create transaction');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Transactions</h2>
        <p className="muted">Simulate transactions and inspect engine decisions.</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="preset-row">
            <button type="button" className="btn btn-light" onClick={() => applyPreset('normal')}>
              Normal Transaction
            </button>
            <button type="button" className="btn btn-light" onClick={() => applyPreset('high')}>
              High Risk
            </button>
            <button type="button" className="btn btn-light" onClick={() => applyPreset('critical')}>
              Critical
            </button>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <label>User ID
              <input name="user_id" type="number" value={form.user_id} onChange={handleChange} required />
            </label>
            <label>Amount
              <input name="amount" type="number" value={form.amount} onChange={handleChange} required />
            </label>
            <label>Beneficiary ID
              <input name="beneficiary_id" value={form.beneficiary_id} onChange={handleChange} />
            </label>
            <label>Beneficiary Name
              <input name="beneficiary_name" value={form.beneficiary_name} onChange={handleChange} />
            </label>
            <label>City
              <input name="city" value={form.city} onChange={handleChange} />
            </label>
            <label>Country
              <input name="country" value={form.country} onChange={handleChange} />
            </label>
            <label>Hour (0-23)
              <input
                name="transaction_hour"
                type="number"
                min="0"
                max="23"
                value={form.transaction_hour}
                onChange={handleChange}
              />
            </label>
            <label className="checkbox-row">
              <input
                name="is_new_beneficiary"
                type="checkbox"
                checked={!!form.is_new_beneficiary}
                onChange={handleChange}
              />
              New beneficiary
            </label>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Processing...' : 'Submit Transaction'}
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
              <div className="muted">Submit a transaction to see the engine result.</div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Transaction History</div>
        {loading ? (
          <Loader />
        ) : transactions.length === 0 ? (
          <div className="muted">No transactions yet</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Beneficiary</th>
                  <th>City</th>
                  <th>Country</th>
                  <th>Hour</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Reasons</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.user_id}</td>
                    <td>₹{t.amount.toLocaleString()}</td>
                    <td>
                      {t.beneficiary_name}
                      {t.is_new_beneficiary && <span className="chip chip-warn">new</span>}
                    </td>
                    <td>{t.city}</td>
                    <td>{t.country}</td>
                    <td>{t.transaction_hour}</td>
                    <td><RiskBadge level={t.risk_level} /></td>
                    <td>{t.status}</td>
                    <td className="td-message">{t.risk_reasons}</td>
                    <td>{formatDate(t.created_at)}</td>
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
