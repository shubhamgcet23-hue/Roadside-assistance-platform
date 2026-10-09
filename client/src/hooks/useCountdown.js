import { useEffect, useState } from 'react';

const secondsLeft = (target) => (target ? Math.max(0, Math.floor((new Date(target).getTime() - Date.now()) / 1000)) : 0);

/** Seconds remaining until `target`, ticking once per second. */
export function useCountdown(target) {
  const [left, setLeft] = useState(() => secondsLeft(target));
  useEffect(() => {
    setLeft(secondsLeft(target));
    const t = setInterval(() => setLeft(secondsLeft(target)), 1000);
    return () => clearInterval(t);
  }, [target]);
  return left;
}

export const formatCountdown = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
