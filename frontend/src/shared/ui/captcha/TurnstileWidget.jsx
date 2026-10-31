import { useEffect, useImperativeHandle, useRef } from "react";

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise = null;

const loadTurnstile = () => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.turnstile);
      script.onerror = () => {
        scriptPromise = null; // дозволяємо повторну спробу
        reject(new Error("Не вдалося завантажити перевірку «я не робот»"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
};

/**
 * TurnstileWidget — віджет Cloudflare Turnstile (CAPTCHA).
 *
 * siteKey — ПУБЛІЧНИЙ ключ (VITE_TURNSTILE_SITE_KEY). Секретний ключ є
 * лише на бекенді (TURNSTILE_SECRET_KEY); результат перевірки фронтом
 * нічого не вирішує — сервер сам перевіряє токен перед створенням акаунта.
 *
 * onToken(token) — токен готовий; onToken(null) — токен прострочено або
 * сталася помилка (кнопку відправки треба знову заблокувати).
 * ref.reset() — скинути віджет (токен одноразовий: після кожної
 * відправленої форми, у т.ч. невдалої, потрібен новий).
 */
export function TurnstileWidget({ siteKey, onToken, onError, ref }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  // Колбеки тримаємо в ref, щоб віджет не перемальовувався при кожному
  // рендері батька.
  const callbacksRef = useRef({ onToken, onError });
  useEffect(() => {
    callbacksRef.current = { onToken, onError };
  });

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
      callbacksRef.current.onToken?.(null);
    },
  }));

  useEffect(() => {
    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "auto",
          callback: (token) => callbacksRef.current.onToken?.(token),
          "expired-callback": () => callbacksRef.current.onToken?.(null),
          "error-callback": () => {
            callbacksRef.current.onToken?.(null);
            callbacksRef.current.onError?.();
          },
        });
      })
      .catch((err) => callbacksRef.current.onError?.(err));

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  return <div ref={containerRef} className="d-flex justify-content-center" />;
}
