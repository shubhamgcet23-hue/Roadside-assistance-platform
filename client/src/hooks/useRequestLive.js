import { useEffect } from 'react';
import { useRealtime } from '../context/RealtimeContext.jsx';
import { useSocketEvents } from './useSocketEvent.js';
import { emitAck } from '../services/socket.js';

export const REQUEST_EVENTS = [
  'request-accepted', 'request-rejected', 'mechanic-on-the-way', 'mechanic-arrived',
  'service-started', 'service-completed', 'request-cancelled',
];

/**
 * Joins the Socket.IO room of one request (and re-joins after a reconnect) and calls
 * onEvent(name, payload) for status changes of that request.
 */
export function useRequestLive(requestId, onEvent) {
  const { socket, connected } = useRealtime();

  useEffect(() => {
    if (!socket || !connected || !requestId) return undefined;
    emitAck(socket, 'join-request', requestId).catch(() => {});
    return () => socket.emit('leave-request', requestId);
  }, [socket, connected, requestId]);

  useSocketEvents(REQUEST_EVENTS, (name, payload) => {
    if (!requestId || !payload || String(payload.requestId) === String(requestId)) onEvent(name, payload);
  });
}
