import test from 'node:test';
import assert from 'node:assert/strict';
import { fillDays, lastNDays } from '../../src/utils/series.js';
import { parsePage, pageMeta, escapeRegex } from '../../src/utils/paginate.js';

test('lastNDays returns n consecutive UTC days ending today', () => {
  const days = lastNDays(3, new Date('2026-10-07T10:00:00Z'));
  assert.deepEqual(days, ['2026-10-05', '2026-10-06', '2026-10-07']);
});

test('fillDays inserts zero rows for missing days', () => {
  const out = fillDays([{ _id: '2026-10-06', amount: 50 }], ['2026-10-05', '2026-10-06'], { amount: 0 });
  assert.deepEqual(out, [{ date: '2026-10-05', amount: 0 }, { date: '2026-10-06', amount: 50 }]);
});

test('parsePage clamps page and limit', () => {
  assert.deepEqual(parsePage({ page: '-2', limit: '1000' }), { page: 1, limit: 100, skip: 0 });
  assert.deepEqual(parsePage({ page: '3', limit: '10' }), { page: 3, limit: 10, skip: 20 });
});

test('pageMeta computes page count', () => {
  assert.equal(pageMeta(25, { page: 1, limit: 10 }).pages, 3);
  assert.equal(pageMeta(0, { page: 1, limit: 10 }).pages, 1);
});

test('escapeRegex neutralises regex metacharacters (search input safety)', () => {
  assert.equal(new RegExp(escapeRegex('a.b*')).test('axbb'), false);
  assert.equal(new RegExp(escapeRegex('a.b*')).test('a.b*'), true);
});
