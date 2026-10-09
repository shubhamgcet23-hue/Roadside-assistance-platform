import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  startDb, stopDb, clearDb, register, auth, request, createVehicle, createVerifiedPartner, seedServices, CUSTOMER,
} from './helpers.js';
import { calculateDistance } from '../../src/utils/location.js';
import { estimatePrice } from '../../src/services/pricing.js';
import { PartnerProfile } from '../../src/models/PartnerProfile.js';

let app;
before(async () => { app = await startDb(); });
after(stopDb);
beforeEach(async () => { await clearDb(); await seedServices(); });

async function setup() {
  const user = await register(app);
  const vehicle = await createVehicle(app, user.token);
  const partner = await createVerifiedPartner(app);
  return { user, vehicle, partner };
}
const body = (vehicle, extra = {}) => ({ vehicleId: vehicle._id, serviceType: 'BREAKDOWN_REPAIR', emergencyLevel: 'HIGH', location: CUSTOMER, ...extra });
const create = (user, vehicle, extra) => request(app).post('/api/requests').set(auth(user.token)).send(body(vehicle, extra));
const setStatus = (partner, id, status) => request(app).patch(`/api/requests/${id}/status`).set(auth(partner.token)).send({ status });

test('creating a request stores it as SEARCHING with the formula price', async () => {
  const { user, vehicle } = await setup();
  const res = await create(user, vehicle);
  assert.equal(res.status, 201);
  assert.equal(res.body.request.status, 'SEARCHING');
  assert.equal(res.body.notified, 1);
  const dist = calculateDistance(CUSTOMER.latitude, CUSTOMER.longitude, 28.48, 77.51);
  assert.equal(res.body.request.estimatedCost, estimatePrice({ basePrice: 299, pricePerKm: 10 }, dist).total);
});

test('no partners nearby gives a clear 404 message', async () => {
  const user = await register(app);
  const vehicle = await createVehicle(app, user.token);
  const res = await create(user, vehicle);
  assert.equal(res.status, 404);
  assert.match(res.body.message, /No mechanics available nearby/);
});

test('only verified, available partners are discovered', async () => {
  const { user } = await setup();
  const pending = await register(app, 'MECHANIC');
  await PartnerProfile.updateOne({ userId: pending.user._id }, { availability: 'AVAILABLE', services: ['BREAKDOWN_REPAIR'], location: { type: 'Point', coordinates: [77.505, 28.475] } });
  const res = await request(app).get('/api/partners/nearby').query({ lat: CUSTOMER.latitude, lng: CUSTOMER.longitude, serviceType: 'BREAKDOWN_REPAIR' }).set(auth(user.token));
  assert.equal(res.body.count, 1);
});

test('a user can only have one active request', async () => {
  const { user, vehicle } = await setup();
  await create(user, vehicle);
  const again = await create(user, vehicle);
  assert.equal(again.status, 409);
});

test('full lifecycle: accept, on the way, arrived, in progress, completed, then review once', async () => {
  const { user, vehicle, partner } = await setup();
  const id = (await create(user, vehicle)).body.request._id;

  const accepted = await setStatus(partner, id, 'ACCEPTED');
  assert.equal(accepted.status, 200);
  assert.equal(accepted.body.request.status, 'ACCEPTED');
  assert.equal((await PartnerProfile.findOne({ userId: partner.user._id })).availability, 'BUSY');

  for (const s of ['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED']) {
    const r = await setStatus(partner, id, s);
    assert.equal(r.status, 200, s);
    assert.equal(r.body.request.status, s);
  }
  const profile = await PartnerProfile.findOne({ userId: partner.user._id });
  assert.equal(profile.availability, 'AVAILABLE');
  assert.equal(profile.jobsCompleted, 1);

  const review = await request(app).post('/api/reviews').set(auth(user.token)).send({ requestId: id, rating: 5, comment: 'Great' });
  assert.equal(review.status, 201);
  assert.equal((await PartnerProfile.findOne({ userId: partner.user._id })).ratingAverage, 5);
  const dup = await request(app).post('/api/reviews').set(auth(user.token)).send({ requestId: id, rating: 1 });
  assert.equal(dup.status, 409);
});

