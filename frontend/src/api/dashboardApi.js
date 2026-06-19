import apiClient from './apiClient';

export async function getSummary() {
  const res = await apiClient.get('/dashboard/summary');
  return res.data;
}

export async function getRiskDistribution() {
  const res = await apiClient.get('/dashboard/risk-distribution');
  return res.data;
}

export async function getFraudReasons() {
  const res = await apiClient.get('/dashboard/fraud-reasons');
  return res.data;
}

export async function getLoginTrends() {
  const res = await apiClient.get('/dashboard/login-trends');
  return res.data;
}
