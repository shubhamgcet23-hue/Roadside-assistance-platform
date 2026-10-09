import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '../services/api.js';

describe('getErrorMessage', () => {
  it('uses the message sent by the server', () => {
    expect(getErrorMessage({ response: { data: { message: 'Invalid email or password' } } })).toBe('Invalid email or password');
  });
  it('explains a timeout', () => {
    expect(getErrorMessage({ code: 'ECONNABORTED' })).toMatch(/too long/);
  });
  it('explains an unreachable server', () => {
    expect(getErrorMessage({ request: {} })).toMatch(/Cannot reach the server/);
  });
  it('falls back to the default message', () => {
    expect(getErrorMessage({}, 'Fallback')).toBe('Fallback');
  });
});