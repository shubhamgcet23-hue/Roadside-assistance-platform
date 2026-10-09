import api from './api.js';

export const catalogService = {
  list: ({ all = false } = {}) => api.get('/services', { params: all ? { all: true } : {} }).then((r) => r.data.services),
  create: (payload) => api.post('/services', payload).then((r) => r.data.service),
  update: (id, payload) => api.put(`/services/${id}`, payload).then((r) => r.data.service),
  deactivate: (id) => api.delete(`/services/${id}`).then((r) => r.data.service),
};
