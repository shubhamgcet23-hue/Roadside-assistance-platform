import { ServiceRequest } from '../models/ServiceRequest.js';
import { Vehicle } from '../models/Vehicle.js';
import { Service } from '../models/Service.js';
import { PartnerProfile } from '../models/PartnerProfile.js';
import { ApiError } from '../utils/ApiError.js';
import { ACTIVE_STATUSES, JOB_STATUSES, canTransition } from '../utils/lifecycle.js';
import { calculateDistance, calculateETA, round1 } from '../utils/location.js';
import { parsePage, pageMeta } from '../utils/paginate.js';
import { estimatePrice, partnerBasePrice } from './pricing.js';
import { findNearbyPartners } from './partnerService.js';
import { getPaymentProvider } from './payment.js';
import { notify } from './notify.js';
import { emitTo } from '../sockets/io.js';
import { env } from '../config/env.js';

const idOf = (x) => String(x?._id ?? x ?? '');

const STATUS_EVENTS = {
  ACCEPTED: { event: 'request-accepted', type: 'REQUEST_ACCEPTED', title: 'Mechanic assigned', message: 'A partner accepted your request.' },
  ON_THE_WAY: { event: 'mechanic-on-the-way', type: 'ON_THE_WAY', title: 'Mechanic on the way', message: 'Your partner is heading to your location.' },
  ARRIVED: { event: 'mechanic-arrived', type: 'ARRIVED', title: 'Mechanic arrived', message: 'Your partner has reached you.' },
  IN_PROGRESS: { event: 'service-started', type: 'SERVICE_STARTED', title: 'Service started', message: 'Work on your vehicle has begun.' },
  COMPLETED: { event: 'service-completed', type: 'SERVICE_COMPLETED', title: 'Service completed', message: 'Your service is complete. Please rate your partner.' },
};

export const populateRequest = (query) => query
  .populate('vehicleId', 'type make model registrationNumber color fuelType year')
  .populate('serviceId', 'name code')
  .populate('userId', 'name phone')
  .populate('partnerId', 'name phone avatar role');

/** Plain object + partner live info + offer expiry, for API responses. */
export async function enrichRequest(doc) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (obj.partnerId?._id) {
    const prof = await PartnerProfile.findOne({ userId: obj.partnerId._id }).select('location ratingAverage ratingCount jobsCompleted');
    if (prof) {
      obj.partnerProfile = {
        location: { latitude: prof.location.coordinates[1], longitude: prof.location.coordinates[0] },
        ratingAverage: prof.ratingAverage, ratingCount: prof.ratingCount, jobsCompleted: prof.jobsCompleted,
      };
    }
  }
  obj.offerExpiresAt = new Date(new Date(obj.createdAt).getTime() + env.offerTimeoutSeconds * 1000);
  return obj;
}

export function canView(user, request) {
  if (user.role === 'ADMIN') return true;
  if (idOf(request.userId) === idOf(user._id)) return true;
  if (idOf(request.partnerId) === idOf(user._id)) return true;
  return user.role !== 'USER' && request.status === 'SEARCHING';
}

/** Lazily cancel SEARCHING requests nobody accepted within the offer window. */
export async function expireStale(extraFilter = {}) {
  const cutoff = new Date(Date.now() - env.offerTimeoutSeconds * 1000);
  const stale = await ServiceRequest.find({ status: 'SEARCHING', createdAt: { $lt: cutoff }, ...extraFilter }).select('_id');
  for (const { _id } of stale) {
    const r = await ServiceRequest.findOneAndUpdate(
      { _id, status: 'SEARCHING' },
      { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: 'No partner accepted in time' },
      { new: true },
    );
    if (!r) continue;
    await notify(r.userId, 'REQUEST_CANCELLED', 'Request expired', 'No partner accepted in time. Please try again.', { requestId: r._id });
    emitTo([`user:${r.userId}`, `request:${r._id}`], 'request-cancelled', { requestId: r._id, status: r.status });
  }
}

