import { useCallback, useEffect, useState } from "react";

/**
 * useCountdown — зворотний відлік у секундах.
 * Рахує від дедлайну (а не декрементом), тому не "тікає" повільніше,
 * коли вкладка у фоні.
 *
 * Повертає { secondsLeft, restart }.
 */
export function useCountdown(seconds) {
  const [deadline, setDeadline] = useState(() => Date.now() + seconds * 1000);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const restart = useCallback(
    (next = seconds) => {
      const t = Date.now();
      setNow(t);
      setDeadline(t + next * 1000);
    },
    [seconds],
  );

  const secondsLeft = Math.max(0, Math.ceil((deadline - now) / 1000));
  return { secondsLeft, restart };
}

/** 180 -> "3:00" */
export const formatMmSs = (total) =>
  `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
