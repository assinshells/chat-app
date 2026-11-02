import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useCompleteRegistrationStore } from "@features/auth/complete-registration/model/useCompleteRegistrationStore.js";
import { getRegistrationSession } from "@features/auth/complete-registration/api/completeRegistration.api.js";
import { RulesModal } from "@features/info/ui/RulesModal.jsx";
import { CookiesModal } from "@features/info/ui/CookiesModal.jsx";
import { TurnstileWidget, TURNSTILE_SITE_KEY } from "@shared/ui/captcha";

const RULES_MODAL_ID = "completeRegistrationRulesModal";
const COOKIES_MODAL_ID = "completeRegistrationCookiesModal";

// Той самий формат, що й на бекенді (validators/auth.validator.js).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 255;

const validateEmail = (value) => {
  const email = value.trim();
  if (!email) {
    return "Вкажіть email або позначте, що не хочете залишати електронну пошту";
  }
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) {
    return "Введіть коректну адресу електронної пошти";
  }
  return null;
};

/**
 * CompleteRegistrationForm — другий крок єдиного потоку входу
 * (див. LoginForm.jsx): логін вільний, тож лишилося вказати email (або
 * відмовитися від нього) і пройти перевірку на бота.
 *
 * Логін і пароль показуються лише для читання. Пароль приходить із
 * пам'яті застосунку (App.jsx, screenParams) — він НЕ потрапляє в URL,
 * localStorage/sessionStorage, консоль чи логи, а на сервері зберігається
 * тільки як хеш (реєстраційна сесія). Створення акаунта на сервері
 * використовує дані цієї сесії, а не поля форми: підміна стану на
 * фронті нічого не дає.
 */
export function CompleteRegistrationForm({
  login,
  password,
  onSuccess,
  onBack,
}) {
  const [serverLogin, setServerLogin] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [noEmail, setNoEmail] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaError, setCaptchaError] = useState(false);
  const captchaRef = useRef(null);

  const { loading, error, fatal, submit, markExpired, clearError } =
    useCompleteRegistrationStore();

  const captchaEnabled = Boolean(TURNSTILE_SITE_KEY);

  // Скидаємо стан стору при вході на сторінку і перевіряємо, що серверна
  // сесія досі жива (після простою вона могла закінчитися). Логін для
  // показу беремо з сервера — це джерело істини.
  useEffect(() => {
    let cancelled = false;
    useCompleteRegistrationStore.getState().reset();

    getRegistrationSession()
      .then((data) => {
        if (!cancelled) setServerLogin(data.login);
      })
      .catch((err) => {
        if (!cancelled) markExpired(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [markExpired]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    clearError();

    if (!noEmail) {
      const problem = validateEmail(email);
      setEmailError(problem);
      if (problem) return;
    }
    if (captchaEnabled && !captchaToken) {
      setCaptchaError(true);
      return;
    }

    const ok = await submit({ email, noEmail, captchaToken }, onSuccess);
    if (!ok && captchaEnabled) {
      // Токен Turnstile одноразовий — для повторної спроби потрібен новий.
      captchaRef.current?.reset();
    }
  };

  // Сесія закінчилася / логін уже зайнятий — продовжити неможливо.
  if (fatal) {
    return (
      <div className="auth-stack">
        <div className="auth-fields">
          <p className="text-danger mb-0" role="alert">
            {error}
          </p>
          <button
            type="button"
            className="btn btn-primary w-100"
            onClick={onBack}
          >
            Повернутися до входу
          </button>
        </div>
      </div>
    );
  }

  const submitDisabled = loading || (captchaEnabled && !captchaToken);

  return (
    <>
      <form
        onSubmit={handleSubmit}
        role="form"
        className="auth-form"
        noValidate
      >
        <div className="auth-stack">
          <div className="auth-fields">
            {error && (
              <p className="text-danger mb-0" role="alert">
                {error}
              </p>
            )}

            <div>
              <input
                id="completeLoginInput"
                type="text"
                className="form-control"
                placeholder="Нікнейм"
                aria-label="Нікнейм"
                value={serverLogin ?? login}
                readOnly
                autoComplete="off"
              />
            </div>

            <div>
              <div className="input-with-toggle">
                <input
                  id="completePasswordInput"
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Пароль"
                  aria-label="Пароль"
                  value={password}
                  readOnly
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="input-toggle-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Сховати пароль" : "Показати пароль"
                  }
                  aria-pressed={showPassword}
                  title={showPassword ? "Сховати пароль" : "Показати пароль"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <input
                id="completeEmailInput"
                type="email"
                className={`form-control ${emailError ? "is-invalid" : ""}`}
                placeholder="Email"
                aria-label="Email"
                value={email}
                disabled={noEmail || loading}
                autoComplete="email"
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? "completeEmailError" : undefined}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
              />
              {emailError && (
                <div
                  id="completeEmailError"
                  className="invalid-feedback d-block"
                >
                  {emailError}
                </div>
              )}
            </div>

            <div className="form-check mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                id="completeNoEmail"
                checked={noEmail}
                disabled={loading}
                onChange={(e) => {
                  setNoEmail(e.target.checked);
                  setEmailError(null);
                }}
              />
              <label className="form-check-label" htmlFor="completeNoEmail">
                Не хочу залишати електронну пошту
              </label>
            </div>

            {captchaEnabled && (
              <div>
                <TurnstileWidget
                  ref={captchaRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onToken={(token) => {
                    setCaptchaToken(token);
                    if (token) setCaptchaError(false);
                  }}
                  onError={() => setCaptchaError(true)}
                />
                {captchaError && !captchaToken && (
                  <p
                    className="text-danger small text-center mb-0 mt-2"
                    role="alert"
                  >
                    Підтвердіть, що ви не робот
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitDisabled}
              className="btn btn-primary w-100"
            >
              {loading ? "Заходимо..." : "В чат"}
            </button>
          </div>

          <div className="auth-fields">
            <p className="auth-note text-start">
              Натискаючи «В чат», ви підтверджуєте, що вам виповнилося 18 років,
              і приймаєте{" "}
              <a
                href="#"
                data-bs-toggle="modal"
                data-bs-target={`#${RULES_MODAL_ID}`}
                onClick={(e) => e.preventDefault()}
              >
                Правила чату
              </a>
              . Для роботи сайту використовуються необхідні файли cookie —
              докладніше в{" "}
              <a
                href="#"
                data-bs-toggle="modal"
                data-bs-target={`#${COOKIES_MODAL_ID}`}
                onClick={(e) => e.preventDefault()}
              >
                Політиці cookie
              </a>
              .
            </p>
          </div>
        </div>
      </form>

      <RulesModal modalId={RULES_MODAL_ID} bare />
      <CookiesModal modalId={COOKIES_MODAL_ID} />
    </>
  );
}
