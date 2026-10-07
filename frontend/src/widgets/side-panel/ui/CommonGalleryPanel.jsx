import { useEffect, useState } from "react";
import { Check, Search, Trash2, X } from "lucide-react";

import {
  approveGalleryPhoto,
  deleteGalleryPhoto,
  fetchGalleryPhotoUrl,
  fetchPublicGallery,
  fetchReviewGallery,
} from "@shared/api/gallery.api.js";
import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { useGalleryReviewStore } from "@shared/lib/galleryReviewStore.js";
import { ImageLightbox } from "@shared/ui/image-viewer";

import { GalleryThumb } from "./GalleryThumb.jsx";

const MODE_APPROVED = "approved";
const MODE_PENDING = "pending";

// Скільки чекаємо після останнього натискання клавіші, перш ніж шукати.
const SEARCH_DEBOUNCE_MS = 350;
// Дзеркалить backend GALLERY_SEARCH_MAX_LENGTH (довший нік неможливий).
const SEARCH_MAX_LENGTH = 32;

const fetchFeedPage = (mode, before, query) =>
  mode === MODE_PENDING
    ? fetchReviewGallery({ before, query })
    : fetchPublicGallery({ before, query });

/**
 * GalleryFeed — сітка фото ВСІХ користувачів: схвалені (усім) або
 * непроверені (лише тим, хто перевіряє). Нові першими, "Показати ще" —
 * наступна сторінка. Клік по прев'ю відкриває фото на весь екран.
 * query — пошук за ніком автора (змінюється разом з key у батька, тож
 * стрічка просто завантажується заново).
 * Хто перевіряє: у черзі — "Схвалити" і "Видалити" (на плитці й у
 * повноекранному перегляді), у загальній — "Видалити".
 */
