import apiClient from './apiClient';

export async function analyzeLogin(payload) {
  const res = await apiClient.post('/risk/analyze-login', payload);
  return res.data;
}

export async function getUserRiskHistory(userId) {
  const res = await apiClient.get(`/risk/user/${userId}`);
  return res.data;
}
