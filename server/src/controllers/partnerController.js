import { z } from 'zod';
import { PartnerProfile } from '../models/PartnerProfile.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { Service, SERVICE_TYPES } from '../models/Service.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { findNearbyPartners } from '../services/partnerService.js';
import { broadcastLocation } from '../services/tracking.js';
import { populateRequest } from '../services/requestService.js';
import { JOB_STATUSES } from '../utils/lifecycle.js';
import { fillDays, lastNDays } from '../utils/series.js';

const nearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  serviceType: z.enum(SERVICE_TYPES),
});
const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  requestId: z.string().optional(),
});
const profileSchema = z.object({
  experienceYears: z.number().min(0).max(60).optional(),
  services: z.array(z.enum(SERVICE_TYPES)).optional(),
  pricing: z.array(z.object({ serviceCode: z.enum(SERVICE_TYPES), basePrice: z.number().min(0).max(100000) })).optional(),
  serviceRadiusKm: z.number().min(1).max(100).optional(),
  address: z.string().max(300).optional(),
  governmentIdRef: z.string().max(100).optional(),
  licenseRef: z.string().max(100).optional(),
});

const mine = async (userId) => {
  const p = await PartnerProfile.findOne({ userId });
  if (!p) throw new ApiError(404, 'Partner profile not found');
  return p;
};

export const nearby = asyncHandler(async (req, res) => {
  const q = nearbySchema.parse(req.query);
  const service = await Service.findOne({ code: q.serviceType, isActive: true });
  if (!service) throw new ApiError(404, 'Service not available');
  const partners = await findNearbyPartners({ latitude: q.lat, longitude: q.lng, service });
  res.json({ success: true, count: partners.length, partners, message: partners.length ? undefined : 'No mechanics available nearby.' });
});

export const getById = asyncHandler(async (req, res) => {
  const p = await PartnerProfile.findOne({ userId: req.params.id }).populate('userId', 'name avatar role');
  if (!p) throw new ApiError(404, 'Partner not found');
  const { userId, services, experienceYears, ratingAverage, ratingCount, jobsCompleted, verificationStatus, availability } = p;
  res.json({ success: true, partner: { id: userId._id, name: userId.name, avatar: userId.avatar, role: userId.role, services, experienceYears, ratingAverage, ratingCount, jobsCompleted, verificationStatus, availability } });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, profile: await mine(req.user._id) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const p = await mine(req.user._id);
  Object.assign(p, profileSchema.parse(req.body));
  await p.save();
  res.json({ success: true, profile: p });
});

export const setAvailability = asyncHandler(async (req, res) => {
  const { availability } = z.object({ availability: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE']) }).parse(req.body);
  const p = await mine(req.user._id);
  if (availability !== 'OFFLINE' && p.verificationStatus !== 'VERIFIED') {
    throw new ApiError(403, 'Your profile must be verified before you can go online');
  }
  if (availability === 'AVAILABLE' && p.location.coordinates[0] === 0 && p.location.coordinates[1] === 0) {
    throw new ApiError(400, 'Set your location first so customers nearby can find you');
  }
  if (availability === 'AVAILABLE' && await ServiceRequest.exists({ partnerId: req.user._id, status: { $in: JOB_STATUSES } })) {
    throw new ApiError(409, 'Finish your active job before going available');
  }
  p.availability = availability;
  await p.save();
  res.json({ success: true, profile: p });
});

export const updateLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude, requestId } = locationSchema.parse(req.body);
  const p = await mine(req.user._id);
  p.location = { type: 'Point', coordinates: [longitude, latitude] };
  await p.save();
  if (requestId) {
    const request = await ServiceRequest.findOne({ _id: requestId, partnerId: req.user._id, status: { $in: JOB_STATUSES } });
    if (request) broadcastLocation(request, latitude, longitude);
  }
  res.json({ success: true });
});

const sumEarnings = async (match) => {
  const [row] = await ServiceRequest.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: { $ifNull: ['$finalCost', '$estimatedCost'] } }, jobs: { $sum: 1 } } },
  ]);
  return { total: row?.total ?? 0, jobs: row?.jobs ?? 0 };
};

export const dashboard = asyncHandler(async (req, res) => {
  const partnerId = req.user._id;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [profile, todayAccepted, active, completed, today] = await Promise.all([
    mine(partnerId),
    ServiceRequest.countDocuments({ partnerId, acceptedAt: { $gte: startOfDay } }),
    ServiceRequest.countDocuments({ partnerId, status: { $in: JOB_STATUSES } }),
    ServiceRequest.countDocuments({ partnerId, status: 'COMPLETED' }),
    sumEarnings({ partnerId, status: 'COMPLETED', completedAt: { $gte: startOfDay } }),
  ]);
  res.json({
    success: true,
    stats: {
      todaysJobs: todayAccepted, activeRequests: active, completedJobs: completed,
      todaysEarnings: today.total, rating: profile.ratingAverage, reviews: profile.ratingCount,
    },
    profile,
  });
});

export const earnings = asyncHandler(async (req, res) => {
  const partnerId = req.user._id;
  const base = { partnerId, status: 'COMPLETED' };
  const days = lastNDays(14);
  const dayStart = new Date(`${days[0]}T00:00:00.000Z`);
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const week = new Date(Date.now() - 7 * 864e5);
  const month = new Date(Date.now() - 30 * 864e5);

  const [todayT, weekT, monthT, allT, daily, history] = await Promise.all([
    sumEarnings({ ...base, completedAt: { $gte: startOfDay } }),
    sumEarnings({ ...base, completedAt: { $gte: week } }),
    sumEarnings({ ...base, completedAt: { $gte: month } }),
    sumEarnings(base),
    ServiceRequest.aggregate([
      { $match: { ...base, completedAt: { $gte: dayStart } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, amount: { $sum: { $ifNull: ['$finalCost', '$estimatedCost'] } }, jobs: { $sum: 1 } } },
    ]),
    populateRequest(ServiceRequest.find(base).sort({ completedAt: -1 }).limit(25)),
  ]);
  res.json({
    success: true,
    totals: { today: todayT.total, week: weekT.total, month: monthT.total, allTime: allT.total, jobs: allT.jobs },
    daily: fillDays(daily, days, { amount: 0, jobs: 0 }),
    history,
  });
});
