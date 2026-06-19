import apiClient from './apiClient';

export async function getCases() {
  const res = await apiClient.get('/cases');
  return res.data;
}

export async function updateCase(caseId, payload) {
  const res = await apiClient.patch(`/cases/${caseId}`, payload);
  return res.data;
}
