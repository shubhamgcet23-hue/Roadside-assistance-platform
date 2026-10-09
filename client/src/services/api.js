import axios from 'axios';
import { TOKEN_KEY } from '../types/constants.js';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const AUTH_EXPIRED_EVENT = 'auth:expired';

const safe = (fn) => { try { return fn(); } catch { return null; } };
export const getToken = () => safe(() => localStorage.getItem(TOKEN_KEY));
export const setToken = (t) => safe(() => localStorage.setItem(TOKEN_KEY, t));
export const clearToken = () => safe(() => localStorage.removeItem(TOKEN_KEY));

const api = axios.create({ baseURL: API_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && getToken() && !isAuthCall) {
      clearToken();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  },
);

/** Human-readable message for any thrown error. */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (err?.request && !err.response) return 'Cannot reach the server. Check your connection and try again.';
  return err?.message || fallback;
}

export default api;
