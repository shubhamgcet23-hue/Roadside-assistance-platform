import { io } from 'socket.io-client';

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function createSocket(token) {
  return io(SOCKET_URL, { auth: { token }, reconnectionDelayMax: 5000 });
}

/** Promise wrapper around a socket emit with acknowledgement. */
export function emitAck(socket, event, payload, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (!socket) { reject(new Error('Live connection is not ready yet.')); return; }
    const timer = setTimeout(() => reject(new Error('The server did not respond. Please try again.')), timeoutMs);
    const done = (res) => {
      clearTimeout(timer);
      if (res && res.ok === false) reject(new Error(res.message || 'Request failed'));
      else resolve(res);
    };
    if (payload === undefined) socket.emit(event, done);
    else socket.emit(event, payload, done);
  });
}
