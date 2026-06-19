import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { RequireAuth } from '../auth/RequireAuth.jsx';

import AuthPage from '../pages/AuthPage.jsx';
import UserHomePage from '../pages/UserHomePage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import AdminDashboard from '../pages/AdminDashboard.jsx';
import RiskAnalysisPage from '../pages/RiskAnalysisPage.jsx';
import TransactionsPage from '../pages/TransactionsPage.jsx';
import AlertsPage from '../pages/AlertsPage.jsx';
import CasesPage from '../pages/CasesPage.jsx';
import OnboardingPage from '../pages/OnboardingPage.jsx';
import TrafficMonitorPage from '../pages/TrafficMonitorPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

export default function AppRoutes() {
  const { user, ready } = useAuth();
  if (!ready) return null;

  return (
    <Routes>
      {/* Public auth route - no Layout */}
      <Route path="/" element={<AuthPage />} />

      {/* Authenticated routes - wrapped in Layout */}
      <Route
        path="/home"
        element={
          <RequireAuth>
            <Layout>
              <UserHomePage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireAuth role="admin">
            <Layout>
              <AdminDashboard />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/risk-analysis"
        element={
          <RequireAuth>
            <Layout>
              <RiskAnalysisPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/transactions"
        element={
          <RequireAuth>
            <Layout>
              <TransactionsPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/alerts"
        element={
          <RequireAuth role="admin">
            <Layout>
              <AlertsPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/cases"
        element={
          <RequireAuth role="admin">
            <Layout>
              <CasesPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/onboarding"
        element={
          <RequireAuth role="admin">
            <Layout>
              <OnboardingPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/traffic-monitor"
        element={
          <RequireAuth role="admin">
            <Layout>
              <TrafficMonitorPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/login-simulator"
        element={
          <RequireAuth>
            <Layout>
              <LoginPage />
            </Layout>
          </RequireAuth>
        }
      />

      <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
    </Routes>
  );
}
