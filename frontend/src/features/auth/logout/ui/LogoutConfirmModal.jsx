import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";

/**
 * LogoutConfirmModal — Bootstrap-модалка подтверждения выхода из аккаунта.
 * Открывается по data-bs-toggle="modal" / data-bs-target={`#${modalId}`}
 * (см. Sidebar.jsx). Сам логаут выполняется в onConfirm — модалка ничего
 * не знает про useLogoutStore/AuthSession, только просит подтверждение.
 *
 * Рендерится через портал в document.body по той же причине, что и
 * SettingsModal: если оставить её обычным React-child внутри .app-sidebar,
 * она попадёт в поддерево с transform/overflow:hidden и будет либо
 * обрезана, либо смещена относительно свёрнутого сайдбара вместо экрана.
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