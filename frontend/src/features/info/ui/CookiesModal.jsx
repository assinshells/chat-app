import { createPortal } from "react-dom";
import SimpleBar from "simplebar-react";

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
            <section className="rules-modal-section mb-0">
              <h6>Технічні дані та cookie</h6>
              <p>
                Для роботи сервісу можуть використовуватися технічно
                необхідні cookie, local storage та інші механізми
                браузера. Вони застосовуються для:
              </p>
              <ul className="info-modal-list">
                <li>авторизації;</li>
                <li>підтримання сесії;</li>
                <li>забезпечення безпеки;</li>
                <li>запобігання зловживанням;</li>
                <li>збереження локальних налаштувань (наприклад, теми).</li>
              </ul>
              <p className="mb-0">
                Такі технічні механізми не призначені для рекламного або
                міжсайтового відстеження, якщо інше прямо не зазначено в
                окремих документах сервісу. Без них сервіс не зможе
                коректно працювати, тому їх не можна відключити окремо
                від використання чату.
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
