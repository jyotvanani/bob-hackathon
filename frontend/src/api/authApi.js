import apiClient from './apiClient';

export async function login(payload) {
  const res = await apiClient.post('/auth/login', payload);
  return res.data;
}

export async function register(payload) {
  const res = await apiClient.post('/auth/register', payload);
  return res.data;
}
