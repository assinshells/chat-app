import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MAX_FEEDBACK_LENGTH = 500;

/**
 * FeedbackModal — модалка зворотного зв'язку, відкривається за
 * посиланням у футері сайдбара (див. Sidebar.jsx), той самий патерн
 * порталу/Bootstrap-модалки, що й RulesModal/SettingsModal.
 *
 * ВАЖЛИВО: бекенд для прийому звернень поки не реалізований — форма
 * зараз лише локальна заглушка (не робить жодного мережевого запиту),
 * щоб інтерфейс можна було показати користувачу вже зараз. Коли з'явиться
 * ендпоінт (наприклад, POST /api/feedback), достатньо замінити
 * setTimeout нижче на реальний виклик і прокинути статус
 * завантаження/помилки так само, як це зроблено в SettingsModal.
 */
export function FeedbackModal({ modalId = "feedbackModal" }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const modalRef = useRef(null);

  // Скидаємо статус "надіслано" лише після того, як модалку реально
  // закрили (а не одразу після відправлення) — так повідомлення про
  // успіх встигає побачити око, а не зникає миттєво разом з формою.
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return undefined;

    const handleHidden = () => setSent(false);
    el.addEventListener("hidden.bs.modal", handleHidden);
    return () => el.removeEventListener("hidden.bs.modal", handleHidden);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    // Заглушка замість реального запиту (див. коментар вище).
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setText("");
    }, 400);
  };

  return createPortal(
    <div
      ref={modalRef}
      className="modal fade"
      id={modalId}
      tabIndex="-1"
      aria-labelledby={`${modalId}Label`}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content settings-modal">
          <div className="modal-header">
            <h5 className="modal-title" id={`${modalId}Label`}>
              Зворотний зв&apos;язок
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Закрити"
            />
          </div>

          <div className="modal-body">
            {sent ? (
              <p className="text-success mb-0">
                Дякуємо! Ваше повідомлення надіслано.
              </p>
            ) : (
              <form onSubmit={handleSubmit}>
                <label className="mb-2 text-muted small d-block">
                  Розкажіть, що не працює або що варто покращити
                </label>

                <textarea
                  className="form-control"
                  rows={4}
                  maxLength={MAX_FEEDBACK_LENGTH}
                  placeholder="Ваше повідомлення..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />

                <div className="d-flex justify-content-between align-items-center mt-2">
                  <span className="chat-character-count">
                    {text.length}/{MAX_FEEDBACK_LENGTH}
                  </span>

                  <button
                    type="submit"
                    className="btn btn-primary rounded-4 fw-bold"
                    disabled={!text.trim() || sending}
                  >
                    {sending ? "Надсилаємо..." : "Надіслати"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
