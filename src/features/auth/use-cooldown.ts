import { useCallback, useEffect, useState } from 'react';

/** Seconds left before an action (e.g. resending a code) may run again. */
export function useCooldown(seconds: number, startActive: boolean) {
  const [remaining, setRemaining] = useState(startActive ? seconds : 0);

  useEffect(() => {
    if (remaining <= 0) {
      return;
    }
    const timer = setTimeout(() => setRemaining((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  const start = useCallback(() => setRemaining(seconds), [seconds]);

  return { remaining, start };
}
