import { useCallback, useState } from 'react';
import { getCurrentPosition } from '../services/location.js';

/** Browser geolocation with loading and a user-facing error message. */
export function useLocate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const locate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await getCurrentPosition();
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  return { locate, loading, error, clearError: () => setError(null) };
}
