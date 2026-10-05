import { useEffect } from "react";
import { createPortal } from "react-dom";

import { useBlockStore } from "@features/block/model/useBlockStore.js";

/**
 * BlockConfirmModal — мала модалка підтвердження блокування (замість
 * системного window.confirm). Відкривається, коли в useBlockStore
 * з'являється pendingLogin (див. DmTriggerButton -> "Заблокувати");
 * рендериться один раз у ChatLayout.
 *
 * Той самий вигляд, що й LogoutConfirmModal (small, без шапки, кнопки
 * на всю ширину), але керується станом React, а не data-атрибутами
 * Bootstrap — відкриття йде з обробника меню, а не з кліку по
 * data-bs-toggle. Escape закриває модалку; клік повз неї — ні
 * (як і в інших модалках з static-фоном).
 *
 * onBlocked(login) — після успішного натискання "Заблокувати"
 * (ChatLayout прибирає цей нік із форми повідомлення).
 */
export function BlockConfirmModal({ onBlocked }) {
  const pendingLogin = useBlockStore((state) => state.pendingLogin);
  const cancelBlock = useBlockStore((state) => state.cancelBlock);
  const blockUser = useBlockStore((state) => state.blockUser);

  useEffect(() => {
    if (!pendingLogin) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") cancelBlock();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("modal-open");

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [pendingLogin, cancelBlock]);

  if (!pendingLogin) return null;

  const handleConfirm = () => {
    const login = pendingLogin;
    cancelBlock();
    blockUser(login);
    onBlocked?.(login);
  };

  return createPortal(
    <>
      <div className="modal-backdrop fade show" />
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blockConfirmText"
      >
        <div className="modal-dialog modal-sm modal-dialog-centered">
          <div className="modal-content app-modal">
            <div className="modal-body">
              <p className="mb-0 text-muted text-center" id="blockConfirmText">
                Заблокувати користувача <strong>{pendingLogin}</strong>? Він
                зникне з чату та не зможе писати вам особисті повідомлення.
              </p>
            </div>

            <div className="modal-footer flex-nowrap">
              <button
                type="button"
                className="btn btn-secondary fw-bold flex-fill"
                onClick={cancelBlock}
              >
                Скасувати
              </button>

              <button
                type="button"
                className="btn btn-danger fw-bold flex-fill"
                onClick={handleConfirm}
              >
                Заблокувати
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
