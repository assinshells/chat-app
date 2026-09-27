import { createPortal } from "react-dom";
import SimpleBar from "simplebar-react";

/**
 * WarningModal — модалка "Попередження" у футері сторінок авторизації
 * (AuthLayout.jsx). Той самий "безшапковий" патерн, що й
 * DeveloperModal/RoomSelectModal: .modal-header лишається технічно
 * (щоб data-bs-dismiss на хрестику коректно закривав модалку), але
 * візуально — без заголовка, рамки й фону (developer-modal-header),
 * лишається лише хрестик у кутку. Футера нема.
 *
 * Прокрутка (на випадок дрібних екранів) — через SimpleBar, той самий
 * патерн, що й у RulesModal.jsx/AuthLayout.jsx.
 *
 * Найважливіший з трьох лінків футера (Попередження / Правила /
 * Файли cookie) — вікове обмеження та застереження про особисту
 * безпеку користувач має побачити ще до реєстрації.
 */
export function WarningModal({ modalId = "warningModal" }) {
  return createPortal(
    <div
      className="modal fade"
      id={modalId}
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content app-modal">
          <div className="modal-header developer-modal-header">
            <button
              type="button"
              className="btn-close ms-auto"
              data-bs-dismiss="modal"
              aria-label="Закрити"
            />
          </div>

          <div className="modal-body rules-modal-body">
            <SimpleBar style={{ flex: "1 1 auto", minHeight: 0 }} autoHide={false}>
            <section className="rules-modal-section">
              <h6>Віковий ценз</h6>
              <p className="mb-0">
                Чат призначений виключно для повнолітніх користувачів
                віком від 18 років. Реєструючись, ви підтверджуєте, що
                вам виповнилося 18 років.
              </p>
            </section>

            <section className="rules-modal-section">
              <h6>Спілкування з незнайомими людьми</h6>
              <p>
                Ви спілкуєтесь з реальними, але незнайомими вам людьми.
                Адміністрація не перевіряє особу, вік і наміри інших
                користувачів та не гарантує достовірність інформації,
                яку вони про себе повідомляють.
              </p>
              <p className="mb-0">
                Будьте обережні з розкриттям особистих даних (адреса,
                телефон, фінансова інформація) і не поспішайте з довірою
                до незнайомих співрозмовників.
              </p>
            </section>

            <section className="rules-modal-section mb-0">
              <h6>Зустрічі та домовленості поза чатом</h6>
              <p>
                Чат є лише засобом онлайн-спілкування. Адміністрація не
                відповідає за домовленості, укладені поза платформою, і
                не несе відповідальності за наслідки особистих зустрічей
                з іншими користувачами.
              </p>
              <p className="mb-0">
                Перед особистою зустріччю, передачею грошей чи інших
                цінностей самостійно перевіряйте ризики та особу
                співрозмовника.
              </p>
            </section>
            </SimpleBar>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
