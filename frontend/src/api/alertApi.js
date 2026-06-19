import apiClient from './apiClient';

export async function getAlerts() {
  const res = await apiClient.get('/alerts');
  return res.data;
}

export async function updateAlert(alertId, payload) {
  const res = await apiClient.patch(`/alerts/${alertId}`, payload);
  return res.data;
}
