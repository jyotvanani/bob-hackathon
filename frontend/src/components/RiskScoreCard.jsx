import React from 'react';
import RiskBadge from './RiskBadge.jsx';
import { riskColor } from '../utils/riskUtils';

export default function RiskScoreCard({ riskScore, riskLevel, reasons = [], recommendedAction }) {
  const color = riskColor(riskLevel);
  return (
    <div className="risk-score-card">
      <div className="risk-score-header">
        <div>
          <div className="risk-score-label">Risk Score</div>
          <div className="risk-score-value" style={{ color }}>
            {riskScore}
            <span className="risk-score-max">/100</span>
          </div>
        </div>
        <RiskBadge level={riskLevel} />
      </div>

      <div className="risk-score-section">
        <div className="risk-section-title">Reasons</div>
        {reasons && reasons.length > 0 ? (
          <ul className="risk-reasons-list">
            {reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        ) : (
          <div className="muted">No risk signals detected</div>
        )}
      </div>

      <div className="risk-score-section">
        <div className="risk-section-title">Recommended Action</div>
        <div className="risk-action" style={{ borderLeftColor: color }}>
          {recommendedAction || '—'}
        </div>
      </div>
    </div>
  );
}
