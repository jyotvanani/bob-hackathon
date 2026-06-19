import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const ADMIN_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/risk-analysis', label: 'Risk Analysis', icon: '🧠' },
  { to: '/transactions', label: 'Transactions', icon: '💳' },
  { to: '/alerts', label: 'Alerts', icon: '🚨' },
  { to: '/cases', label: 'Fraud Cases', icon: '📁' },
  { to: '/onboarding', label: 'KYC Onboarding', icon: '🪪' },
  { to: '/traffic-monitor', label: 'Fake Traffic', icon: '🤖' },
  { to: '/login-simulator', label: 'Login Simulator', icon: '🔐' }
];

const CUSTOMER_LINKS = [
  { to: '/home', label: 'Home', icon: '🏠' },
  { to: '/risk-analysis', label: 'Risk Analysis', icon: '🧠' },
  { to: '/transactions', label: 'Transactions', icon: '💳' },
  { to: '/login-simulator', label: 'Login Simulator', icon: '🔐' }
];

export default function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const links = isAdmin ? ADMIN_LINKS : CUSTOMER_LINKS;

  return (
    <aside className="sidebar glass-sidebar">
      <div className="sidebar-section-title">
        {isAdmin ? 'Admin Console' : 'My Account'}
      </div>
      <nav>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
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
        <div className="muted small">AccountGuard AI</div>
        <div className="muted small">v1.1.0</div>
      </div>
    </aside>
  );
}
