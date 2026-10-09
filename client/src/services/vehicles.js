import api from './api.js';

export const vehicleService = {
  list: () => api.get('/vehicles').then((r) => r.data.vehicles),
  create: (payload) => api.post('/vehicles', payload).then((r) => r.data.vehicle),
  update: (id, payload) => api.put(`/vehicles/${id}`, payload).then((r) => r.data.vehicle),
  remove: (id) => api.delete(`/vehicles/${id}`).then((r) => r.data),
};
