import apiClient from './apiClient';

export async function applyOnboarding(data) {
  const res = await apiClient.post('/onboarding/apply', data);
  return res.data;
}

export async function getOnboardingApplications() {
  const res = await apiClient.get('/onboarding/applications');
  return res.data;
}

export async function getOnboardingApplicationById(id) {
  const res = await apiClient.get(`/onboarding/applications/${id}`);
  return res.data;
}

export async function updateOnboardingApplication(id, data) {
  const res = await apiClient.patch(`/onboarding/applications/${id}`, data);
  return res.data;
}
