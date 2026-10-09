import { Router } from 'express';
import authRoutes from './authRoutes.js';
import { protect, authorize } from '../middleware/auth.js';
import * as user from '../controllers/userController.js';
import * as vehicle from '../controllers/vehicleController.js';
import * as service from '../controllers/serviceController.js';
import * as partner from '../controllers/partnerController.js';
import * as request from '../controllers/requestController.js';
import * as review from '../controllers/reviewController.js';
import * as complaint from '../controllers/complaintController.js';
import * as notification from '../controllers/notificationController.js';
import * as admin from '../controllers/adminController.js';

const PARTNER = ['MECHANIC', 'TOWING_PARTNER'];
const r = Router();

r.use('/auth', authRoutes);

// users
r.get('/users/profile', protect, user.getProfile);
r.put('/users/profile', protect, user.updateProfile);

// vehicles (owners only)
r.use('/vehicles', protect, authorize('USER'));
r.get('/vehicles', vehicle.list);
r.post('/vehicles', vehicle.create);
r.put('/vehicles/:id', vehicle.update);
r.delete('/vehicles/:id', vehicle.remove);

// services
r.get('/services', protect, service.list);
r.post('/services', protect, authorize('ADMIN'), service.create);
r.put('/services/:id', protect, authorize('ADMIN'), service.update);
r.delete('/services/:id', protect, authorize('ADMIN'), service.remove);

// partners (static paths before :id)
r.get('/partners/nearby', protect, authorize('USER', 'ADMIN'), partner.nearby);
r.get('/partners/profile', protect, authorize(...PARTNER), partner.getMyProfile);
r.put('/partners/profile', protect, authorize(...PARTNER), partner.updateProfile);
r.get('/partners/dashboard', protect, authorize(...PARTNER), partner.dashboard);
r.get('/partners/earnings', protect, authorize(...PARTNER), partner.earnings);
r.patch('/partners/availability', protect, authorize(...PARTNER), partner.setAvailability);
r.patch('/partners/location', protect, authorize(...PARTNER), partner.updateLocation);
r.get('/partners/:id/reviews', protect, review.listForPartner);
r.get('/partners/:id', protect, partner.getById);

// service requests (static paths before :id)
r.post('/requests', protect, authorize('USER'), request.create);
r.get('/requests', protect, request.list);
r.get('/requests/active', protect, request.active);
r.get('/requests/:id', protect, request.getOne);
r.get('/requests/:id/invoice', protect, request.invoice);
r.get('/requests/:id/invoice.pdf', protect, request.invoicePdf);
r.patch('/requests/:id/status', protect, authorize(...PARTNER), request.updateStatus);
r.patch('/requests/:id/accept', protect, authorize(...PARTNER), request.accept);
r.patch('/requests/:id/reject', protect, authorize(...PARTNER), request.reject);
r.patch('/requests/:id/cancel', protect, authorize('USER', 'ADMIN'), request.cancel);

// reviews, complaints, notifications
r.post('/reviews', protect, authorize('USER'), review.create);
r.post('/complaints', protect, authorize('USER'), complaint.create);
r.get('/complaints', protect, authorize('USER', 'ADMIN'), complaint.list);
r.patch('/complaints/:id', protect, authorize('ADMIN'), complaint.update);
r.get('/notifications', protect, notification.list);
r.patch('/notifications/read-all', protect, notification.markAllRead);
r.patch('/notifications/:id/read', protect, notification.markRead);

// admin
r.use('/admin', protect, authorize('ADMIN'));
r.get('/admin/dashboard', admin.dashboard);
r.get('/admin/users', admin.listUsers);
r.get('/admin/users/:id', admin.getUser);
r.patch('/admin/users/:id/status', admin.setUserStatus);
r.get('/admin/partners', admin.listPartners);
r.get('/admin/partners/:id', admin.getPartner);
r.patch('/admin/partners/:id/verify', admin.verifyPartner);
r.patch('/admin/partners/:id/reject', admin.rejectPartner);
r.patch('/admin/partners/:id/suspend', admin.suspendPartner);
r.patch('/admin/partners/:id/reactivate', admin.reactivatePartner);
r.get('/admin/requests', admin.listRequests);
r.get('/admin/complaints', complaint.list);
r.get('/admin/reports', admin.reports);

export default r;
