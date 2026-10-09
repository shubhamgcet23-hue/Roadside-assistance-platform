import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import { Service } from '../models/Service.js';
import { PartnerProfile } from '../models/PartnerProfile.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { Review } from '../models/Review.js';
import { Notification } from '../models/Notification.js';
import { Complaint } from '../models/Complaint.js';
import { calculateDistance } from './location.js';
import { estimatePrice, partnerBasePrice } from '../services/pricing.js';

// Demo partners are scattered around this point. Set SEED_CENTER_LAT / SEED_CENTER_LNG to where you will demo.
const CENTER = { lat: Number(process.env.SEED_CENTER_LAT) || 28.4744, lng: Number(process.env.SEED_CENTER_LNG) || 77.504 };
const jitter = (km) => (Math.random() - 0.5) * 2 * (km / 111);
const near = (km = 5) => ({ latitude: CENTER.lat + jitter(km), longitude: CENTER.lng + jitter(km) });
const pick = (arr, i) => arr[i % arr.length];
const ALL = ['BREAKDOWN_REPAIR', 'TOWING', 'BATTERY_JUMPSTART', 'FLAT_TIRE', 'FUEL_DELIVERY'];

const SERVICES = [
  { code: 'BREAKDOWN_REPAIR', name: 'Breakdown Repair', description: 'On-the-spot repair by a mechanic', basePrice: 299, pricePerKm: 10, estimatedDurationMin: 45, icon: 'wrench' },
  { code: 'TOWING', name: 'Towing', description: 'Tow your vehicle to a garage', basePrice: 599, pricePerKm: 25, estimatedDurationMin: 60, icon: 'truck' },
  { code: 'BATTERY_JUMPSTART', name: 'Battery Jump-Start', description: 'Get going again with a quick jump-start', basePrice: 199, pricePerKm: 8, estimatedDurationMin: 20, icon: 'battery' },
  { code: 'FLAT_TIRE', name: 'Flat Tire Repair', description: 'Tire change or puncture repair', basePrice: 149, pricePerKm: 8, estimatedDurationMin: 30, icon: 'tire' },
  { code: 'FUEL_DELIVERY', name: 'Fuel Delivery', description: 'Fuel brought to where you are stopped', basePrice: 99, pricePerKm: 10, estimatedDurationMin: 25, icon: 'fuel' },
];
const USERS = ['Aarav Sharma', 'Diya Verma', 'Kabir Singh', 'Meera Nair', 'Rohan Gupta'];
const MECH = ['Ramesh Kumar', 'Sunil Yadav', 'Imran Khan', 'Vikram Chauhan', 'Pradeep Mishra', 'Anil Tomar', 'Deepak Rana', 'Naveen Bhati'];
const TOW = ['Highway Towing Co', 'Rapid Tow Services', 'City Recovery Crew'];
const phone = (i) => `98765${String(10000 + i).slice(-5)}`;

