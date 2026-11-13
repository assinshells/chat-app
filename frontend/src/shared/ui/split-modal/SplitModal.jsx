import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";

// Скільки split-модалок відкрито зараз: клас modal-open на body
// знімаємо лише коли закрилась остання.
let openModals = 0;

/**
 * SplitModal — спільна оболонка модалок «список ліворуч / вміст праворуч»
 * (особисті повідомлення, налаштування, фотогалерея).
 *
 * Десктоп: дві колонки — список (list) і вміст (children); поки вміст не
 * обрано (hasDetail=false) праворуч показується placeholder.
 * Телефон (< 768px): модалка на весь екран і видно лише одну колонку:
 * спочатку список, після вибору (hasDetail) — вміст із кнопкою "Назад"
 * (onBack), яка повертає до списку. Усе керується прапорцем hasDetail
 * (див. .has-detail у _split-modal.css).
 *
 * Це React-кероване Bootstrap-оформлення (.modal.show + .modal-backdrop),
 * а не data-bs-* / Modal API: модалки відкриваються програмно з кількох
 * місць, а стан живе в сторах. Рендериться порталом у document.body.
 *
 * Вкладені панелі налаштувань/галереї (.app-panel-overlay) лягають
 * поверх .split-modal-body; їхня власна шапка верхнього рівня ховається
 * (її роль виконує шапка модалки), див. _split-modal.css.
 */
export function SplitModal({
  open,
  onClose,
  listTitle,
  list,
  detailTitle,
  detailTitleStyle,
  hasDetail,
  onBack,
  placeholder,
  children,
}) {
  const titleId = useId();
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (e) => {
      if (e.key !== "Escape") return;
      // Поверх може бути Bootstrap-модалка (напр. вибір кольору) —
      // Escape належить їй, а не нам.
      if (document.querySelector(".modal.show:not(.split-modal)")) return;
      onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    openModals += 1;
    document.body.classList.add("modal-open");
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      openModals -= 1;
      if (openModals === 0) document.body.classList.remove("modal-open");
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="modal-backdrop show" />
      <div
        ref={dialogRef}
        className="modal show d-block split-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex="-1"
        onMouseDown={(e) => {
          // Клік по затемненню поза вікном закриває модалку.
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="modal-dialog modal-dialog-centered split-modal-dialog">
          <div className="modal-content app-modal split-modal-content">
            <div className={`split-modal-layout${hasDetail ? " has-detail" : ""}`}>
              <aside className="split-modal-sidebar">
                <div className="split-modal-header">
                  <h5 className="split-modal-title" id={titleId}>
                    {listTitle}
                  </h5>
                  {/* Праворуч у шапці вмісту на десктопі є свій хрестик;
                      цей потрібен на телефоні, де видно лише список. */}
                  <button
                    type="button"
                    className="chat-header-btn split-modal-close split-modal-close-list"
                    aria-label="Закрити"
                    title="Закрити"
                    onClick={onClose}
                  >
                    <X size={20} />
                  </button>
                </div>
                {list}
              </aside>

              <section className="split-modal-main">
                <div className="split-modal-header">
                  {hasDetail && (
                    <button
                      type="button"
                      className="chat-header-btn split-modal-back"
                      aria-label="Назад до списку"
                      title="Назад"
                      onClick={onBack}
                    >
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  <h5 className="split-modal-title" style={detailTitleStyle}>
                    {hasDetail ? detailTitle : ""}
                  </h5>
                  <button
                    type="button"
                    className="chat-header-btn split-modal-close"
                    aria-label="Закрити"
                    title="Закрити"
                    onClick={onClose}
                  >
                    <X size={20} />
                  </button>
                </div>

                {hasDetail ? (
                  <div className="split-modal-body">{children}</div>
                ) : (
                  <div className="split-modal-placeholder">{placeholder}</div>
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