function GalleryFeed({ mode, canReview, query }) {
  const setPendingCount = useGalleryReviewStore((state) => state.setPendingCount);
  const adjustPending = useGalleryReviewStore((state) => state.adjust);

  const [photos, setPhotos] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [loadingMore, setLoadingMore] = useState(false);
  const [notice, setNotice] = useState(null);

  const [openingId, setOpeningId] = useState(null);
  const [viewer, setViewer] = useState(null); // { photo, src }
  const [busyId, setBusyId] = useState(null);

  const applyFirstPage = (data) => {
    setPhotos(data.photos);
    setHasMore(data.hasMore);
    setStatus("ready");
    if (mode === MODE_PENDING) setPendingCount(data.pendingCount);
  };

  useEffect(() => {
    let cancelled = false;
    fetchFeedPage(mode, undefined, query)
      .then((data) => {
        if (cancelled) return;
        setPhotos(data.photos);
        setHasMore(data.hasMore);
        setStatus("ready");
        if (mode === MODE_PENDING) setPendingCount(data.pendingCount);
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [mode, query, setPendingCount]);

  const reload = () => {
    setStatus("loading");
    fetchFeedPage(mode, undefined, query)
      .then(applyFirstPage)
      .catch(() => setStatus("error"));
  };

  const handleLoadMore = async () => {
    if (loadingMore || photos.length === 0) return;
    setLoadingMore(true);
    setNotice(null);
    try {
      const data = await fetchFeedPage(mode, photos[photos.length - 1].id, query);
      // Сторінки йдуть за id, але між запитами список міг змінитись
      // (схвалили/видалили) — відсікаємо дублі за id.
      setPhotos((prev) => {
        const known = new Set(prev.map((photo) => photo.id));
        return [...prev, ...data.photos.filter((photo) => !known.has(photo.id))];
      });
      setHasMore(data.hasMore);
    } catch {
      setNotice("Не вдалося завантажити наступні фото");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleOpen = async (photo) => {
    if (openingId) return;
    setNotice(null);
    setOpeningId(photo.id);
    try {
      setViewer({ photo, src: await fetchGalleryPhotoUrl(photo.id) });
    } catch {
      setNotice("Не вдалося завантажити фото. Спробуйте ще раз");
    } finally {
      setOpeningId(null);
    }
  };

  const dropPhoto = (id) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
    setViewer((current) => (current?.photo.id === id ? null : current));
  };

  const handleApprove = async (photo) => {
    if (busyId) return;
    setNotice(null);
    setBusyId(photo.id);
    try {
      await approveGalleryPhoto(photo.id);
      dropPhoto(photo.id);
      adjustPending(-1);
    } catch (err) {
      setNotice(err.message || "Не вдалося схвалити фото");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (photo) => {
    if (busyId) return;
    if (!window.confirm("Видалити це фото назавжди?")) return;
    setNotice(null);
    setBusyId(photo.id);
    try {
      await deleteGalleryPhoto(photo.id);
      dropPhoto(photo.id);
      if (mode === MODE_PENDING) adjustPending(-1);
    } catch (err) {
      setNotice(err.message || "Не вдалося видалити фото");
    } finally {
      setBusyId(null);
    }
  };

  let emptyText;
  if (query) emptyText = `Нічого не знайдено за ніком «${query}»`;
  else if (mode === MODE_PENDING) emptyText = "Немає фото, що чекають перевірки";
  else emptyText = "У галереї поки немає фото";

  return (
    <>
      {notice && (
        <div className="alert alert-danger mx-3 mt-3 py-2" role="alert">
          {notice}
        </div>
      )}

      {status === "loading" && (
        <div className="gallery-state">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Завантаження…
        </div>
      )}

      {status === "error" && (
        <div className="gallery-state">
          Не вдалося завантажити галерею.{" "}
          <button type="button" className="btn btn-link p-0 align-baseline" onClick={reload}>
            Спробувати ще
          </button>
        </div>
      )}

      {status === "ready" && photos.length === 0 && (
        <div className="gallery-state">{emptyText}</div>
      )}

      {status === "ready" && photos.length > 0 && (
        <>
          <ul className="gallery-grid gallery-grid-feed">
            {photos.map((photo) => (
              <li key={photo.id} className="gallery-tile">
                <button
                  type="button"
                  className="gallery-tile-open"
                  aria-label={`Відкрити фото користувача ${photo.owner.login}`}
                  disabled={openingId === photo.id}
                  onClick={() => handleOpen(photo)}
                >
                  <GalleryThumb id={photo.id} />
                  <span className="gallery-tile-author" title={photo.owner.login}>
                    {photo.owner.login}
                  </span>
                  {openingId === photo.id && (
                    <span className="gallery-tile-loading">
                      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                    </span>
                  )}
                </button>

                {canReview && mode === MODE_PENDING && (
                  <button
                    type="button"
                    className="gallery-tile-approve"
                    title="Схвалити"
                    aria-label="Схвалити фото"
                    disabled={busyId === photo.id}
                    onClick={() => handleApprove(photo)}
                  >
                    <Check size={15} />
                  </button>
                )}

                {canReview && (
                  <button
                    type="button"
                    className="gallery-tile-delete"
                    title="Видалити"
                    aria-label="Видалити фото"
                    disabled={busyId === photo.id}
                    onClick={() => handleDelete(photo)}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="gallery-more">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={loadingMore}
                onClick={handleLoadMore}
              >
                {loadingMore ? "Завантаження…" : "Показати ще"}
              </button>
            </div>
          )}
        </>
      )}

      {viewer && (
        <ImageLightbox
          src={viewer.src}
          alt={`Фото користувача ${viewer.photo.owner.login}`}
          onClose={() => setViewer(null)}
          actions={
            canReview ? (
              <>
                {mode === MODE_PENDING && (
                  <button
                    type="button"
                    className="btn btn-success d-flex align-items-center gap-2"
                    disabled={busyId === viewer.photo.id}
                    onClick={() => handleApprove(viewer.photo)}
                  >
                    <Check size={18} /> Схвалити
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-danger d-flex align-items-center gap-2"
                  disabled={busyId === viewer.photo.id}
                  onClick={() => handleDelete(viewer.photo)}
                >
                  <Trash2 size={18} /> Видалити
                </button>
              </>
            ) : null
          }
        />
      )}
    </>
  );
}

/**
 * CommonGalleryPanel — загальна фотогалерея (іконка в шапці чату): фото всіх
 * користувачів, які пройшли перевірку. Ті, хто перевіряє (admin/superadmin
 * і модератори з правом), бачать ще вкладку "На перевірці" з кількістю.
 * Над сіткою — пошук фото за ніком автора.
 */
export function CommonGalleryPanel() {
  const canReview = useCurrentUserStore((state) => state.canReviewPhotos);
  const pendingCount = useGalleryReviewStore((state) => state.pendingCount);
  const [tab, setTab] = useState(MODE_APPROVED);

  // search — те, що в полі; query — застосований (з затримкою) запит, за
  // яким реально шукаємо. Пошук діє на обидві вкладки.
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const applySearchNow = (e) => {
    e.preventDefault();
    setQuery(search.trim());
  };

  const clearSearch = () => {
    setSearch("");
    setQuery("");
  };

  // На випадок, якщо право зняли, поки вкладка "На перевірці" була відкрита.
  const mode = canReview ? tab : MODE_APPROVED;

  return (
    <div className="gallery-panel">
      {canReview && (
        <div className="gallery-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === MODE_APPROVED}
            className={`gallery-tab ${mode === MODE_APPROVED ? "is-active" : ""}`}
            onClick={() => setTab(MODE_APPROVED)}
          >
            Галерея
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === MODE_PENDING}
            className={`gallery-tab ${mode === MODE_PENDING ? "is-active" : ""}`}
            onClick={() => setTab(MODE_PENDING)}
          >
            На перевірці
            {pendingCount > 0 && (
              <span className="badge bg-danger ms-2">{pendingCount > 99 ? "99+" : pendingCount}</span>
            )}
          </button>
        </div>
      )}

      <form className="gallery-search" role="search" onSubmit={applySearchNow}>
        <div className="input-group">
          <span className="input-group-text" aria-hidden="true">
            <Search size={16} />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Пошук за ніком"
            aria-label="Пошук фото за ніком"
            maxLength={SEARCH_MAX_LENGTH}
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              title="Очистити"
              aria-label="Очистити пошук"
              onClick={clearSearch}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </form>

      {/* key: при зміні вкладки або пошуку стрічка завантажується заново. */}
      <GalleryFeed key={`${mode}:${query}`} mode={mode} canReview={canReview} query={query} />
    </div>
  );
}
