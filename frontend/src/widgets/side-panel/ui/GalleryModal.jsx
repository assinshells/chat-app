import { useEffect, useState } from "react";
import { ChevronRight, Images, UserRound } from "lucide-react";

import { useAppModalStore } from "@shared/lib/appModalStore.js";
import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { useGalleryReviewStore } from "@shared/lib/galleryReviewStore.js";
import { useMediaQuery } from "@shared/lib/useMediaQuery.js";
import { AppScrollbar } from "@shared/ui/scrollbar";
import { SplitModal } from "@shared/ui/split-modal";
import { CommonGalleryPanel } from "./CommonGalleryPanel.jsx";
import { GalleryView } from "./GalleryView.jsx";

const SECTIONS = [
  { id: "common", label: "Загальна галерея", icon: Images },
  { id: "mine", label: "Мої фото", icon: UserRound },
];

/**
 * GalleryModal — модалка "Фотогалерея" (іконка в шапці): ліворуч розділи
 * ("Загальна галерея" і "Мої фото"), праворуч — вибраний розділ. На
 * десктопі одразу відкрито загальну галерею, на телефоні — спочатку
 * список розділів, а після вибору розділ із кнопкою "Назад".
 */
export function GalleryModal() {
  const open = useAppModalStore((state) => state.galleryOpen);
  const close = useAppModalStore((state) => state.closeGallery);

  const canReviewPhotos = useCurrentUserStore((state) => state.canReviewPhotos);
  const pendingPhotos = useGalleryReviewStore((state) => state.pendingCount);
  const refreshPendingPhotos = useGalleryReviewStore((state) => state.refresh);

  // Бейдж "чекає перевірки" — лише для тих, хто перевіряє. Оновлюємо
  // при монтуванні та щоразу, як галерею відкрили/закрили (дешевий запит).
  useEffect(() => {
    if (canReviewPhotos) refreshPendingPhotos();
  }, [canReviewPhotos, open, refreshPendingPhotos]);

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [selected, setSelected] = useState(null);

  // Вибір ще не робили: на десктопі показуємо першу (загальну) галерею.
  const activeId = selected ?? (isDesktop ? SECTIONS[0].id : null);
  const current = SECTIONS.find((section) => section.id === activeId);

  const handleClose = () => {
    setSelected(null);
    close();
  };
  const handleBack = () => setSelected(null);

  const list = (
    <AppScrollbar className="split-modal-nav">
      {SECTIONS.map(({ id, label, icon: ItemIcon }) => (
        <button
          key={id}
          type="button"
          className={`app-sidebar-theme-btn${id === activeId ? " is-active" : ""}`}
          aria-current={id === activeId ? "true" : undefined}
          onClick={() => setSelected(id)}
        >
          <ItemIcon size={18} />
          <span>{label}</span>
          {id === "common" && canReviewPhotos && pendingPhotos > 0 && (
            <span className="badge bg-danger ms-auto">
              {pendingPhotos > 99 ? "99+" : pendingPhotos}
            </span>
          )}
          <ChevronRight
            size={16}
            className={id === "common" && canReviewPhotos && pendingPhotos > 0 ? "" : "ms-auto"}
          />
        </button>
      ))}
    </AppScrollbar>
  );

  return (
    <SplitModal
      open={open}
      onClose={handleClose}
      listTitle="Фотогалерея"
      list={list}
      hasDetail={Boolean(current)}
      onBack={handleBack}
      detailTitle={current?.label}
      placeholder={null}
    >
      {activeId === "common" && (
        <AppScrollbar>
          <CommonGalleryPanel />
        </AppScrollbar>
      )}
      {activeId === "mine" && <GalleryView key={activeId} onBack={handleBack} />}
    </SplitModal>
  );
}
