import { createPortal } from "react-dom";

/**
 * RulesModal — статична модалка з правилами чату.
 * Відкривається за посиланням "Правила" у футері сайдбара (див.
 * Sidebar.jsx), той самий патерн, що й SettingsModal/LogoutConfirmModal:
 * Bootstrap-модалка (data-bs-toggle/data-bs-target), рендер через портал
 * у document.body, щоб не потрапити в піддерево сайдбара з
 * transform/overflow:hidden.
 *
 * Текст правил — поки що заглушка (контент можна узгодити й замінити
 * пізніше), сама модалка вже повністю робоча.
 */
export function RulesModal({ modalId = "rulesModal" }) {
  return createPortal(
    <div
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
              Правила чату
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Закрити"
            />
          </div>

          <div className="modal-body">
            <ol className="info-modal-list mb-0">
              <li>Поважайте інших учасників — образи, погрози й цькування заборонені.</li>
              <li>Не публікуйте спам, рекламу та посилання без потреби.</li>
              <li>Заборонено контент, що стосується неповнолітніх, насильства чи дискримінації.</li>
              <li>Одне повідомлення — одна думка: не діліть текст на десятки коротких повідомлень поспіль.</li>
              <li>Модератори мають право попереджати, заглушувати або блокувати за порушення цих правил.</li>
            </ol>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary rounded-4 fw-bold"
              data-bs-dismiss="modal"
            >
              Зрозуміло
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
