import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";

/**
 * LogoutConfirmModal — Bootstrap-модалка підтвердження виходу з акаунту.
 * Відкривається через data-bs-toggle="modal" / data-bs-target={`#${modalId}`}
 * (див. Sidebar.jsx). Сам логаут виконується в onConfirm — модалка нічого
 * не знає про useLogoutStore/AuthSession, лише просить підтвердження.
 *
 * Рендериться через портал у document.body з тієї самої причини, що й
 * SettingsModal: якщо залишити її звичайним React-child всередині
 * .app-sidebar, вона потрапить у піддерево з transform/overflow:hidden і
 * буде або обрізана, або зміщена відносно згорнутого сайдбара замість екрана.
 */
export function LogoutConfirmModal({ modalId = "logoutConfirmModal", onConfirm }) {
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
              Вийти з акаунту
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Закрити"
            />
          </div>

          <div className="modal-body">
            <p className="mb-0 text-muted">
              Ви впевнені, що хочете вийти? Доведеться увійти знову, щоб
              продовжити спілкування.
            </p>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary rounded-4 fw-bold"
              data-bs-dismiss="modal"
            >
              Скасувати
            </button>

            <button
              type="button"
              className="btn btn-danger rounded-4 fw-bold"
              data-bs-dismiss="modal"
              onClick={onConfirm}
            >
              <LogOut size={16} strokeWidth={2} className="me-2" />
              Вийти
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}