test('invalid transitions are rejected', async () => {
  const { user, vehicle, partner } = await setup();
  const id = (await create(user, vehicle)).body.request._id;
  await setStatus(partner, id, 'ACCEPTED');
  assert.equal((await setStatus(partner, id, 'ARRIVED')).status, 400, 'cannot skip ON_THE_WAY');
  for (const s of ['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED']) await setStatus(partner, id, s);
  assert.equal((await setStatus(partner, id, 'ON_THE_WAY')).status, 400, 'COMPLETED -> ON_THE_WAY');
  const cancel = await request(app).patch(`/api/requests/${id}/cancel`).set(auth(user.token)).send({});
  assert.equal(cancel.status, 400);
});

test('only one partner can win a request', async () => {
  const { user, vehicle, partner } = await setup();
  const second = await createVerifiedPartner(app, 'MECHANIC', { lat: 28.47, lng: 77.5 });
  const id = (await create(user, vehicle)).body.request._id;
  assert.equal((await setStatus(partner, id, 'ACCEPTED')).status, 200);
  assert.equal((await setStatus(second, id, 'ACCEPTED')).status, 409);
});

test('unverified partners and customers cannot accept or move a request', async () => {
  const { user, vehicle } = await setup();
  const id = (await create(user, vehicle)).body.request._id;
  const pending = await register(app, 'MECHANIC');
  assert.equal((await setStatus(pending, id, 'ACCEPTED')).status, 403);
  assert.equal((await request(app).patch(`/api/requests/${id}/status`).set(auth(user.token)).send({ status: 'ACCEPTED' })).status, 403);
});

test('a user can cancel a searching request, freeing the partner', async () => {
  const { user, vehicle } = await setup();
  const id = (await create(user, vehicle)).body.request._id;
  const res = await request(app).patch(`/api/requests/${id}/cancel`).set(auth(user.token)).send({ reason: 'Fixed it myself' });
  assert.equal(res.body.request.status, 'CANCELLED');
  assert.equal((await create(user, vehicle)).status, 201, 'can request again after cancelling');
});

test('a declined direct request falls back to other partners', async () => {
  const { user, vehicle, partner } = await setup();
  const other = await createVerifiedPartner(app, 'MECHANIC', { lat: 28.47, lng: 77.5 });
  const res = await create(user, vehicle, { preferredPartnerId: partner.user._id });
  assert.equal(res.body.notified, 1);
  const id = res.body.request._id;
  assert.equal((await request(app).patch(`/api/requests/${id}/reject`).set(auth(partner.token))).status, 200);
  const open = await request(app).get('/api/requests').query({ scope: 'open' }).set(auth(other.token));
  assert.equal(open.body.requests.length, 1);
  const mine = await request(app).get('/api/requests').query({ scope: 'open' }).set(auth(partner.token));
  assert.equal(mine.body.requests.length, 0, 'the partner who declined no longer sees it');
});

test('invoice summary is available to the customer and renders a PDF', async () => {
  const { user, vehicle, partner } = await setup();
  const id = (await create(user, vehicle)).body.request._id;
  await setStatus(partner, id, 'ACCEPTED');
  const inv = await request(app).get(`/api/requests/${id}/invoice`).set(auth(user.token));
  assert.equal(inv.body.invoice.paymentStatus, 'Offline / Pay at service');
  const pdf = await request(app).get(`/api/requests/${id}/invoice.pdf`).set(auth(user.token)).buffer(true).parse((res, cb) => {
    const chunks = []; res.on('data', (c) => chunks.push(c)); res.on('end', () => cb(null, Buffer.concat(chunks)));
  });
  assert.equal(pdf.status, 200);
  assert.equal(pdf.body.subarray(0, 4).toString(), '%PDF');
});

test('users cannot read someone else\'s request', async () => {
  const { user, vehicle } = await setup();
  const id = (await create(user, vehicle)).body.request._id;
  const stranger = await register(app);
  assert.equal((await request(app).get(`/api/requests/${id}`).set(auth(stranger.token))).status, 403);
});
