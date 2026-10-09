import { useEffect, useRef } from 'react';
import { useRealtime } from '../context/RealtimeContext.jsx';

/** Subscribe to a Socket.IO event for the lifetime of the component. */
export function useSocketEvent(event, handler) {
  const { socket } = useRealtime();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!socket) return undefined;
    const fn = (...args) => ref.current(...args);
    socket.on(event, fn);
    return () => socket.off(event, fn);
  }, [socket, event]);
}

export function useSocketEvents(events, handler) {
  const { socket } = useRealtime();
  const ref = useRef(handler);
  ref.current = handler;
  const key = events.join('|');
  useEffect(() => {
    if (!socket) return undefined;
    const fn = (name) => (payload) => ref.current(name, payload);
    const bound = events.map((e) => [e, fn(e)]);
    bound.forEach(([e, f]) => socket.on(e, f));
    return () => bound.forEach(([e, f]) => socket.off(e, f));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, key]);
}
