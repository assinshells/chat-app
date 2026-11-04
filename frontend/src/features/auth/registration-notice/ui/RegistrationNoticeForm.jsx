import { useState } from "react";
import { RulesModal } from "@features/info/ui/RulesModal.jsx";
import { CookiesModal } from "@features/info/ui/CookiesModal.jsx";

const RULES_MODAL_ID = "registrationNoticeRulesModal";
const COOKIES_MODAL_ID = "registrationNoticeCookiesModal";

/**
 * RegistrationNoticeForm — проміжний крок між входом і завершенням
 * реєстрації: попередження (18+, Правила чату, cookie), чекбокс
 * «Прочитав(ла) і приймаю» та кнопка «Продовжити». Кнопка активна
 * лише коли чекбокс позначено.
 */
export function RegistrationNoticeForm({ onContinue }) {
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!accepted) return;
    onContinue();
  };

  return (
    <>
      <form onSubmit={handleSubmit} role="form" className="auth-form">
        <div className="auth-stack">
          <div className="auth-fields">
            <p className="auth-note text-start">
              Продовжуючи, ви підтверджуєте, що вам виповнилося 18 років, і
              приймаєте{" "}
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

            <div className="form-check mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                id="registrationNoticeAccept"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <label
                className="form-check-label"
                htmlFor="registrationNoticeAccept"
              >
                Прочитав(ла), приймаю
              </label>
            </div>

            <button
              type="submit"
              disabled={!accepted}
              className="btn btn-primary w-100"
            >
              Продовжити
            </button>
          </div>
        </div>
      </form>

      <RulesModal modalId={RULES_MODAL_ID} bare />
      <CookiesModal modalId={COOKIES_MODAL_ID} />
    </>
  );
}
