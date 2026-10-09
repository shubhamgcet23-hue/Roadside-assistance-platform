import api from './api.js';

export const partnerService = {
  nearby: ({ lat, lng, serviceType }) => api.get('/partners/nearby', { params: { lat, lng, serviceType } }).then((r) => r.data),
  profile: () => api.get('/partners/profile').then((r) => r.data.profile),
  updateProfile: (payload) => api.put('/partners/profile', payload).then((r) => r.data.profile),
  setAvailability: (availability) => api.patch('/partners/availability', { availability }).then((r) => r.data.profile),
  updateLocation: (payload) => api.patch('/partners/location', payload).then((r) => r.data),
  dashboard: () => api.get('/partners/dashboard').then((r) => r.data),
  earnings: () => api.get('/partners/earnings').then((r) => r.data),
  reviews: (id, params) => api.get(`/partners/${id}/reviews`, { params }).then((r) => r.data),
};
