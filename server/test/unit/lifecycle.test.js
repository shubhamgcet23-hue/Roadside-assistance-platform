import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransition, TRANSITIONS, STATUS, ACTIVE_STATUSES } from '../../src/utils/lifecycle.js';

test('happy path is allowed step by step', () => {
  const path = ['SEARCHING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'];
  for (let i = 0; i < path.length - 1; i += 1) assert.equal(canTransition(path[i], path[i + 1]), true, `${path[i]} -> ${path[i + 1]}`);
});

test('COMPLETED -> ON_THE_WAY is rejected', () => {
  assert.equal(canTransition('COMPLETED', 'ON_THE_WAY'), false);
});

test('terminal states cannot move', () => {
  assert.deepEqual(TRANSITIONS.COMPLETED, []);
  assert.deepEqual(TRANSITIONS.CANCELLED, []);
});

test('steps cannot be skipped', () => {
  assert.equal(canTransition('ACCEPTED', 'ARRIVED'), false);
  assert.equal(canTransition('SEARCHING', 'IN_PROGRESS'), false);
});

test('cancellation is allowed until work is in progress', () => {
  for (const s of ['PENDING', 'SEARCHING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED']) assert.equal(canTransition(s, 'CANCELLED'), true, s);
  assert.equal(canTransition('IN_PROGRESS', 'CANCELLED'), false);
});

test('every status has a transition entry and active list excludes terminal states', () => {
  for (const s of STATUS) assert.ok(s in TRANSITIONS, s);
  assert.equal(ACTIVE_STATUSES.includes('COMPLETED'), false);
  assert.equal(ACTIVE_STATUSES.includes('CANCELLED'), false);
});
