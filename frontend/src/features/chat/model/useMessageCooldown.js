import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useMessageCooldown — держит "сколько ещё мс нельзя отправлять
 * сообщения" и тикает раз в 250мс, пока не дойдёт до нуля. Используется
 * в двух сценариях (см. useChatSocket.js):
 *
 *  1. локальный клиентский rate-limit (messageRateLimiter.js) —
 *     мгновенная реакция без похода на сервер;
 *  2. серверные коды RATE_LIMITED/MUTED (details.retryAfterMs) — на
 *     случай, если сервер всё же отклонил сообщение, которое локальный
 *     лимитер пропустил (гонка между вкладками, разошедшиеся часы и т.п.,
 *     либо реальный мут от автомодератора, который не отражён в
 *     локальном счётчике вовсе).
 *
 * startCooldown НЕ укорачивает уже идущий более длинный кулдаун более
 * коротким — иначе, например, 30-секундный мут от автомодератора мог
 * бы "перебиться" 2-секундным остатком локального rate-limit окна.
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
