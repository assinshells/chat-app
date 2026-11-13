import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, MessageCircle, X } from "lucide-react";

import { useDmStore } from "@features/dm";
import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";
import { DialogsList } from "./PrivateMessagesPanel.jsx";
import { PrivateChat } from "./PrivateChat.jsx";

/**
 * PrivateMessagesModal — модалка особистих повідомлень.
 *
 * Десктоп: ліворуч список діалогів, праворуч листування (поки діалог
 * не обрано — заглушка).
 * Телефон: спочатку лише список; вибір діалогу відкриває листування
 * на весь екран модалки, кнопка "Назад" повертає до списку. Окремого
 * стану для цього нема: все визначає useDmStore.panelLogin
 * (див. .has-chat в _dm-modal.css).
 *
 * Це React-кероване Bootstrap-оформлення (.modal.show + .modal-backdrop),
 * а не data-bs-* / Modal API: відкривається програмно з кількох місць
 * (іконка в шапці, меню біля ніка, тост), а стан живе в сторі.
 * Рендериться порталом у document.body — так само, як інші модалки.
 */
export function PrivateMessagesModal() {
  const modalOpen = useDmStore((state) => state.modalOpen);
  const closeModal = useDmStore((state) => state.closeModal);
  const closeConversation = useDmStore((state) => state.closeConversation);
  const login = useDmStore((state) => state.panelLogin);
  const color = useDmStore((state) =>
    state.panelLogin ? state.conversations[state.panelLogin]?.color : null,
  );
  const isDarkTheme = useIsDarkTheme();

  // Escape закриває модалку; блокуємо прокрутку сторінки під нею.
  useEffect(() => {
    if (!modalOpen) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("modal-open");

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [modalOpen, closeModal]);

  if (!modalOpen) return null;

  return createPortal(
    <>
      <div className="modal-backdrop show" />
      <div
        className="modal show d-block dm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dmModalTitle"
        tabIndex="-1"
        onMouseDown={(e) => {
          // Клік по затемненню поза вікном закриває модалку.
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered dm-modal-dialog">
          <div className="modal-content app-modal dm-modal-content">
            <div className={`dm-modal-layout${login ? " has-chat" : ""}`}>
              <aside className="dm-modal-sidebar">
                <div className="dm-modal-header">
                  <h5 className="dm-modal-title" id="dmModalTitle">
                    Особисті повідомлення
                  </h5>
                  {/* Праворуч у шапці листування на десктопі є свій
                      хрестик; цей потрібен на телефоні, де видно лише
                      список. */}
                  <button
                    type="button"
                    className="chat-header-btn dm-modal-close dm-modal-close-list"
                    aria-label="Закрити"
                    title="Закрити"
                    onClick={closeModal}
                  >
                    <X size={20} />
                  </button>
                </div>
                <DialogsList />
              </aside>

              <section className="dm-modal-main">
                <div className="dm-modal-header">
                  {login && (
                    <button
                      type="button"
                      className="chat-header-btn dm-modal-back"
                      aria-label="Назад до списку діалогів"
                      title="Назад"
                      onClick={closeConversation}
                    >
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  <h5
                    className="dm-modal-title"
                    style={
                      login
                        ? { color: getEffectiveColorHex(color, isDarkTheme) }
                        : undefined
                    }
                  >
                    {login ?? ""}
                  </h5>
                  <button
                    type="button"
                    className="chat-header-btn dm-modal-close"
                    aria-label="Закрити"
                    title="Закрити"
                    onClick={closeModal}
                  >
                    <X size={20} />
                  </button>
                </div>

                {login ? (
                  <PrivateChat key={login} login={login} />
                ) : (
                  <div className="dm-modal-placeholder">
                    <MessageCircle size={36} />
                    <p className="mb-0">Оберіть діалог зі списку</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
