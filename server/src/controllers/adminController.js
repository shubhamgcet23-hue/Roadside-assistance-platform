import { z } from 'zod';
import { User } from '../models/User.js';
import { PartnerProfile } from '../models/PartnerProfile.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { Review } from '../models/Review.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { ACTIVE_STATUSES } from '../utils/lifecycle.js';
import { escapeRegex, pageMeta, parsePage } from '../utils/paginate.js';
import { fillDays, lastNDays } from '../utils/series.js';
import { notify } from '../services/notify.js';
import { populateRequest } from '../services/requestService.js';

const PARTNER_ROLES = ['MECHANIC', 'TOWING_PARTNER'];
const money = { $ifNull: ['$finalCost', '$estimatedCost'] };
const isStatus = (s) => ({ $cond: [{ $eq: ['$status', s] }, 1, 0] });
const toMin = (ms) => (ms == null ? 0 : Math.round((ms / 60000) * 10) / 10);
const r1 = (n) => Math.round((n ?? 0) * 10) / 10;

// ---------- dashboard ----------
export const dashboard = asyncHandler(async (_req, res) => {
  const days = lastNDays(30);
  const since = new Date(`${days[0]}T00:00:00.000Z`);

  const [totalUsers, totalPartners, verifiedPartners, pendingPartners, byStatus, revenueRow, ratingRow,
    responseRow, completionRow, daily, revenueDaily, categories, performance] = await Promise.all([
    User.countDocuments({ role: 'USER' }),
    User.countDocuments({ role: { $in: PARTNER_ROLES } }),
    PartnerProfile.countDocuments({ verificationStatus: 'VERIFIED' }),
    PartnerProfile.countDocuments({ verificationStatus: 'PENDING' }),
    ServiceRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ServiceRequest.aggregate([{ $match: { status: 'COMPLETED' } }, { $group: { _id: null, total: { $sum: money } } }]),
    Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]),
    ServiceRequest.aggregate([{ $match: { acceptedAt: { $ne: null } } }, { $group: { _id: null, avg: { $avg: { $subtract: ['$acceptedAt', '$createdAt'] } }, accepted: { $sum: 1 } } }]),
    ServiceRequest.aggregate([{ $match: { completedAt: { $ne: null }, acceptedAt: { $ne: null } } }, { $group: { _id: null, avg: { $avg: { $subtract: ['$completedAt', '$acceptedAt'] } } } }]),
    ServiceRequest.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, requests: { $sum: 1 }, completed: { $sum: isStatus('COMPLETED') }, cancelled: { $sum: isStatus('CANCELLED') } } },
    ]),
    ServiceRequest.aggregate([
      { $match: { status: 'COMPLETED', completedAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, revenue: { $sum: money } } },
    ]),
    ServiceRequest.aggregate([{ $group: { _id: '$serviceType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ServiceRequest.aggregate([
      { $match: { partnerId: { $ne: null } } },
      { $group: { _id: '$partnerId', assigned: { $sum: 1 }, completed: { $sum: isStatus('COMPLETED') } } },
      { $sort: { completed: -1, assigned: -1 } },
      { $limit: 6 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
      { $unwind: '$u' },
      { $lookup: { from: 'partnerprofiles', localField: '_id', foreignField: 'userId', as: 'p' } },
      { $unwind: { path: '$p', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: '$u.name', assigned: 1, completed: 1, rating: { $ifNull: ['$p.ratingAverage', 0] } } },
    ]),
  ]);

  const counts = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
  const totalRequests = byStatus.reduce((n, s) => n + s.count, 0);
  const activeRequests = ACTIVE_STATUSES.reduce((n, s) => n + (counts[s] || 0), 0);
  const completed = counts.COMPLETED || 0;
  const cancelled = counts.CANCELLED || 0;
  const accepted = responseRow[0]?.accepted || 0;

  const revenueByDay = new Map(revenueDaily.map((r) => [r._id, r.revenue]));
  res.json({
    success: true,
    kpis: {
      totalUsers, totalPartners, verifiedPartners, pendingPartners,
      totalRequests, activeRequests, completedRequests: completed, cancelledRequests: cancelled,
      totalRevenue: revenueRow[0]?.total ?? 0,
      averageRating: r1(ratingRow[0]?.avg), totalReviews: ratingRow[0]?.count ?? 0,
      averageResponseMinutes: toMin(responseRow[0]?.avg),
      averageCompletionMinutes: toMin(completionRow[0]?.avg),
      partnerAcceptanceRate: totalRequests ? r1((accepted / totalRequests) * 100) : 0,
    },
    charts: {
      requestsOverTime: fillDays(daily, days, { requests: 0, completed: 0, cancelled: 0 }),
      completedVsCancelled: [{ name: 'Completed', value: completed }, { name: 'Cancelled', value: cancelled }],
      categories: categories.map((c) => ({ name: c._id, value: c.count })),
      revenueTrend: days.map((date) => ({ date, revenue: revenueByDay.get(date) ?? 0 })),
      partnerPerformance: performance,
    },
  });
});