async function main() {
  await connectDB();
  const models = [User, Vehicle, Service, PartnerProfile, ServiceRequest, Review, Notification, Complaint];
  await Promise.all(models.map((m) => m.deleteMany({})));
  await Promise.all(models.map((m) => m.syncIndexes()));

  const services = await Service.insertMany(SERVICES);
  const svc = Object.fromEntries(services.map((s) => [s.code, s]));

  await User.create({ name: 'Platform Admin', email: 'admin@roadsideaaa.com', phone: phone(0), password: 'Admin@123', role: 'ADMIN' });

  const users = [];
  for (const [i, name] of USERS.entries()) {
    users.push(await User.create({
      name, email: i === 0 ? 'user@roadsideaaa.com' : `user${i + 1}@roadsideaaa.com`, phone: phone(i + 1), password: 'User@123',
    }));
  }

  const partners = [];
  const specs = [...MECH.map((n) => [n, 'MECHANIC']), ...TOW.map((n) => [n, 'TOWING_PARTNER'])];
  for (const [i, [name, role]] of specs.entries()) {
    const email = i === 0 ? 'mechanic@roadsideaaa.com' : `${role === 'MECHANIC' ? 'mechanic' : 'tow'}${i + 1}@roadsideaaa.com`;
    const u = await User.create({ name, email, phone: phone(i + 20), password: 'Mechanic@123', role });
    const c = near(6);
    // One PENDING and one REJECTED partner give the admin something to verify.
    const status = i === 7 ? 'PENDING' : i === 10 ? 'REJECTED' : 'VERIFIED';
    const p = await PartnerProfile.create({
      userId: u._id,
      experienceYears: 2 + (i % 9),
      services: role === 'MECHANIC' ? ALL.filter((s) => s !== 'TOWING') : ['TOWING'],
      pricing: i % 3 === 1 ? [{ serviceCode: 'BREAKDOWN_REPAIR', basePrice: 349 }] : [],
      address: 'Demo service point',
      location: { type: 'Point', coordinates: [c.longitude, c.latitude] },
      serviceRadiusKm: 15 + (i % 3) * 5,
      availability: status !== 'VERIFIED' ? 'OFFLINE' : i % 4 === 3 ? 'BUSY' : 'AVAILABLE',
      verificationStatus: status,
      verifiedAt: status === 'VERIFIED' ? new Date() : undefined,
      governmentIdRef: 'DEMO-ID-PLACEHOLDER',
      licenseRef: 'DEMO-LICENSE-PLACEHOLDER',
    });
    partners.push({ u, p });
  }
  const verified = partners.filter(({ p }) => p.verificationStatus === 'VERIFIED');

  const vehicleDefs = [['CAR', 'Hyundai', 'i20', 'PETROL'], ['BIKE', 'Royal Enfield', 'Classic 350', 'PETROL'], ['SUV', 'Mahindra', 'XUV700', 'DIESEL'], ['SCOOTER', 'Honda', 'Activa', 'PETROL'], ['CAR', 'Maruti', 'Swift', 'CNG']];
  const vehicles = await Vehicle.insertMany(users.map((u, i) => ({
    userId: u._id, type: vehicleDefs[i][0], make: vehicleDefs[i][1], model: vehicleDefs[i][2], fuelType: vehicleDefs[i][3],
    registrationNumber: `UP16AB${1000 + i}`, year: 2018 + i, color: pick(['White', 'Black', 'Silver', 'Red', 'Blue'], i), isDefault: true,
  })));

  // 15 historical requests over the last ~4 weeks: 12 completed (10 reviewed) and 3 cancelled.
  const requests = [];
  for (let i = 0; i < 15; i += 1) {
    const u = pick(users, i);
    const v = vehicles[i % users.length];
    const { u: pu, p } = pick(verified, i);
    const wanted = pick(ALL, i);
    const type = p.services.includes(wanted) ? wanted : p.services[0];
    const loc = near(5);
    const dist = calculateDistance(loc.latitude, loc.longitude, p.location.coordinates[1], p.location.coordinates[0]);
    const pricing = estimatePrice(svc[type], dist, partnerBasePrice(p, type));
    const created = new Date(Date.now() - (1 + i * 2) * 864e5 - (i % 5) * 36e5);
    const accepted = new Date(created.getTime() + (2 + (i % 6)) * 6e4);
    const cancelled = i >= 12;
    const completed = new Date(accepted.getTime() + (35 + (i % 4) * 10) * 6e4);
    requests.push(await ServiceRequest.create({
      userId: u._id, vehicleId: v._id, serviceId: svc[type]._id, partnerId: pu._id, serviceType: type,
      description: 'Vehicle stopped on the road', emergencyLevel: pick(['LOW', 'MEDIUM', 'HIGH'], i),
      breakdownLocation: { address: 'Demo location', ...loc }, pricing, estimatedCost: pricing.total,
      status: cancelled ? 'CANCELLED' : 'COMPLETED',
      finalCost: cancelled ? undefined : pricing.total + (i % 3) * 20,
      acceptedAt: accepted, actualArrivalTime: cancelled ? undefined : new Date(accepted.getTime() + 15 * 6e4),
      startedAt: cancelled ? undefined : new Date(accepted.getTime() + 18 * 6e4),
      completedAt: cancelled ? undefined : completed,
      cancelledAt: cancelled ? accepted : undefined, cancellationReason: cancelled ? 'Got help elsewhere' : undefined,
      createdAt: created,
    }));
  }

  const comments = ['Very quick and polite', 'Fixed it fast', 'Good service, fair price', 'Arrived on time', 'Professional work'];
  for (const [i, r] of requests.slice(0, 10).entries()) {
    const rating = 3 + (i % 3);
    await Review.create({ requestId: r._id, userId: r.userId, partnerId: r.partnerId, rating, comment: pick(comments, i) });
    await ServiceRequest.updateOne({ _id: r._id }, { rating, review: pick(comments, i) });
  }

  // Partner stats are computed from the seeded data, not typed in.
  for (const { u, p } of partners) {
    const reviews = await Review.find({ partnerId: u._id });
    p.ratingCount = reviews.length;
    p.ratingAverage = reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;
    p.jobsCompleted = await ServiceRequest.countDocuments({ partnerId: u._id, status: 'COMPLETED' });
    await p.save();
  }

  await Notification.insertMany([
    { userId: users[0]._id, type: 'SERVICE_COMPLETED', title: 'Service completed', message: 'Please rate your partner.', data: { requestId: requests[0]._id } },
    { userId: users[0]._id, type: 'REQUEST_CREATED', title: 'Welcome to RoadsideAAA', message: 'Add your vehicle to get started.' },
    { userId: partners[0].u._id, type: 'VERIFICATION', title: 'Profile verified', message: 'You can now go online and receive requests.' },
  ]);
  await Complaint.insertMany([
    { userId: requests[1].userId, requestId: requests[1]._id, category: 'DELAY', description: 'Partner arrived later than estimated.', priority: 'MEDIUM', status: 'OPEN' },
    { userId: requests[3].userId, requestId: requests[3]._id, category: 'OVERCHARGING', description: 'Charged more than the estimate.', priority: 'HIGH', status: 'UNDER_REVIEW' },
    { userId: requests[5].userId, requestId: requests[5]._id, category: 'OTHER', description: 'App showed a wrong ETA.', priority: 'LOW', status: 'RESOLVED', adminNote: 'ETA formula adjusted.' },
  ]);

  console.log(`Seeded around (${CENTER.lat}, ${CENTER.lng}): ${users.length} users, ${partners.length} partners, ${requests.length} requests.`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
