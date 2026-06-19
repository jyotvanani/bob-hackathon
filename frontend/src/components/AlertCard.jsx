import React from 'react';
import RiskBadge from './RiskBadge.jsx';
import { formatDate } from '../utils/formatDate';

export default function AlertCard({ alert }) {
  return (
    <div className="alert-card">
      <div className="alert-card-header">
        <span className="alert-type">{alert.alert_type}</span>
        <RiskBadge level={alert.risk_level} />
      </div>
      <div className="alert-message">{alert.message}</div>
      <div className="alert-meta">
        <span>Status: {alert.status}</span>
        <span>{formatDate(alert.created_at)}</span>
      </div>
    </div>
  );
}