async function offerToPartners(request, service, targets) {
  if (!targets.length) return;
  await ServiceRequest.updateOne({ _id: request._id }, { $addToSet: { notifiedPartners: { $each: targets.map((t) => t.partnerId) } } });
  await Promise.all(targets.map((t) => notify(
    t.partnerId, 'NEW_REQUEST', 'New roadside assistance request', `${service.name}, ${t.distanceKm} km away`, { requestId: request._id },
  )));
  const offerExpiresAt = new Date(new Date(request.createdAt).getTime() + env.offerTimeoutSeconds * 1000);
  targets.forEach((t) => emitTo(`user:${t.partnerId}`, 'service-request-created', {
    requestId: request._id, serviceType: request.serviceType, serviceName: service.name, distanceKm: t.distanceKm,
    estimatedEarnings: t.pricing.total, location: request.breakdownLocation, emergencyLevel: request.emergencyLevel, offerExpiresAt,
  }));
}

export async function createRequest(user, data) {
  await expireStale({ userId: user._id });
  const [vehicle, service] = await Promise.all([
    Vehicle.findOne({ _id: data.vehicleId, userId: user._id }),
    Service.findOne({ code: data.serviceType, isActive: true }),
  ]);
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  if (!service) throw new ApiError(404, 'Service not available');
  if (await ServiceRequest.exists({ userId: user._id, status: { $in: ACTIVE_STATUSES } })) {
    throw new ApiError(409, 'You already have an active request');
  }

  const { latitude, longitude } = data.location;
  const partners = await findNearbyPartners({ latitude, longitude, service });
  let chosen = partners.find((p) => p.availability === 'AVAILABLE');
  let targets = partners.filter((p) => p.availability === 'AVAILABLE');

  if (data.preferredPartnerId) {
    const preferred = partners.find((p) => idOf(p.partnerId) === data.preferredPartnerId);
    if (!preferred) throw new ApiError(404, 'That partner is not available near you');
    if (preferred.availability !== 'AVAILABLE') throw new ApiError(409, 'Partner is currently unavailable.');
    chosen = preferred;
    targets = [preferred];
  }
  if (!chosen) throw new ApiError(404, 'No mechanics available nearby.');

  const request = await ServiceRequest.create({
    userId: user._id, vehicleId: vehicle._id, serviceId: service._id, serviceType: service.code,
    description: data.description, issue: data.issue, emergencyLevel: data.emergencyLevel,
    breakdownLocation: data.location, pricing: chosen.pricing, estimatedCost: chosen.pricing.total,
    estimatedArrivalTime: new Date(Date.now() + chosen.etaMinutes * 60000),
    preferredPartnerId: data.preferredPartnerId || undefined,
    paymentStatus: (await getPaymentProvider().createPayment()).status,
    status: 'SEARCHING',
  });

  await offerToPartners(request, service, targets);
  await notify(user._id, 'REQUEST_CREATED', 'Request submitted', 'We are finding a partner near you.', { requestId: request._id });
  emitTo(`user:${user._id}`, 'request-created', { requestId: request._id, status: request.status });
  return { request, notified: targets.length };
}

