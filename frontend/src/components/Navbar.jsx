import React from 'react';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="brand-logo">🛡️</span>
        <div>
          <div className="brand-title">AccountGuard AI</div>
          <div className="brand-sub">AI-Based Account Takeover Detection</div>
        </div>
      </div>
      <div className="navbar-right">
        <span className="env-tag">Demo</span>
      </div>
    </header>
  );
}
