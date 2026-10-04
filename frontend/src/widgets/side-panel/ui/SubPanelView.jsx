import { ArrowLeft } from "lucide-react";

/**
 * SubPanelView — вкладена панель поверх бокової (.app-panel-overlay):
 * шапка з кнопкою "Назад" і заголовком + прокручуване тіло + необов'язковий
 * футер, закріплений унизу (напр. кнопка "Зберегти").
 * Використовується для "Друзі", "Заблоковані", "Темний режим".
 */
export function SubPanelView({ title, onBack, children, footer }) {
  return (
    <div className="app-panel-overlay" role="dialog" aria-label={title}>
      <div className="app-panel-header">
        <button
          type="button"
          className="chat-header-btn"
          title="Назад"
          aria-label="Назад"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
        </button>
        <h5 className="app-panel-title">{title}</h5>
      </div>

      <div className="app-panel-overlay-body">{children}</div>

      {footer && <div className="app-panel-overlay-footer">{footer}</div>}
    </div>
  );
}
