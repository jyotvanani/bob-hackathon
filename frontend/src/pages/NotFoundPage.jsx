import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page page-center">
      <div className="card" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 48, margin: 0 }}>404</h1>
        <p className="muted">Page not found</p>
        <Link className="btn btn-primary" to="/">
          Go to Login
        </Link>
      </div>
    </div>
  );
}
