import { createPortal } from "react-dom";
import SimpleBar from "simplebar-react";

import { CookiesContent } from "./CookiesContent.jsx";

/**
 * CookiesModal — модалка "Файли cookie" у футері сторінок авторизації
 * (AuthLayout.jsx). Той самий "безшапковий" патерн, що й
 * DeveloperModal/RoomSelectModal: .modal-header лишається технічно
 * (щоб data-bs-dismiss на хрестику коректно закривав модалку), але
 * візуально — без заголовка, рамки й фону (developer-modal-header),
 * лишається лише хрестик у кутку. Футера нема.
 *
 * Прокрутка (на випадок дрібних екранів) — через SimpleBar, той самий
 * патерн, що й у RulesModal.jsx/AuthLayout.jsx.
 *
 * Найменш "критичний" з трьох лінків футера (Попередження / Правила /
 * Файли cookie) — суто технічна інформація, тому йде останнім у
 * порядку важливості.
 */
export function CookiesModal({ modalId = "cookiesModal" }) {
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
              <CookiesContent />
            </SimpleBar>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