// ---------- users ----------
export const listUsers = asyncHandler(async (req, res) => {
  const paging = parsePage(req.query);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.active === 'true' || req.query.active === 'false') filter.isActive = req.query.active === 'true';
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, users, ...pageMeta(total, paging) });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  const field = user.role === 'USER' ? 'userId' : 'partnerId';
  const [history, profile] = await Promise.all([
    populateRequest(ServiceRequest.find({ [field]: user._id }).sort({ createdAt: -1 }).limit(20)),
    PARTNER_ROLES.includes(user.role) ? PartnerProfile.findOne({ userId: user._id }) : null,
  ]);
  res.json({ success: true, user, history, profile });
});

export const setUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'ADMIN') throw new ApiError(403, 'Admin accounts cannot be deactivated here');
  user.isActive = isActive;
  await user.save();
  res.json({ success: true, user });
});

// ---------- partners ----------
const flatten = (p) => ({
  ...p.toObject(),
  user: p.userId,
  userId: p.userId?._id,
});

export const listPartners = asyncHandler(async (req, res) => {
  const paging = parsePage(req.query);
  const roleFilter = PARTNER_ROLES.includes(req.query.role) ? [req.query.role] : PARTNER_ROLES;
  const userFilter = { role: { $in: roleFilter } };
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    userFilter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const ids = (await User.find(userFilter).select('_id')).map((u) => u._id);
  const filter = { userId: { $in: ids } };
  if (req.query.status) filter.verificationStatus = req.query.status;
  const [profiles, total] = await Promise.all([
    PartnerProfile.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit).populate('userId', 'name email phone role isActive createdAt'),
    PartnerProfile.countDocuments(filter),
  ]);
  res.json({ success: true, partners: profiles.map(flatten), ...pageMeta(total, paging) });
});

export const getPartner = asyncHandler(async (req, res) => {
  const profile = await PartnerProfile.findOne({ userId: req.params.id }).populate('userId', 'name email phone role isActive createdAt');
  if (!profile) throw new ApiError(404, 'Partner not found');
  const history = await populateRequest(ServiceRequest.find({ partnerId: req.params.id }).sort({ createdAt: -1 }).limit(20));
  res.json({ success: true, partner: flatten(profile), history });
});

async function changeVerification(req, res, { from, to, title, message, offline = false, reason }) {
  const profile = await PartnerProfile.findOne({ userId: req.params.id });
  if (!profile) throw new ApiError(404, 'Partner not found');
  if (from && !from.includes(profile.verificationStatus)) {
    throw new ApiError(400, `Cannot change a ${profile.verificationStatus} partner to ${to}`);
  }
  profile.verificationStatus = to;
  if (to === 'VERIFIED') { profile.verifiedAt = new Date(); profile.rejectionReason = undefined; }
  if (to === 'REJECTED') profile.rejectionReason = reason;
  if (offline) profile.availability = 'OFFLINE';
  await profile.save();
  await notify(profile.userId, 'VERIFICATION', title, message, { status: to });
  res.json({ success: true, profile });
}

