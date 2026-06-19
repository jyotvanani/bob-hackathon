import apiClient from './apiClient';

export async function analyzeTraffic(data) {
  const res = await apiClient.post('/traffic/analyze', data);
  return res.data;
}

export async function getTrafficEvents() {
  const res = await apiClient.get('/traffic/events');
  return res.data;
}

export async function getTrafficSummary() {
  const res = await apiClient.get('/traffic/summary');
  return res.data;
}

export async function startTrafficSimulator(payload = { rate_per_sec: 2, distribution: 'mixed' }) {
  const res = await apiClient.post('/traffic/simulator/start', payload);
  return res.data;
}

export async function stopTrafficSimulator() {
  const res = await apiClient.post('/traffic/simulator/stop');
  return res.data;
}

export async function getSimulatorStatus() {
  const res = await apiClient.get('/traffic/simulator/status');
  return res.data;
}
