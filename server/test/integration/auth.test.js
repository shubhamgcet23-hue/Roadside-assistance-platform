import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startDb, stopDb, clearDb, register, auth, request, createAdmin } from './helpers.js';
import { PartnerProfile } from '../../src/models/PartnerProfile.js';

let app;
before(async () => { app = await startDb(); });
after(stopDb);
beforeEach(clearDb);

test('register returns a token and never exposes the password hash', async () => {
  const { res } = await register(app);
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.user.role, 'USER');
  assert.equal(res.body.user.password, undefined);
});

test('duplicate email is rejected with 409', async () => {
  const first = await register(app);
  const dup = await register(app, 'USER', { email: first.body.email });
  assert.equal(dup.res.status, 409);
});

test('weak password and bad phone give clear 400 errors', async () => {
  const weak = await register(app, 'USER', { password: 'short' });
  assert.equal(weak.res.status, 400);
  assert.match(weak.res.body.message, /password/i);
  const phone = await register(app, 'USER', { phone: '123' });
  assert.equal(phone.res.status, 400);
});

test('ADMIN cannot be registered publicly', async () => {
  const { res } = await register(app, 'ADMIN');
  assert.equal(res.status, 400);
});

test('partner registration creates a PENDING profile', async () => {
  const { user } = await register(app, 'MECHANIC');
  const profile = await PartnerProfile.findOne({ userId: user._id });
  assert.equal(profile.verificationStatus, 'PENDING');
  assert.equal(profile.availability, 'OFFLINE');
});

test('login works with the right password and fails with the wrong one', async () => {
  const { body } = await register(app);
  const ok = await request(app).post('/api/auth/login').send({ email: body.email, password: body.password });
  assert.equal(ok.status, 200);
  const bad = await request(app).post('/api/auth/login').send({ email: body.email, password: 'Wrong123!' });
  assert.equal(bad.status, 401);
});

test('/me needs a valid token', async () => {
  const { token } = await register(app);
  assert.equal((await request(app).get('/api/auth/me')).status, 401);
  assert.equal((await request(app).get('/api/auth/me').set(auth('garbage'))).status, 401);
  const ok = await request(app).get('/api/auth/me').set(auth(token));
  assert.equal(ok.status, 200);
});

test('role-based access: users cannot reach admin routes', async () => {
  const { token } = await register(app);
  assert.equal((await request(app).get('/api/admin/dashboard').set(auth(token))).status, 403);
  const admin = await createAdmin(app);
  assert.equal((await request(app).get('/api/admin/dashboard').set(auth(admin.token))).status, 200);
});

test('deactivated users cannot log in', async () => {
  const { body, user } = await register(app);
  const admin = await createAdmin(app);
  await request(app).patch(`/api/admin/users/${user._id}/status`).set(auth(admin.token)).send({ isActive: false });
  const res = await request(app).post('/api/auth/login').send({ email: body.email, password: body.password });
  assert.equal(res.status, 403);
});
