import api from './api.js';

export const reviewService = {
  create: (payload) => api.post('/reviews', payload).then((r) => r.data.review),
};

export const complaintService = {
  create: (payload) => api.post('/complaints', payload).then((r) => r.data.complaint),
  list: (params) => api.get('/complaints', { params }).then((r) => r.data),
  update: (id, payload) => api.patch(`/complaints/${id}`, payload).then((r) => r.data.complaint),
};

export const notificationService = {
  list: (params) => api.get('/notifications', { params }).then((r) => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then((r) => r.data),
};
