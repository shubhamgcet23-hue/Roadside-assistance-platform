import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/auth.js';
import { AUTH_EXPIRED_EVENT, clearToken, getToken, setToken } from '../services/api.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  const apply = useCallback((data) => {
    setUser(data.user);
    setPartnerProfile(data.partnerProfile || null);
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setPartnerProfile(null);
      toast.error('Session expired. Please login again.');
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [toast]);

  useEffect(() => {
    if (!getToken()) return;
    authService.me()
      .then(apply)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, [apply]);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    setToken(data.token);
    apply(data);
    return data.user;
  }, [apply]);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    setToken(data.token);
    apply(data);
    return data.user;
  }, [apply]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setPartnerProfile(null);
  }, []);

  const refresh = useCallback(async () => apply(await authService.me()), [apply]);
  const updateUser = useCallback((u) => setUser(u), []);

  const value = useMemo(
    () => ({ user, partnerProfile, loading, login, register, logout, refresh, updateUser }),
    [user, partnerProfile, loading, login, register, logout, refresh, updateUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
