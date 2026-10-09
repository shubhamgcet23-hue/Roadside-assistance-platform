import { Server } from 'socket.io';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { PartnerProfile } from '../models/PartnerProfile.js';
import { userFromToken } from '../middleware/auth.js';
import { corsOrigin } from '../config/env.js';
import { setIO } from './io.js';
import { canView } from '../services/requestService.js';
import { broadcastLocation, isDemoRunning, startDemo, stopDemo } from '../services/tracking.js';
import { JOB_STATUSES } from '../utils/lifecycle.js';

const reply = (ack, payload) => { if (typeof ack === 'function') ack(payload); };
const errMsg = (e) => e?.message || 'Something went wrong';
const validCoord = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

/**
 * Socket.IO layer. Clients authenticate with their JWT (handshake auth.token).
 * Rooms: `user:<id>` (personal notifications) and `request:<id>` (live status + location of one request).
 */
export function initSockets(httpServer) {
  const io = new Server(httpServer, { cors: { origin: corsOrigin, credentials: true } });
  setIO(io);

  io.use(async (socket, next) => {
    try {
      socket.data.user = await userFromToken(socket.handshake.auth?.token);
      next();
    } catch (e) {
      next(new Error(errMsg(e)));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket.data;
    socket.join(`user:${user._id}`);

    socket.on('join-request', async (requestId, ack) => {
      try {
        const request = await ServiceRequest.findById(requestId).select('userId partnerId status');
        if (!request || !canView(user, request)) return reply(ack, { ok: false, message: 'Request not found' });
        socket.join(`request:${requestId}`);
        reply(ack, { ok: true, demoRunning: isDemoRunning(requestId) });
      } catch (e) { reply(ack, { ok: false, message: errMsg(e) }); }
    });

    socket.on('leave-request', (requestId) => socket.leave(`request:${requestId}`));

    // Production GPS: the assigned partner's device streams its position.
    socket.on('location-update', async ({ requestId, latitude, longitude } = {}, ack) => {
      try {
        if (!validCoord(latitude, longitude)) return reply(ack, { ok: false, message: 'Invalid coordinates' });
        const request = await ServiceRequest.findOne({ _id: requestId, partnerId: user._id, status: { $in: JOB_STATUSES } });
        if (!request) return reply(ack, { ok: false, message: 'No active job for this request' });
        await PartnerProfile.updateOne({ userId: user._id }, { location: { type: 'Point', coordinates: [longitude, latitude] } });
        broadcastLocation(request, latitude, longitude);
        reply(ack, { ok: true });
      } catch (e) { reply(ack, { ok: false, message: errMsg(e) }); }
    });

    socket.on('demo-tracking-start', async ({ requestId, autoComplete } = {}, ack) => {
      try {
        await startDemo(requestId, user, { autoComplete: Boolean(autoComplete) });
        reply(ack, { ok: true });
      } catch (e) { reply(ack, { ok: false, message: errMsg(e) }); }
    });

    socket.on('demo-tracking-stop', async ({ requestId } = {}, ack) => {
      try {
        const request = await ServiceRequest.findById(requestId).select('userId partnerId');
        if (request && canView(user, request)) stopDemo(requestId);
        reply(ack, { ok: true });
      } catch (e) { reply(ack, { ok: false, message: errMsg(e) }); }
    });
  });
  return io;
}
