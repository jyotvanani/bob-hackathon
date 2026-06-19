import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate('/', { replace: true });
  }

  return (
    <header className="navbar glass-navbar">
      <div className="navbar-brand">
        <span className="brand-logo">🛡️</span>
        <div>
          <div className="brand-title">AccountGuard AI</div>
          <div className="brand-sub">AI-Based Account Takeover Detection</div>
        </div>
      </div>

      <div className="navbar-right">
        {user && (
          <>
            <div className="user-chip">
              <div className="user-avatar">
                {(user.name || 'U').slice(0, 1).toUpperCase()}
              </div>
              <div className="user-meta">
                <div className="user-name">{user.name}</div>
                <div className="muted small user-role">{user.role}</div>
              </div>
            </div>
            <button className="btn btn-light btn-sm" onClick={handleSignOut}>
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
