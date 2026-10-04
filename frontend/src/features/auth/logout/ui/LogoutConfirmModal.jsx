import { createPortal } from "react-dom";

/**
 * LogoutConfirmModal — Bootstrap-модалка підтвердження виходу з акаунту.
 * Відкривається через data-bs-toggle="modal" / data-bs-target={`#${modalId}`}
 * (див. SideMenu.jsx — дропдаун профілю). Сам логаут виконується в onConfirm — модалка нічого
 * не знає про useLogoutStore/AuthSession, лише просить підтвердження.
 *
 * Small-модалка без шапки (ні заголовка, ні хрестика); кнопки в футері
 * розтягнуті на всю ширину порівну. Закрити можна кнопкою "Скасувати".
 *
 * Рендериться через портал у document.body: якщо залишити її звичайним
 * React-child всередині сайдбара, вона потрапить у піддерево з
 * transform/overflow:hidden і буде або обрізана, або зміщена відносно
 * сайдбара замість екрана.
 */
export function LogoutConfirmModal({ modalId = "logoutConfirmModal", onConfirm }) {
  return createPortal(
    <div
      className="modal fade"
      id={modalId}
      tabIndex="-1"
      aria-labelledby={`${modalId}Text`}
      aria-hidden="true"
      data-bs-backdrop="static"
    >
      <div className="modal-dialog modal-sm modal-dialog-centered">
        <div className="modal-content app-modal">
          <div className="modal-body">
            <p className="mb-0 text-muted text-center" id={`${modalId}Text`}>
              Ви впевнені, що хочете вийти? Доведеться увійти знову, щоб
              продовжити спілкування.
            </p>
          </div>

          <div className="modal-footer flex-nowrap">
            <button
              type="button"
              className="btn btn-secondary fw-bold flex-fill"
              data-bs-dismiss="modal"
            >
              Скасувати
            </button>

            <button
              type="button"
              className="btn btn-danger fw-bold flex-fill"
              data-bs-dismiss="modal"
              onClick={onConfirm}
            >
              Вийти
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
