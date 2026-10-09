import api from './api.js';

export const requestService = {
  create: (payload) => api.post('/requests', payload).then((r) => r.data),
  list: (params) => api.get('/requests', { params }).then((r) => r.data),
  openForPartner: () => api.get('/requests', { params: { scope: 'open' } }).then((r) => r.data.requests),
  active: () => api.get('/requests/active').then((r) => r.data.request),
  get: (id) => api.get(`/requests/${id}`).then((r) => r.data.request),
  accept: (id) => api.patch(`/requests/${id}/accept`).then((r) => r.data.request),
  reject: (id) => api.patch(`/requests/${id}/reject`).then((r) => r.data),
  setStatus: (id, status, extra = {}) => api.patch(`/requests/${id}/status`, { status, ...extra }).then((r) => r.data.request),
  cancel: (id, reason) => api.patch(`/requests/${id}/cancel`, { reason }).then((r) => r.data.request),
  invoice: (id) => api.get(`/requests/${id}/invoice`).then((r) => r.data.invoice),
  downloadInvoicePdf: async (id, name = 'service-summary') => {
    const res = await api.get(`/requests/${id}/invoice.pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
