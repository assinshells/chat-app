import { createPortal } from "react-dom";

/**
 * SafetyWarningModal — окрема модалка з попередженням про безпеку,
 * навмисно відокремлена від RulesModal (правила поведінки в чаті —
 * це інша тема, ніж ризики офлайн-контактів). Той самий патерн, що й
 * інші модалки проєкту: Bootstrap (data-bs-toggle/data-bs-target),
 * рендер через портал у document.body.
 */
export function SafetyWarningModal({ modalId = "safetyWarningModal" }) {
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
              Попередження про безпеку
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Закрити"
            />
          </div>

          <div className="modal-body">
            <p>
              Цей чат — лише майданчик для спілкування в інтернеті.
              Адміністрація не несе відповідальності за наслідки будь-яких
              домовленостей чи контактів, які виникли тут, але відбулися поза
              чатом — зокрема за офлайн-зустрічі з іншими користувачами.
            </p>
            <p className="mb-0">
              Будьте обачні: не поспішайте ділитися особистими даними
              (адресою, номером телефону, фінансовою інформацією) і критично
              ставтеся до людей, яких зустріли лише онлайн. Якщо все ж
              домовляєтеся про зустріч у реальному житті — обирайте людне
              місце та попередьте когось із близьких, куди і з ким ви йдете.
            </p>
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