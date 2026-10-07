import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { fetchImageUrl } from "@shared/api/image.api.js";

/**
 * ImageLightbox — зображення на весь екран поверх усіх вікон (портал у
 * document.body, z-index вищий за сайдбар/модалки). Закривається
 * кліком по фону, кнопкою або Esc.
 */
export function ImageLightbox({ src, onClose, alt = "Вкладення", actions = null }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Зображення"
      onClick={onClose}
    >
      <button
        type="button"
        className="image-lightbox-close"
        title="Закрити"
        aria-label="Закрити"
        onClick={onClose}
      >
        <X size={22} />
      </button>
      {/* stopPropagation: клік по самій картинці не закриває вікно. */}
      <img
        className="image-lightbox-img"
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
      />
      {/* Необов'язкові кнопки під фото (наприклад "Схвалити"/"Видалити" в
          перевірці галереї); клік по панелі не закриває вікно. */}
      {actions && (
        <div className="image-lightbox-actions" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>,
    document.body,
  );
}

/**
 * ChatImageButton — "[показати зображення]" замість самої картинки в
 * стрічці. Клік завантажує файл (один раз, далі з кешу) і відкриває
 * ImageLightbox.
 */
export function ChatImageButton({ imageId }) {
  const [state, setState] = useState("idle"); // idle | loading | error
  const [src, setSrc] = useState(null);

  const handleClick = async () => {
    if (state === "loading") return;
    setState("loading");
    try {
      setSrc(await fetchImageUrl(imageId));
      setState("idle");
    } catch {
      setState("error");
    }
  };

  return (
    <>
      <button
        type="button"
        className={`chat-image-link ${state === "error" ? "is-error" : ""}`}
        onClick={handleClick}
        disabled={state === "loading"}
      >
        {state === "loading"
          ? "[завантаження…]"
          : state === "error"
            ? "[не вдалося завантажити — спробувати ще]"
            : "[показати зображення]"}
      </button>
      {src && <ImageLightbox src={src} onClose={() => setSrc(null)} />}
    </>
  );
}
