import React from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Login', icon: '🔐', end: true },
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/risk-analysis', label: 'Risk Analysis', icon: '🧠' },
  { to: '/transactions', label: 'Transactions', icon: '💳' },
  { to: '/alerts', label: 'Alerts', icon: '🚨' },
  { to: '/cases', label: 'Cases', icon: '📁' }
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-section-title">Navigation</div>
      <nav>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <span className="sidebar-icon">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="muted small">Hackathon Demo</div>
        <div className="muted small">v1.0.0</div>
      </div>
    </aside>
  );
}
