import { createPortal } from "react-dom";
import SimpleBar from "simplebar-react";

import { RulesContent } from "./RulesContent.jsx";

/**
 * RulesModal — статична модалка з правилами чату.
 * Відкривається за посиланням "Правила" у футері сайдбара (див.
 * SideMenu.jsx), той самий патерн, що й LogoutConfirmModal:
 * Bootstrap-модалка (data-bs-toggle/data-bs-target), рендер через портал
 * у document.body, щоб не потрапити в піддерево сайдбара з
 * transform/overflow:hidden.
 *
 * Повний текст правил (узгоджена редакція). Діалог зроблено ширшим
 * (modal-lg). Прокрутка — через SimpleBar (той самий компонент, що й у
 * AuthLayout.jsx), а не нативний overflow браузера: .rules-modal-body
 * лишається як flex-item з обмеженою modal-dialog-scrollable висотою
 * (max-height рахується від висоти вʼюпорту), але сам скрол і його
 * вигляд віддані SimpleBar (див. .rules-modal-body в _modals.css —
 * overflow: hidden, щоб не було подвійного скролбару).
 *
 * Пропс `bare`: використовується для лінка "Правила" у футері
 * сторінок авторизації (AuthLayout.jsx), де модалка має бути без
 * заголовка й футера — той самий "безшапковий" патерн, що й
 * DeveloperModal/RoomSelectModal (.modal-header лишається технічно
 * заради коректного data-bs-dismiss на хрестику, але візуально
 * порожній, кнопки "Зрозуміло" нема). У сайдбарі (старому сайдбару)
 * і на сторінці завершення реєстрації (CompleteRegistrationForm.jsx) модалка й далі
 * монтується у звичайному вигляді — bare там не передається.
 */
export function RulesModal({ modalId = "rulesModal", bare = false }) {
  return createPortal(
    <div
      className="modal fade"
      id={modalId}
      tabIndex="-1"
      aria-labelledby={bare ? undefined : `${modalId}Label`}
      aria-hidden="true"
      data-bs-backdrop="static"
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
        <div className="modal-content app-modal">
          {bare ? (
            <div className="modal-header developer-modal-header">
              <button
                type="button"
                className="btn-close ms-auto"
                data-bs-dismiss="modal"
                aria-label="Закрити"
              />
            </div>
          ) : (
            <div className="modal-header">
              <h5 className="modal-title" id={`${modalId}Label`}>
                Правила користування чатом
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Закрити"
              />
            </div>
          )}

          <div className="modal-body rules-modal-body">
            <SimpleBar style={{ flex: "1 1 auto", minHeight: 0 }} autoHide={false}>
              <RulesContent />
            </SimpleBar>
          </div>

          {!bare && (
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary fw-bold"
                data-bs-dismiss="modal"
              >
                Зрозуміло
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}