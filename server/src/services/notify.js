import { Notification } from '../models/Notification.js';
import { emitTo } from '../sockets/io.js';

/** Persist a notification and push it in real time to the user's room. */
export async function notify(userId, type, title, message, data = {}) {
  const n = await Notification.create({ userId, type, title, message, data });
  emitTo(`user:${userId}`, 'notification', n);
  return n;
}
