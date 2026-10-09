import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export async function userFromToken(token) {
  let payload;
  try { payload = jwt.verify(token, env.jwtSecret); } catch { throw new ApiError(401, 'Session expired. Please login again.'); }
  const user = await User.findById(payload.userId);
  if (!user || !user.isActive) throw new ApiError(401, 'Account not found or deactivated');
  return user;
}

export const protect = asyncHandler(async (req, _res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) throw new ApiError(401, 'Not authenticated');
  req.user = await userFromToken(token);
  next();
});

export const authorize = (...roles) => (req, _res, next) => (
  roles.includes(req.user?.role) ? next() : next(new ApiError(403, 'Forbidden'))
);