export const verifyPartner = asyncHandler((req, res) => changeVerification(req, res, {
  from: ['PENDING', 'REJECTED'], to: 'VERIFIED', title: 'Profile verified', message: 'You can now go online and receive requests.',
}));
export const rejectPartner = asyncHandler((req, res) => {
  const { reason } = z.object({ reason: z.string().max(300).optional() }).parse(req.body ?? {});
  return changeVerification(req, res, {
    from: ['PENDING', 'VERIFIED'], to: 'REJECTED', title: 'Verification rejected', message: reason || 'Your application was not approved. Update your details and contact support.', offline: true, reason,
  });
});
export const suspendPartner = asyncHandler((req, res) => changeVerification(req, res, {
  from: ['VERIFIED'], to: 'SUSPENDED', title: 'Account suspended', message: 'Your partner account has been suspended. Contact support.', offline: true,
}));
export const reactivatePartner = asyncHandler((req, res) => changeVerification(req, res, {
  from: ['SUSPENDED'], to: 'VERIFIED', title: 'Account reactivated', message: 'Your partner account is active again.',
}));

// ---------- requests ----------
export const listRequests = asyncHandler(async (req, res) => {
  const paging = parsePage(req.query);
  const filter = {};
  const statuses = String(req.query.status || '').split(',').filter(Boolean);
  if (statuses.length) filter.status = { $in: statuses };
  if (req.query.active === 'true') filter.status = { $in: ACTIVE_STATUSES };
  const [requests, total] = await Promise.all([
    populateRequest(ServiceRequest.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit)),
    ServiceRequest.countDocuments(filter),
  ]);
  res.json({ success: true, requests, ...pageMeta(total, paging) });
});

// ---------- reports ----------
const periodSeries = (match, format) => ServiceRequest.aggregate([
  { $match: match },
  { $group: { _id: { $dateToString: { format, date: '$createdAt' } }, requests: { $sum: 1 }, completed: { $sum: isStatus('COMPLETED') }, cancelled: { $sum: isStatus('CANCELLED') }, revenue: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, money, 0] } } } },
  { $sort: { _id: 1 } },
  { $project: { _id: 0, period: '$_id', requests: 1, completed: 1, cancelled: 1, revenue: 1 } },
]);

export const reports = asyncHandler(async (req, res) => {
  const to = req.query.to ? new Date(`${req.query.to}T23:59:59.999Z`) : new Date();
  const from = req.query.from ? new Date(`${req.query.from}T00:00:00.000Z`) : new Date(to.getTime() - 29 * 864e5);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) throw new ApiError(400, 'Invalid date range');
  const match = { createdAt: { $gte: from, $lte: to } };

  const [daily, weekly, monthly, mostRequested, completion, ratingRow, totalsRow] = await Promise.all([
    periodSeries(match, '%Y-%m-%d'),
    periodSeries(match, '%G-W%V'),
    periodSeries(match, '%Y-%m'),
    ServiceRequest.aggregate([{ $match: match }, { $group: { _id: '$serviceType', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $project: { _id: 0, service: '$_id', count: 1 } }]),
    ServiceRequest.aggregate([
      { $match: { ...match, partnerId: { $ne: null } } },
      { $group: { _id: '$partnerId', assigned: { $sum: 1 }, completed: { $sum: isStatus('COMPLETED') } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
      { $unwind: '$u' },
      { $project: { _id: 0, partner: '$u.name', assigned: 1, completed: 1, completionRate: { $round: [{ $multiply: [{ $divide: ['$completed', '$assigned'] }, 100] }, 1] } } },
      { $sort: { completed: -1 } },
      { $limit: 20 },
    ]),
    Review.aggregate([{ $match: { createdAt: { $gte: from, $lte: to } } }, { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]),
    ServiceRequest.aggregate([{ $match: match }, { $group: {
      _id: null, total: { $sum: 1 }, completed: { $sum: isStatus('COMPLETED') }, cancelled: { $sum: isStatus('CANCELLED') },
      revenue: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, money, 0] } },
      pipeline: { $sum: { $cond: [{ $in: ['$status', ACTIVE_STATUSES] }, '$estimatedCost', 0] } },
    } }]),
  ]);

  const t = totalsRow[0] || { total: 0, completed: 0, cancelled: 0, revenue: 0, pipeline: 0 };
  res.json({
    success: true,
    range: { from, to },
    summary: {
      totalRequests: t.total, completed: t.completed, cancelled: t.cancelled,
      cancellationRate: t.total ? r1((t.cancelled / t.total) * 100) : 0,
      revenueEstimate: t.revenue, pipelineEstimate: t.pipeline,
      averageRating: r1(ratingRow[0]?.avg), reviews: ratingRow[0]?.count ?? 0,
    },
    daily, weekly, monthly, mostRequested, partnerCompletion: completion,
  });
});