export async function acceptRequest(requestId, partnerUser) {
  const profile = await PartnerProfile.findOne({ userId: partnerUser._id });
  if (!profile || profile.verificationStatus !== 'VERIFIED') throw new ApiError(403, 'Only verified partners can accept requests');
  if (profile.availability !== 'AVAILABLE') throw new ApiError(409, 'Partner is currently unavailable.');

  const candidate = await ServiceRequest.findById(requestId);
  if (!candidate) throw new ApiError(404, 'Request not found');
  if (!profile.services.includes(candidate.serviceType)) throw new ApiError(403, 'You do not offer this service');
  if (candidate.preferredPartnerId && idOf(candidate.preferredPartnerId) !== idOf(partnerUser._id)) {
    throw new ApiError(403, 'This request was sent to a different partner');
  }
  if (candidate.status === 'SEARCHING' && Date.now() - candidate.createdAt.getTime() > env.offerTimeoutSeconds * 1000) {
    throw new ApiError(409, 'This request has expired');
  }

  const service = await Service.findById(candidate.serviceId);
  const [lng, lat] = profile.location.coordinates;
  const distanceKm = calculateDistance(lat, lng, candidate.breakdownLocation.latitude, candidate.breakdownLocation.longitude);
  const pricing = estimatePrice(service, distanceKm, partnerBasePrice(profile, candidate.serviceType));

  // Atomic: only one partner can win a SEARCHING request.
  const request = await ServiceRequest.findOneAndUpdate(
    { _id: candidate._id, status: 'SEARCHING' },
    { status: 'ACCEPTED', partnerId: partnerUser._id, acceptedAt: new Date(), pricing, estimatedCost: pricing.total,
      estimatedArrivalTime: new Date(Date.now() + calculateETA(distanceKm) * 60000) },
    { new: true },
  );
  if (!request) throw new ApiError(409, 'Request is no longer available');

  profile.availability = 'BUSY';
  await profile.save();

  const meta = STATUS_EVENTS.ACCEPTED;
  await notify(request.userId, meta.type, meta.title, `${partnerUser.name} accepted your request.`, { requestId: request._id });
  emitTo([`user:${request.userId}`, `request:${request._id}`], meta.event, { requestId: request._id, status: request.status });
  const others = request.notifiedPartners.filter((id) => idOf(id) !== idOf(partnerUser._id)).map((id) => `user:${id}`);
  if (others.length) emitTo(others, 'request-taken', { requestId: request._id });
  return request;
}

export async function rejectRequest(requestId, partnerUser) {
  const request = await ServiceRequest.findOneAndUpdate(
    { _id: requestId, status: 'SEARCHING' },
    { $addToSet: { rejectedBy: partnerUser._id } },
    { new: true },
  );
  if (!request) throw new ApiError(409, 'Request is no longer available');
  emitTo([`user:${request.userId}`, `request:${request._id}`], 'request-rejected', { requestId: request._id, partnerId: partnerUser._id });

  // A direct request that was declined falls back to every other available partner nearby.
  if (idOf(request.preferredPartnerId) === idOf(partnerUser._id)) {
    request.preferredPartnerId = undefined;
    await request.save();
    const service = await Service.findById(request.serviceId);
    const partners = await findNearbyPartners({ latitude: request.breakdownLocation.latitude, longitude: request.breakdownLocation.longitude, service });
    const targets = partners.filter((p) => p.availability === 'AVAILABLE' && !request.rejectedBy.some((id) => idOf(id) === idOf(p.partnerId)));
    await offerToPartners(request, service, targets);
    await notify(request.userId, 'REQUEST_CREATED', 'Partner declined',
      targets.length ? 'We are asking other nearby partners.' : 'No other partners are available right now.', { requestId: request._id });
  }
  return request;
}

/** Move an assigned request forward. Only the assigned partner may call it. */
export async function advanceRequest(requestId, partnerId, status, { finalCost } = {}) {
  const request = await ServiceRequest.findOne({ _id: requestId, partnerId });
  if (!request) throw new ApiError(404, 'Request not found');
  if (!canTransition(request.status, status)) throw new ApiError(400, `Cannot change status from ${request.status} to ${status}`);

  request.status = status;
  if (status === 'ARRIVED') request.actualArrivalTime = new Date();
  if (status === 'IN_PROGRESS') request.startedAt = new Date();
  if (status === 'COMPLETED') {
    request.completedAt = new Date();
    request.finalCost = finalCost ?? request.pricing?.total ?? request.estimatedCost;
    await PartnerProfile.updateOne({ userId: partnerId }, { $inc: { jobsCompleted: 1 }, $set: { availability: 'AVAILABLE' } });
  }
  await request.save();

  const meta = STATUS_EVENTS[status];
  await notify(request.userId, meta.type, meta.title, meta.message, { requestId: request._id });
  emitTo([`user:${request.userId}`, `request:${request._id}`], meta.event, { requestId: request._id, status: request.status });
  return request;
}

