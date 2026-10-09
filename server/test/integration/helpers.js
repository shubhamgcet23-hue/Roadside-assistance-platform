// Integration helpers: an in-memory MongoDB plus the real Express app.
// Requires dev dependencies (npm install) and downloads a mongod binary on first run.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-do-not-use-in-prod';

import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { Service } from '../../src/models/Service.js';
import { Vehicle } from '../../src/models/Vehicle.js';
import { PartnerProfile } from '../../src/models/PartnerProfile.js';

export const CUSTOMER = { latitude: 28.4744, longitude: 77.504, address: 'Test road' };
let mongod;

export async function startDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([User.init(), PartnerProfile.init()]);
  return createApp();
}

export async function stopDb() {
  await mongoose.disconnect();
  await mongod?.stop();
}

export const clearDb = () => Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));

export async function seedServices() {
  return Service.insertMany([
    { code: 'BREAKDOWN_REPAIR', name: 'Breakdown Repair', basePrice: 299, pricePerKm: 10 },
    { code: 'TOWING', name: 'Towing', basePrice: 599, pricePerKm: 25 },
    { code: 'BATTERY_JUMPSTART', name: 'Battery Jump-Start', basePrice: 199, pricePerKm: 8 },
    { code: 'FLAT_TIRE', name: 'Flat Tire Repair', basePrice: 149, pricePerKm: 8 },
    { code: 'FUEL_DELIVERY', name: 'Fuel Delivery', basePrice: 99, pricePerKm: 10 },
  ]);
}

let counter = 0;
export async function register(app, role = 'USER', overrides = {}) {
  counter += 1;
  const body = {
    name: `Test ${role} ${counter}`, email: `${role.toLowerCase()}${counter}@test.com`, phone: `98765${String(10000 + counter)}`,
    password: 'Passw0rd!', role, ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(body);
  return { res, token: res.body.token, user: res.body.user, body };
}

export async function createAdmin(app) {
  counter += 1;
  const email = `admin${counter}@test.com`;
  await User.create({ name: 'Admin', email, phone: '9876500000', password: 'Passw0rd!', role: 'ADMIN' });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Passw0rd!' });
  return { token: res.body.token, user: res.body.user };
}

export const auth = (token) => ({ Authorization: `Bearer ${token}` });

/** A verified, available partner about 1 km from CUSTOMER offering every service. */
export async function createVerifiedPartner(app, role = 'MECHANIC', at = { lat: 28.48, lng: 77.51 }) {
  const p = await register(app, role);
  await PartnerProfile.updateOne({ userId: p.user._id }, {
    verificationStatus: 'VERIFIED', availability: 'AVAILABLE', serviceRadiusKm: 20,
    services: ['BREAKDOWN_REPAIR', 'TOWING', 'BATTERY_JUMPSTART', 'FLAT_TIRE', 'FUEL_DELIVERY'],
    location: { type: 'Point', coordinates: [at.lng, at.lat] },
  });
  return p;
}

export async function createVehicle(app, token) {
  const res = await request(app).post('/api/vehicles').set(auth(token)).send({
    type: 'CAR', make: 'Hyundai', model: 'i20', registrationNumber: 'UP16AB1234', year: 2020, fuelType: 'PETROL', color: 'White',
  });
  return res.body.vehicle;
}

export { request, Vehicle };
