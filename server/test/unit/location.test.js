import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDistance, calculateETA } from '../../src/utils/location.js';

test('distance between identical points is zero', () => {
  assert.equal(calculateDistance(28.4744, 77.504, 28.4744, 77.504), 0);
});

test('Delhi to Mumbai is roughly 1,150 km', () => {
  const d = calculateDistance(28.6139, 77.209, 19.076, 72.8777);
  assert.ok(d > 1100 && d < 1200, `got ${d}`);
});

test('distance is symmetric', () => {
  const a = calculateDistance(12.97, 77.59, 13.08, 80.27);
  const b = calculateDistance(13.08, 80.27, 12.97, 77.59);
  assert.ok(Math.abs(a - b) < 1e-9);
});

test('ETA uses the average speed and never returns less than 1 minute', () => {
  assert.equal(calculateETA(10, 30), 20);
  assert.equal(calculateETA(0, 30), 1);
  assert.equal(calculateETA(0.1, 60), 1);
});
