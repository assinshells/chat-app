import { createPortal } from "react-dom";
import { Heart } from "lucide-react";

/**
 * DeveloperModal — модалка, що відкривається за посиланням
 * "Розробники" у футері сторінок авторизації (AuthLayout.jsx). Той
 * самий патерн порталу/Bootstrap-модалки, що й RulesModal /
 * FeedbackModal — саме тому кнопка закриття лежить у справжньому
 * .modal-header (це гарантує коректну роботу data-bs-dismiss так
 * само, як і в інших модалках застосунку). Візуально шапки нема:
 * без заголовка, рамки й фону (.developer-modal-header в
 * _modals.css), лишається тільки хрестик у кутку. Футера нема
 * взагалі — під контентом одразу закінчується модалка.
 *
 * Текст і стилі ("Programmed by ♥ E.Thompson") перенесені сюди з
 * футера AuthLayout.jsx без змін.
 */
export function DeveloperModal({ modalId = "developerModal" }) {
  return createPortal(
    <div
      className="modal fade"
      id={modalId}
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content app-modal">
          <div className="modal-header developer-modal-header">
            <button
              type="button"
              className="btn-close ms-auto"
              data-bs-dismiss="modal"
              aria-label="Закрити"
            />
          </div>
          <div className="modal-body text-center pt-0 pb-5">
            <p className="mb-0">
              Programmed by{" "}
              <Heart
                className="text-danger footer-icon"
                size="1em"
                fill="currentColor"
              />{" "}
              E.Thompson.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}