import apiClient from './apiClient';

export async function createTransaction(payload) {
  const res = await apiClient.post('/transactions', payload);
  return res.data;
}

export async function getTransactions() {
  const res = await apiClient.get('/transactions');
  return res.data;
}
