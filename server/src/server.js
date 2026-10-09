import 'dotenv/config';
import http from 'http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { initSockets } from './sockets/index.js';
import { env } from './config/env.js';

if (!env.jwtSecret) {
  console.error('JWT_SECRET is not set. Copy server/.env.example to server/.env and fill it in.');
  process.exit(1);
}

const server = http.createServer(createApp());
initSockets(server);

connectDB()
  .then(() => server.listen(env.port, () => console.log(`RoadsideAAA API listening on :${env.port} (${env.nodeEnv})`)))
  .catch((e) => {
    console.error(`Could not connect to MongoDB: ${e.message}`);
    process.exit(1);
  });

process.on('SIGTERM', () => server.close(() => process.exit(0)));
