import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startDb, stopDb, clearDb, register, auth, request, createVehicle } from './helpers.js';

let app;
before(async () => { app = await startDb(); });
after(stopDb);
beforeEach(clearDb);

test('vehicle CRUD with default handling', async () => {
  const { token } = await register(app);
  const first = await createVehicle(app, token);
  assert.equal(first.isDefault, true, 'first vehicle becomes default');

  const second = (await request(app).post('/api/vehicles').set(auth(token)).send({
    type: 'BIKE', make: 'Honda', model: 'Activa', registrationNumber: 'UP16CD5678', isDefault: true,
  })).body.vehicle;
  const list = (await request(app).get('/api/vehicles').set(auth(token))).body.vehicles;
  assert.equal(list.length, 2);
  assert.equal(list.filter((v) => v.isDefault).length, 1);
  assert.equal(list[0]._id, second._id);

  const upd = await request(app).put(`/api/vehicles/${first._id}`).set(auth(token)).send({ color: 'Red' });
  assert.equal(upd.body.vehicle.color, 'Red');

  const del = await request(app).delete(`/api/vehicles/${second._id}`).set(auth(token));
  assert.equal(del.status, 200);
  const after = (await request(app).get('/api/vehicles').set(auth(token))).body.vehicles;
  assert.equal(after.length, 1);
  assert.equal(after[0].isDefault, true, 'a remaining vehicle is promoted to default');
});

test('validation rejects a bad vehicle type', async () => {
  const { token } = await register(app);
  const res = await request(app).post('/api/vehicles').set(auth(token)).send({ type: 'BOAT', make: 'x', model: 'y', registrationNumber: 'ABCD' });
  assert.equal(res.status, 400);
});

test('users cannot touch each other\'s vehicles', async () => {
  const a = await register(app);
  const b = await register(app);
  const v = await createVehicle(app, a.token);
  assert.equal((await request(app).put(`/api/vehicles/${v._id}`).set(auth(b.token)).send({ color: 'Hacked' })).status, 404);
  assert.equal((await request(app).delete(`/api/vehicles/${v._id}`).set(auth(b.token))).status, 404);
});

test('partners and anonymous callers cannot use vehicle routes', async () => {
  const p = await register(app, 'MECHANIC');
  assert.equal((await request(app).get('/api/vehicles').set(auth(p.token))).status, 403);
  assert.equal((await request(app).get('/api/vehicles')).status, 401);
});
