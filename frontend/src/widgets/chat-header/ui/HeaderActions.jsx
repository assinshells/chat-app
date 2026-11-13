import { Images, Settings } from "lucide-react";

import { DmHeaderButton } from "@features/dm";
import { useAppModalStore } from "@shared/lib/appModalStore.js";
import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { useGalleryReviewStore } from "@shared/lib/galleryReviewStore.js";

/**
 * HeaderActions — іконки модалок у шапці: особисті повідомлення,
 * фотогалерея (з бейджем "чекає перевірки" для тих, хто перевіряє) і
 * налаштування. Використовується в шапці чату і (на телефоні) в шапці
 * списків, де шапки чату немає.
 */
export function HeaderActions({ className = "" }) {
  const galleryOpen = useAppModalStore((state) => state.galleryOpen);
  const settingsOpen = useAppModalStore((state) => state.settingsOpen);
  const openGallery = useAppModalStore((state) => state.openGallery);
  const openSettings = useAppModalStore((state) => state.openSettings);

  const canReviewPhotos = useCurrentUserStore((state) => state.canReviewPhotos);
  const pendingPhotos = useGalleryReviewStore((state) => state.pendingCount);
  const badge = canReviewPhotos ? pendingPhotos : 0;

  return (
    <div className={`chat-header-actions ${className}`.trim()}>
      <DmHeaderButton />

      <button
        type="button"
        className={`chat-header-btn chat-header-gallery${galleryOpen ? " is-active" : ""}`}
        title="Фотогалерея"
        aria-label={badge > 0 ? `Фотогалерея, на перевірці: ${badge}` : "Фотогалерея"}
        aria-haspopup="dialog"
        onClick={openGallery}
      >
        <Images size={20} />
        {badge > 0 && (
          <span className="chat-header-badge badge rounded-pill bg-danger">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </button>

      <button
        type="button"
        className={`chat-header-btn${settingsOpen ? " is-active" : ""}`}
        title="Налаштування"
        aria-label="Налаштування"
        aria-haspopup="dialog"
        onClick={openSettings}
      >
        <Settings size={20} />
      </button>
    </div>
  );
}
