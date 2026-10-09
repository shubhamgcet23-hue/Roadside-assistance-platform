import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { io as connect } from 'socket.io-client';
import {
  startDb, stopDb, clearDb, register, auth, request, createVehicle, createVerifiedPartner, seedServices, CUSTOMER,
} from './helpers.js';
import { initSockets } from '../../src/sockets/index.js';

let app; let server; let port; const sockets = [];
before(async () => {
  app = await startDb();
  server = http.createServer(app);
  initSockets(server);
  await new Promise((r) => server.listen(0, r));
  port = server.address().port;
});
after(async () => { sockets.forEach((s) => s.close()); server.close(); await stopDb(); });
beforeEach(async () => { await clearDb(); await seedServices(); });

const open = (token) => new Promise((resolve, reject) => {
  const s = connect(`http://localhost:${port}`, { auth: { token }, transports: ['websocket'] });
  sockets.push(s);
  s.on('connect', () => resolve(s));
  s.on('connect_error', reject);
});
const once = (socket, event) => new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error(`timed out waiting for ${event}`)), 4000);
  socket.once(event, (p) => { clearTimeout(t); resolve(p); });
});

test('sockets reject missing or invalid tokens', async () => {
  await assert.rejects(open('nope'));
});

test('partner is notified of a new request and the customer sees acceptance and status changes live', async () => {
  const user = await register(app);
  const vehicle = await createVehicle(app, user.token);
  const partner = await createVerifiedPartner(app);
  const userSock = await open(user.token);
  const partnerSock = await open(partner.token);

  const offered = once(partnerSock, 'service-request-created');
  const res = await request(app).post('/api/requests').set(auth(user.token)).send({ vehicleId: vehicle._id, serviceType: 'BREAKDOWN_REPAIR', location: CUSTOMER });
  const id = res.body.request._id;
  const offer = await offered;
  assert.equal(offer.requestId, id);
  assert.ok(offer.estimatedEarnings > 0);

  const joined = await new Promise((r) => userSock.emit('join-request', id, r));
  assert.equal(joined.ok, true);

  const accepted = once(userSock, 'request-accepted');
  await request(app).patch(`/api/requests/${id}/status`).set(auth(partner.token)).send({ status: 'ACCEPTED' });
  assert.equal((await accepted).status, 'ACCEPTED');

  const onTheWay = once(userSock, 'mechanic-on-the-way');
  await request(app).patch(`/api/requests/${id}/status`).set(auth(partner.token)).send({ status: 'ON_THE_WAY' });
  assert.equal((await onTheWay).status, 'ON_THE_WAY');

  const moved = once(userSock, 'location-updated');
  await new Promise((r) => partnerSock.emit('location-update', { requestId: id, latitude: 28.476, longitude: 77.506 }, r));
  const loc = await moved;
  assert.equal(loc.latitude, 28.476);
  assert.ok(loc.distanceKm >= 0 && loc.etaMinutes >= 1);
});

test('strangers cannot join someone else\'s request room', async () => {
  const user = await register(app);
  const vehicle = await createVehicle(app, user.token);
  await createVerifiedPartner(app);
  const id = (await request(app).post('/api/requests').set(auth(user.token)).send({ vehicleId: vehicle._id, serviceType: 'FLAT_TIRE', location: CUSTOMER })).body.request._id;
  const stranger = await register(app);
  const s = await open(stranger.token);
  const joined = await new Promise((r) => s.emit('join-request', id, r));
  assert.equal(joined.ok, false);
});
