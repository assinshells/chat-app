import { User } from "lucide-react";

import { APP_NAME } from "@shared/constants/auth.constants.js";

/**
 * ChatHeader — шапка основної області: назва поточної кімнати (або
 * співрозмовника, якщо відкрито приватний діалог), статус з'єднання і
 * кнопка показу панелі профілю справа.
 *
 * Навмисно не тримає жодних модалок і жодного стану. Усе, що раніше
 * висіло тут, переїхало туди, де для нього вже є місце, щоб не
 * дублювати одні й ті самі дії у двох точках інтерфейсу:
 *  - особисті повідомлення (іконка "Пошта" + модалка) — таб "Приватні
 *    повідомлення" в рейці зліва, листування відкривається прямо в
 *    основній області (@widgets/private-chat);
 *  - вибір теми — таб "Налаштування" того ж сайдбара;
 *  - вихід з акаунту (з підтвердженням) — дропдаун профілю в рейці
 *    (@widgets/side-menu).
 */
export function ChatHeader({ title, online, onOpenProfile }) {
  return (
    <header className="chat-header">
      <div className="chat-header-inner">
        <div className="chat-header-start">
          <div className="chat-brand">
            <div className="chat-brand-info">
              <h5 className="chat-brand-title">{title || APP_NAME}</h5>

              <span
                className={`chat-brand-status ${online ? "is-online" : "is-offline"}`}
              >
                {online ? "Онлайн" : "Підключення…"}
              </span>
            </div>
          </div>
        </div>

        <div className="chat-header-actions">
          <button
            type="button"
            className="chat-header-btn user-profile-show"
            title="Профіль"
            aria-label="Показати профіль"
            onClick={onOpenProfile}
          >
            <User size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
