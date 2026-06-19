import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import AdminDashboard from '../pages/AdminDashboard.jsx';
import RiskAnalysisPage from '../pages/RiskAnalysisPage.jsx';
import TransactionsPage from '../pages/TransactionsPage.jsx';
import AlertsPage from '../pages/AlertsPage.jsx';
import CasesPage from '../pages/CasesPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

export default function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/risk-analysis" element={<RiskAnalysisPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
