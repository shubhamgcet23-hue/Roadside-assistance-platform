import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { PartnerProfile } from '../models/PartnerProfile.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { env } from '../config/env.js';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().regex(/^\+?[0-9]{10,13}$/, 'Enter a valid phone number (10-13 digits)'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password needs an uppercase letter')
    .regex(/[a-z]/, 'Password needs a lowercase letter')
    .regex(/[0-9]/, 'Password needs a digit'),
  role: z.enum(['USER', 'MECHANIC', 'TOWING_PARTNER']).default('USER'), // ADMIN is never publicly registerable
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

const sign = (u) => jwt.sign({ userId: u._id, role: u.role }, env.jwtSecret, { expiresIn: '7d' });

async function authPayload(user) {
  const payload = { user };
  if (user.role === 'MECHANIC' || user.role === 'TOWING_PARTNER') {
    payload.partnerProfile = await PartnerProfile.findOne({ userId: user._id }).select('verificationStatus availability');
  }
  return payload;
}

export const register = asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  if (await User.exists({ email: data.email.toLowerCase() })) throw new ApiError(409, 'Email already registered');
  const user = await User.create(data);
  if (user.role !== 'USER') await PartnerProfile.create({ userId: user._id });
  res.status(201).json({ success: true, token: sign(user), ...(await authPayload(user)) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'Account deactivated');
  res.json({ success: true, token: sign(user), ...(await authPayload(user)) });
});

export const me = asyncHandler(async (req, res) => res.json({ success: true, ...(await authPayload(req.user)) }));

// JWTs are stateless; the client discards its token. The endpoint exists for symmetry and future token revocation.
export const logout = (_req, res) => res.json({ success: true });
