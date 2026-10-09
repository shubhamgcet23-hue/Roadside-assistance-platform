import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';
import { corsOrigin, env } from './config/env.js';

export function createApp() {
  const app = express();
  if (env.isProd) app.set('trust proxy', 1); // Render/Railway sit behind a proxy
  app.use(helmet());
  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(mongoSanitize());
  app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000, limit: 1500, standardHeaders: true, legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
  }));
  app.get('/', (_req, res) => res.json({ name: 'RoadsideAAA API', status: 'ok' }));
  app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
