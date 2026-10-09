import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startDb, stopDb, clearDb, register, auth, request, createAdmin, seedServices, createVehicle, createVerifiedPartner, CUSTOMER } from './helpers.js';
import { PartnerProfile } from '../../src/models/PartnerProfile.js';
import { Notification } from '../../src/models/Notification.js';

let app;
before(async () => { app = await startDb(); });
after(stopDb);
beforeEach(async () => { await clearDb(); await seedServices(); });

test('admin verifies a pending partner, who is notified and can then go available', async () => {
  const admin = await createAdmin(app);
  const partner = await register(app, 'MECHANIC');
  assert.equal((await request(app).patch('/api/partners/availability').set(auth(partner.token)).send({ availability: 'AVAILABLE' })).status, 403);

  const list = await request(app).get('/api/admin/partners').query({ status: 'PENDING' }).set(auth(admin.token));
  assert.equal(list.body.partners.length, 1);

  const res = await request(app).patch(`/api/admin/partners/${partner.user._id}/verify`).set(auth(admin.token));
  assert.equal(res.status, 200);
  assert.equal(res.body.profile.verificationStatus, 'VERIFIED');
  assert.equal(await Notification.countDocuments({ userId: partner.user._id, type: 'VERIFICATION' }), 1);

  await PartnerProfile.updateOne({ userId: partner.user._id }, { location: { type: 'Point', coordinates: [77.5, 28.47] } });
  const online = await request(app).patch('/api/partners/availability').set(auth(partner.token)).send({ availability: 'AVAILABLE' });
  assert.equal(online.status, 200);
});

test('admin can reject, suspend and reactivate; invalid moves are refused', async () => {
  const admin = await createAdmin(app);
  const partner = await createVerifiedPartner(app);
  const id = partner.user._id;
  assert.equal((await request(app).patch(`/api/admin/partners/${id}/reactivate`).set(auth(admin.token))).status, 400, 'only suspended partners can be reactivated');
  const suspended = await request(app).patch(`/api/admin/partners/${id}/suspend`).set(auth(admin.token));
  assert.equal(suspended.body.profile.verificationStatus, 'SUSPENDED');
  assert.equal(suspended.body.profile.availability, 'OFFLINE');
  const back = await request(app).patch(`/api/admin/partners/${id}/reactivate`).set(auth(admin.token));
  assert.equal(back.body.profile.verificationStatus, 'VERIFIED');
  const rejected = await request(app).patch(`/api/admin/partners/${id}/reject`).set(auth(admin.token)).send({ reason: 'Documents unclear' });
  assert.equal(rejected.body.profile.verificationStatus, 'REJECTED');
});

test('non-admins cannot verify partners', async () => {
  const partner = await register(app, 'MECHANIC');
  const user = await register(app);
  assert.equal((await request(app).patch(`/api/admin/partners/${partner.user._id}/verify`).set(auth(user.token))).status, 403);
  assert.equal((await request(app).patch(`/api/admin/partners/${partner.user._id}/verify`).set(auth(partner.token))).status, 403);
});

test('dashboard KPIs come from real data', async () => {
  const admin = await createAdmin(app);
  const user = await register(app);
  const vehicle = await createVehicle(app, user.token);
  const partner = await createVerifiedPartner(app);
  const id = (await request(app).post('/api/requests').set(auth(user.token)).send({
    vehicleId: vehicle._id, serviceType: 'FLAT_TIRE', location: CUSTOMER,
  })).body.request._id;
  for (const status of ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED']) {
    await request(app).patch(`/api/requests/${id}/status`).set(auth(partner.token)).send({ status });
  }
  const res = await request(app).get('/api/admin/dashboard').set(auth(admin.token));
  assert.equal(res.status, 200);
  const { kpis, charts } = res.body;
  assert.equal(kpis.totalUsers, 1);
  assert.equal(kpis.totalPartners, 1);
  assert.equal(kpis.verifiedPartners, 1);
  assert.equal(kpis.completedRequests, 1);
  assert.ok(kpis.totalRevenue > 0);
  assert.equal(charts.requestsOverTime.length, 30);
  assert.equal(charts.categories[0].name, 'FLAT_TIRE');

  const report = await request(app).get('/api/admin/reports').set(auth(admin.token));
  assert.equal(report.status, 200);
  assert.equal(report.body.summary.totalRequests, 1);
  assert.equal((await request(app).get('/api/admin/reports?from=2026-12-01&to=2026-01-01').set(auth(admin.token))).status, 400);
});

test('admin manages services and complaints', async () => {
  const admin = await createAdmin(app);
  const services = await request(app).get('/api/services').query({ all: 'true' }).set(auth(admin.token));
  const flat = services.body.services.find((s) => s.code === 'FLAT_TIRE');
  const upd = await request(app).put(`/api/services/${flat._id}`).set(auth(admin.token)).send({ basePrice: 199 });
  assert.equal(upd.body.service.basePrice, 199);
  const off = await request(app).delete(`/api/services/${flat._id}`).set(auth(admin.token));
  assert.equal(off.body.service.isActive, false);
  const user = await register(app);
  assert.equal((await request(app).put(`/api/services/${flat._id}`).set(auth(user.token)).send({ basePrice: 1 })).status, 403);
});
