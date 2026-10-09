import { z } from 'zod';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { SERVICE_TYPES } from '../models/Service.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import * as svc from '../services/requestService.js';
import { buildInvoice, streamInvoicePdf } from '../services/invoice.js';

const createSchema = z.object({
  vehicleId: z.string().min(1),
  serviceType: z.enum(SERVICE_TYPES),
  description: z.string().max(1000).optional(),
  issue: z.string().max(200).optional(),
  emergencyLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  preferredPartnerId: z.string().optional(),
  location: z.object({
    address: z.string().max(300).optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
});
const statusSchema = z.object({
  status: z.enum(['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'ACCEPTED']),
  finalCost: z.number().min(0).optional(),
});

export const create = asyncHandler(async (req, res) => {
  const { request, notified } = await svc.createRequest(req.user, createSchema.parse(req.body));
  res.status(201).json({ success: true, request, notified });
});

export const list = asyncHandler(async (req, res) => {
  if (req.query.scope === 'open' && req.user.role !== 'USER' && req.user.role !== 'ADMIN') {
    const requests = await svc.listOpenForPartner(req.user);
    return res.json({ success: true, requests, total: requests.length });
  }
  res.json({ success: true, ...(await svc.listRequests(req.user, req.query)) });
});

export const active = asyncHandler(async (req, res) => {
  res.json({ success: true, request: await svc.getActiveRequest(req.user) });
});

async function loadForView(req) {
  const doc = await svc.populateRequest(ServiceRequest.findById(req.params.id));
  if (!doc) throw new ApiError(404, 'Request not found');
  if (!svc.canView(req.user, doc)) throw new ApiError(403, 'Forbidden');
  return doc;
}

export const getOne = asyncHandler(async (req, res) => {
  res.json({ success: true, request: await svc.enrichRequest(await loadForView(req)) });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status, finalCost } = statusSchema.parse(req.body);
  const request = status === 'ACCEPTED'
    ? await svc.acceptRequest(req.params.id, req.user)
    : await svc.advanceRequest(req.params.id, req.user._id, status, { finalCost });
  res.json({ success: true, request });
});

export const accept = asyncHandler(async (req, res) => {
  res.json({ success: true, request: await svc.acceptRequest(req.params.id, req.user) });
});

export const reject = asyncHandler(async (req, res) => {
  await svc.rejectRequest(req.params.id, req.user);
  res.json({ success: true });
});

export const cancel = asyncHandler(async (req, res) => {
  const { reason } = z.object({ reason: z.string().max(300).optional() }).parse(req.body ?? {});
  res.json({ success: true, request: await svc.cancelRequest(req.params.id, req.user, reason) });
});

export const invoice = asyncHandler(async (req, res) => {
  res.json({ success: true, invoice: buildInvoice(await loadForView(req)) });
});

export const invoicePdf = asyncHandler(async (req, res) => {
  streamInvoicePdf(buildInvoice(await loadForView(req)), res);
});
