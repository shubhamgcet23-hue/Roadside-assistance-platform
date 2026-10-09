import test from 'node:test';
import assert from 'node:assert/strict';
import { estimatePrice, partnerBasePrice } from '../../src/services/pricing.js';

const service = { basePrice: 299, pricePerKm: 10 };

test('estimate = base + distance x price per km', () => {
  assert.deepEqual(estimatePrice(service, 3.46), { baseCost: 299, distanceKm: 3.5, distanceCharge: 35, total: 334 });
});

test('partner base price overrides the service base price', () => {
  assert.equal(estimatePrice(service, 2, 349).total, 349 + 20);
});

test('partnerBasePrice finds the override by service code', () => {
  const profile = { pricing: [{ serviceCode: 'TOWING', basePrice: 700 }] };
  assert.equal(partnerBasePrice(profile, 'TOWING'), 700);
  assert.equal(partnerBasePrice(profile, 'FLAT_TIRE'), undefined);
});
