import React from 'react';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Layout({ children }) {
  const { user } = useAuth();
  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        {user && <Sidebar />}
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
