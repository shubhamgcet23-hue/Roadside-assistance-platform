import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, me, logout } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});
const r = Router();
r.post('/register', limiter, register);
r.post('/login', limiter, login);
r.post('/logout', protect, logout);
r.get('/me', protect, me);
export default r;
