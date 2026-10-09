import mongoose from 'mongoose';
import { STATUS } from '../utils/lifecycle.js';
export { STATUS, TRANSITIONS, canTransition } from '../utils/lifecycle.js';

const ref = (name, extra = {}) => ({ type: mongoose.Schema.Types.ObjectId, ref: name, ...extra });

const schema = new mongoose.Schema({
  userId: ref('User', { required: true, index: true }),
  vehicleId: ref('Vehicle', { required: true }),
  serviceId: ref('Service', { required: true }),
  partnerId: ref('User', { index: true }),
  preferredPartnerId: ref('User'),
  notifiedPartners: [ref('User')],
  rejectedBy: [ref('User')],
  serviceType: { type: String, required: true },
  description: String,
  issue: String,
  emergencyLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  breakdownLocation: {
    address: String,
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  pricing: { baseCost: Number, distanceKm: Number, distanceCharge: Number, total: Number },
  estimatedCost: Number,
  finalCost: Number,
  estimatedArrivalTime: Date,
  actualArrivalTime: Date,
  status: { type: String, enum: STATUS, default: 'PENDING', index: true },
  paymentStatus: { type: String, enum: ['PAYMENT_PENDING', 'OFFLINE_PAYMENT', 'PAID', 'REFUNDED'], default: 'OFFLINE_PAYMENT' },
  acceptedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  rating: Number,
  review: String,
}, { timestamps: true });

schema.index({ createdAt: -1 });
schema.index({ partnerId: 1, status: 1 });
schema.index({ userId: 1, status: 1 });

export const ServiceRequest = mongoose.model('ServiceRequest', schema);
