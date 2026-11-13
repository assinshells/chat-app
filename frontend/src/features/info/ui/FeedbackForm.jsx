import { useState } from "react";

const MAX_FEEDBACK_LENGTH = 300;

/**
 * FeedbackForm — форма зворотного зв'язку (Налаштування → Допомога →
 * Зворотний зв'язок).
 *
 * ВАЖЛИВО: бекенд для прийому звернень поки не реалізований — форма
 * зараз лише локальна заглушка (не робить жодного мережевого запиту).
 * Коли з'явиться ендпоінт (наприклад, POST /api/feedback), достатньо
 * замінити setTimeout нижче на реальний виклик і прокинути статус
 * помилки локальним станом форми.
 */
export function FeedbackForm() {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

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

  if (sent) {
    return (
      <p className="text-success mb-0">
        Дякуємо! Ваше повідомлення надіслано.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label
        htmlFor="feedbackText"
        className="mb-2 text-muted small d-block"
      >
        Розкажіть, що не працює або що варто покращити
      </label>

      <textarea
        id="feedbackText"
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
          className="btn btn-primary fw-bold"
          disabled={!text.trim() || sending}
        >
          {sending ? "Надсилаємо..." : "Надіслати"}
        </button>
      </div>
    </form>
  );
}
