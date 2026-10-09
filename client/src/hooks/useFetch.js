import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../services/api.js';

/**
 * Run an async loader and track { data, loading, error }.
 * reload({ silent: true }) refreshes without flashing the loading state (used after socket events).
 */
export function useFetch(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const latest = useRef(0);

  const load = useCallback(async ({ silent = false } = {}) => {
    const run = ++latest.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loaderRef.current();
      if (run === latest.current) setState({ data, loading: false, error: null });
    } catch (e) {
      if (run === latest.current) setState((s) => ({ ...s, loading: false, error: getErrorMessage(e) }));
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, deps);

  const setData = useCallback((updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })), []);
  return { ...state, reload: load, setData };
}
