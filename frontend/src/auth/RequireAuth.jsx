import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export function RequireAuth({ children, role }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return null;
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  if (role && user.role !== role) return <Navigate to="/home" replace />;
  return children;
}
