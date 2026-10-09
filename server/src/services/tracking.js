import { ServiceRequest } from '../models/ServiceRequest.js';
import { PartnerProfile } from '../models/PartnerProfile.js';
import { ApiError } from '../utils/ApiError.js';
import { calculateDistance, calculateETA, round1 } from '../utils/location.js';
import { emitTo } from '../sockets/io.js';
import { advanceRequest } from './requestService.js';
import { env } from '../config/env.js';

/** Emit a mechanic position (with distance and ETA to the customer) to everyone watching the request. */
export function broadcastLocation(request, latitude, longitude, { demo = false } = {}) {
  const distanceKm = calculateDistance(latitude, longitude, request.breakdownLocation.latitude, request.breakdownLocation.longitude);
  const payload = {
    requestId: request._id,
    mechanicId: request.partnerId,
    latitude,
    longitude,
    distanceKm: round1(distanceKm),
    etaMinutes: calculateETA(distanceKm),
    demo,
    at: new Date().toISOString(),
  };
  emitTo(`request:${request._id}`, 'location-updated', payload);
  return payload;
}

// ---- Demo Tracking Mode: a clearly labelled simulation, never used as production GPS ----
const STEPS = 20;
const TICK_MS = 1500;
const runs = new Map();

export const isDemoRunning = (requestId) => runs.has(String(requestId));

export function stopDemo(requestId) {
  const run = runs.get(String(requestId));
  if (!run) return;
  clearInterval(run.timer);
  run.timeouts.forEach(clearTimeout);
  runs.delete(String(requestId));
  emitTo(`request:${requestId}`, 'demo-tracking-stopped', { requestId });
}

export async function startDemo(requestId, user, { autoComplete = false } = {}) {
  if (!env.demoTrackingEnabled) throw new ApiError(403, 'Demo Tracking Mode is disabled on this server');
  const id = String(requestId);
  const request = await ServiceRequest.findById(id);
  if (!request) throw new ApiError(404, 'Request not found');
  const isParty = user.role === 'ADMIN' || String(request.userId) === String(user._id) || String(request.partnerId) === String(user._id);
  if (!isParty) throw new ApiError(403, 'Forbidden');
  if (!['ACCEPTED', 'ON_THE_WAY'].includes(request.status)) {
    throw new ApiError(409, 'Demo tracking can start once a partner has accepted the request');
  }
  if (runs.has(id)) return;

  const dest = request.breakdownLocation;
  const profile = await PartnerProfile.findOne({ userId: request.partnerId });
  let [startLng, startLat] = profile?.location?.coordinates ?? [0, 0];
  const unplaced = startLat === 0 && startLng === 0;
  if (unplaced || calculateDistance(startLat, startLng, dest.latitude, dest.longitude) < 0.8) {
    startLat = dest.latitude + 0.018; // roughly 2.8 km away so the movement is visible
    startLng = dest.longitude - 0.018;
  }

  const run = { timer: null, timeouts: [] };
  runs.set(id, run);
  if (request.status === 'ACCEPTED') {
    try { await advanceRequest(id, request.partnerId, 'ON_THE_WAY'); } catch (e) { runs.delete(id); throw e; }
  }
  broadcastLocation(request, startLat, startLng, { demo: true });
  emitTo(`request:${id}`, 'demo-tracking-started', { requestId: id, autoComplete });

  let step = 0;
  let busy = false;
  run.timer = setInterval(async () => {
    if (busy) return;
    busy = true;
    try {
      const fresh = await ServiceRequest.findById(id).select('status partnerId breakdownLocation');
      if (!fresh || !['ON_THE_WAY'].includes(fresh.status)) { stopDemo(id); return; }
      step += 1;
      const t = step / STEPS;
      broadcastLocation(fresh, startLat + (dest.latitude - startLat) * t, startLng + (dest.longitude - startLng) * t, { demo: true });
      if (step >= STEPS) {
        clearInterval(run.timer);
        await advanceRequest(id, fresh.partnerId, 'ARRIVED');
        if (autoComplete) {
          run.timeouts.push(setTimeout(() => advanceRequest(id, fresh.partnerId, 'IN_PROGRESS').catch(() => {}), 4000));
          run.timeouts.push(setTimeout(async () => {
            await advanceRequest(id, fresh.partnerId, 'COMPLETED').catch(() => {});
            runs.delete(id);
          }, 9000));
        } else {
          runs.delete(id);
        }
      }
    } catch {
      stopDemo(id);
    } finally {
      busy = false;
    }
  }, TICK_MS);
}
