import React from 'react';

export default function StatCard({ title, value, subtitle, accent }) {
  return (
    <div className={`stat-card ${accent ? `stat-${accent}` : ''}`}>
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value ?? 0}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </div>
  );
}