export async function cancelRequest(requestId, actor, reason) {
  const filter = actor.role === 'ADMIN' ? { _id: requestId } : { _id: requestId, userId: actor._id };
  const request = await ServiceRequest.findOne(filter);
  if (!request) throw new ApiError(404, 'Request not found');
  if (!canTransition(request.status, 'CANCELLED')) throw new ApiError(400, `A ${request.status} request cannot be cancelled`);

  request.status = 'CANCELLED';
  request.cancelledAt = new Date();
  request.cancellationReason = reason;
  await request.save();

  const rooms = [`user:${request.userId}`, `request:${request._id}`];
  if (request.partnerId) {
    await PartnerProfile.updateOne({ userId: request.partnerId }, { availability: 'AVAILABLE' });
    await notify(request.partnerId, 'REQUEST_CANCELLED', 'Request cancelled', 'The customer cancelled this request.', { requestId: request._id });
    rooms.push(`user:${request.partnerId}`);
  }
  await notify(request.userId, 'REQUEST_CANCELLED', 'Request cancelled', 'Your request was cancelled.', { requestId: request._id });
  emitTo(rooms, 'request-cancelled', { requestId: request._id, status: request.status });
  const others = request.notifiedPartners.filter((id) => idOf(id) !== idOf(request.partnerId)).map((id) => `user:${id}`);
  if (others.length) emitTo(others, 'request-taken', { requestId: request._id });
  return request;
}

/** Open (SEARCHING) requests a partner can act on, with distance and expected earnings. */
export async function listOpenForPartner(user) {
  await expireStale();
  const profile = await PartnerProfile.findOne({ userId: user._id });
  if (!profile || profile.verificationStatus !== 'VERIFIED' || profile.availability === 'OFFLINE') return [];
  const open = await populateRequest(ServiceRequest.find({
    status: 'SEARCHING',
    serviceType: { $in: profile.services },
    rejectedBy: { $ne: user._id },
    $or: [{ preferredPartnerId: null }, { preferredPartnerId: user._id }],
  }).sort({ createdAt: -1 }).limit(50));

  const [lng, lat] = profile.location.coordinates;
  const results = [];
  for (const r of open) {
    const distanceKm = calculateDistance(lat, lng, r.breakdownLocation.latitude, r.breakdownLocation.longitude);
    if (distanceKm > profile.serviceRadiusKm) continue;
    const service = await Service.findById(r.serviceId._id);
    const pricing = estimatePrice(service, distanceKm, partnerBasePrice(profile, r.serviceType));
    const obj = await enrichRequest(r);
    results.push({ ...obj, distanceKm: round1(distanceKm), etaMinutes: calculateETA(distanceKm), estimatedEarnings: pricing.total });
  }
  return results;
}

export async function getActiveRequest(user) {
  if (user.role === 'USER') await expireStale({ userId: user._id });
  const filter = user.role === 'USER'
    ? { userId: user._id, status: { $in: ACTIVE_STATUSES } }
    : { partnerId: user._id, status: { $in: JOB_STATUSES } };
  const doc = await populateRequest(ServiceRequest.findOne(filter).sort({ createdAt: -1 }));
  return doc ? enrichRequest(doc) : null;
}

export async function listRequests(user, query) {
  const paging = parsePage(query);
  const filter = {};
  if (user.role === 'USER') filter.userId = user._id;
  else if (user.role !== 'ADMIN') filter.partnerId = user._id;
  const statuses = String(query.status || '').split(',').filter(Boolean);
  if (statuses.length) filter.status = { $in: statuses };
  const [requests, total] = await Promise.all([
    populateRequest(ServiceRequest.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit)),
    ServiceRequest.countDocuments(filter),
  ]);
  return { requests, ...pageMeta(total, paging) };
}
