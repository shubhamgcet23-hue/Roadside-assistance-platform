import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';
import { createSocket } from '../services/socket.js';
import { getToken } from '../services/api.js';
import { notificationService } from '../services/feedback.js';

const RealtimeContext = createContext({ socket: null, connected: false, unread: 0, setUnread: () => {}, tick: 0 });

/** One authenticated Socket.IO connection per logged-in user, plus the unread-notification counter. */
export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const userId = user?._id;
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [unread, setUnread] = useState(0);
  const [tick, setTick] = useState(0); // bumps on every notification so lists can refresh

  useEffect(() => {
    if (!userId) {
      setSocket(null);
      setConnected(false);
      setUnread(0);
      return undefined;
    }
    const s = createSocket(getToken());
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('notification', (n) => {
      setUnread((c) => c + 1);
      setTick((t) => t + 1);
      toast.info(n.message ? `${n.title}: ${n.message}` : n.title);
    });
    setSocket(s);
    notificationService.list({ limit: 1 }).then((d) => setUnread(d.unread)).catch(() => {});
    return () => {
      s.removeAllListeners();
      s.disconnect();
    };
  }, [userId, toast]);

  const value = useMemo(() => ({ socket, connected, unread, setUnread, tick }), [socket, connected, unread, tick]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export const useRealtime = () => useContext(RealtimeContext);
