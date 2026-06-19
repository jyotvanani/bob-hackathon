import React, { useEffect, useState } from 'react';
import { getCases, updateCase } from '../api/caseApi';
import { CASE_STATUSES } from '../utils/constants';
import Loader from '../components/Loader.jsx';
import { formatDate } from '../utils/formatDate';

export default function CasesPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [edits, setEdits] = useState({});

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getCases();
      setCases(data);
    } catch (err) {
      setError('Failed to load cases');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function getEdit(id, key, fallback) {
    return edits[id]?.[key] ?? fallback;
  }

  function setEdit(id, key, value) {
    setEdits({ ...edits, [id]: { ...(edits[id] || {}), [key]: value } });
  }

  async function handleSave(c) {
    try {
      await updateCase(c.id, {
        case_status: getEdit(c.id, 'case_status', c.case_status),
        admin_notes: getEdit(c.id, 'admin_notes', c.admin_notes)
      });
      setEdits({ ...edits, [c.id]: undefined });
      load();
    } catch (err) {
      setError('Failed to update case');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Fraud Cases</h2>
        <p className="muted">Investigate suspicious activity and update case status.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        {loading ? (
          <Loader />
        ) : cases.length === 0 ? (
          <div className="muted">No fraud cases yet</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>User</th>
                  <th>Alert</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Admin Notes</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.user_id}</td>
                    <td>{c.alert_id ?? '—'}</td>
                    <td>{c.risk_score}</td>
                    <td>
                      <select
                        value={getEdit(c.id, 'case_status', c.case_status)}
                        onChange={(e) => setEdit(c.id, 'case_status', e.target.value)}
                      >
                        {CASE_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={getEdit(c.id, 'admin_notes', c.admin_notes || '')}
                        onChange={(e) => setEdit(c.id, 'admin_notes', e.target.value)}
                        placeholder="Add notes..."
                        style={{ minWidth: 220 }}
                      />
                    </td>
                    <td>{formatDate(c.created_at)}</td>
                    <td>{formatDate(c.updated_at)}</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => handleSave(c)}>
                        Save
                      </button>
                    </td>
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
