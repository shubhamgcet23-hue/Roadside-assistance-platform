// Lazy getters so tests can set process.env before first use. dotenv is loaded by the entry points.
const list = (v) => (v || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);

export const env = {
  get nodeEnv() { return process.env.NODE_ENV || 'development'; },
  get isProd() { return this.nodeEnv === 'production'; },
  get port() { return Number(process.env.PORT) || 5000; },
  get mongoUri() { return process.env.MONGODB_URI; },
  get jwtSecret() { return process.env.JWT_SECRET; },
  get clientOrigins() {
    const o = list(process.env.CLIENT_URL);
    return o.length ? o : ['http://localhost:5173'];
  },
  get avgSpeedKmh() { return Number(process.env.AVG_SPEED_KMH) || 30; },
  get offerTimeoutSeconds() { return Number(process.env.OFFER_TIMEOUT_SECONDS) || 300; },
  get demoTrackingEnabled() { return process.env.ENABLE_DEMO_TRACKING !== 'false'; },
};

export const corsOrigin = (origin, cb) => {
  if (!origin || env.clientOrigins.includes(origin.replace(/\/$/, ''))) return cb(null, true);
  const err = new Error(`Origin ${origin} not allowed by CORS`);
  err.status = 403;
  return cb(err);
};
