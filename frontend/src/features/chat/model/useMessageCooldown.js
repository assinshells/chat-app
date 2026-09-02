import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useMessageCooldown — тримає "скільки ще мс не можна надсилати
 * повідомлення" і тікає раз на 250мс, поки не дійде до нуля.
 * Використовується у двох сценаріях (див. useChatSocket.js):
 *
 *  1. локальний клієнтський rate-limit (messageRateLimiter.js) —
 *     миттєва реакція без походу на сервер;
 *  2. серверні коди RATE_LIMITED/MUTED (details.retryAfterMs) — на
 *     випадок, якщо сервер все ж відхилив повідомлення, яке локальний
 *     лімітер пропустив (гонка між вкладками, розсинхронізований годинник
 *     тощо, або реальний мут від автомодератора, який взагалі не
 *     відображений у локальному лічильнику).
 *
 * startCooldown НЕ скорочує вже активний довший кулдаун коротшим —
 * інакше, наприклад, 30-секундний мут від автомодератора міг би
 * "перебитися" 2-секундним залишком локального вікна rate-limit.
 */
export function useMessageCooldown() {
  const [remainingMs, setRemainingMs] = useState(0);
  const cooldownUntilRef = useRef(0);
  const intervalRef = useRef(null);

  const tick = useCallback(() => {
    const left = Math.max(0, cooldownUntilRef.current - Date.now());
    setRemainingMs(left);

    if (left <= 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startCooldown = useCallback(
    (durationMs) => {
      if (!durationMs || durationMs <= 0) return;

      const until = Date.now() + durationMs;
      if (until <= cooldownUntilRef.current) return;

      cooldownUntilRef.current = until;
      tick();

      if (!intervalRef.current) {
        intervalRef.current = setInterval(tick, 250);
      }
    },
    [tick],
  );

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    [],
  );

  return { remainingMs, startCooldown };
}
