import api from './api.js';

export const adminService = {
  dashboard: () => api.get('/admin/dashboard').then((r) => r.data),
  users: (params) => api.get('/admin/users', { params }).then((r) => r.data),
  user: (id) => api.get(`/admin/users/${id}`).then((r) => r.data),
  setUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }).then((r) => r.data.user),
  partners: (params) => api.get('/admin/partners', { params }).then((r) => r.data),
  partner: (id) => api.get(`/admin/partners/${id}`).then((r) => r.data),
  partnerAction: (id, action, body) => api.patch(`/admin/partners/${id}/${action}`, body).then((r) => r.data.profile),
  requests: (params) => api.get('/admin/requests', { params }).then((r) => r.data),
  complaints: (params) => api.get('/admin/complaints', { params }).then((r) => r.data),
  reports: (params) => api.get('/admin/reports', { params }).then((r) => r.data),
};
