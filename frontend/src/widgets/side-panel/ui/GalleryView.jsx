import { useEffect, useRef, useState } from "react";
import { ImageOff, ImagePlus, Trash2 } from "lucide-react";

import {
  deleteGalleryPhoto,
  fetchGallery,
  fetchGalleryPhotoUrl,
  fetchGalleryThumbUrl,
  uploadGalleryPhoto,
} from "@shared/api/gallery.api.js";
import {
  IMAGE_ACCEPT,
  IMAGE_MAX_INPUT_BYTES,
  createThumbnail,
  prepareImage,
  revokePreview,
} from "@shared/lib/image.js";
import { ImageLightbox } from "@shared/ui/image-viewer";

import { SubPanelView } from "./SubPanelView.jsx";

// Дзеркалить backend GALLERY_LIMITS.MAX_PHOTOS; реальне значення приходить
// із сервера разом зі списком (limit), це лише початкове.
const DEFAULT_LIMIT = 10;

/** GalleryThumb — мініатюра в плитці (завантажується з бекенда як blob). */
function GalleryThumb({ id }) {
  const [state, setState] = useState({ src: null, failed: false });

  useEffect(() => {
    let cancelled = false;
    fetchGalleryThumbUrl(id)
      .then((src) => !cancelled && setState({ src, failed: false }))
      .catch(() => !cancelled && setState({ src: null, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.failed) {
    return (
      <span className="gallery-thumb-placeholder is-error" title="Не вдалося завантажити">
        <ImageOff size={20} />
      </span>
    );
  }
  if (!state.src) {
    return <span className="gallery-thumb-placeholder" aria-hidden="true" />;
  }
  return <img className="gallery-thumb-img" src={state.src} alt="Фото з галереї" />;
}

/**
 * GalleryView — вкладена панель "Фотогалерея" (Профіль → Фотогалерея):
 * кнопка "Завантажити фото", сітка прев'ю, клік по прев'ю відкриває фото
 * в повному розмірі (той самий ImageLightbox, що й для зображень чату).
 * До 10 фото; JPEG/PNG/WebP, файл до 10 МБ (на клієнті стискається до
 * 1 МБ, сервер перевіряє тип і розмір ще раз за самими байтами).
 */
export function GalleryView({ onBack }) {
  const fileInputRef = useRef(null);

  const [photos, setPhotos] = useState([]);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState(null);

  const [openingId, setOpeningId] = useState(null);
  const [viewerSrc, setViewerSrc] = useState(null);

  const applyGallery = (data) => {
    setPhotos(data.photos);
    setLimit(data.limit);
    setStatus("ready");
  };

  useEffect(() => {
    let cancelled = false;
    fetchGallery()
      .then((data) => !cancelled && applyGallery(data))
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  const reload = () => {
    setStatus("loading");
    fetchGallery()
      .then(applyGallery)
      .catch(() => setStatus("error"));
  };

  const isFull = photos.length >= limit;

  const handleFilesChange = async (e) => {
    const files = Array.from(e.target.files ?? []);
    // Скидаємо value, щоб повторний вибір ТОГО САМОГО файлу знову викликав change.
    e.target.value = "";
    if (!files.length) return;

    setNotice(null);
    const batch = files.slice(0, Math.max(0, limit - photos.length));
    const errors = [];
    if (batch.length < files.length) {
      errors.push(`У галереї можна мати не більше ${limit} фото`);
    }

    setUploading(true);
    for (const file of batch) {
      let prepared = null;
      try {
        prepared = await prepareImage(file);
        const thumb = await createThumbnail(prepared.blob);
        const { photo } = await uploadGalleryPhoto({ image: prepared.blob, thumb });
        setPhotos((prev) => [photo, ...prev]);
      } catch (err) {
        errors.push(err.message);
        // Ліміт/rate-limit на сервері — решту файлів пробувати марно.
        if (err.status === 409 || err.status === 429) break;
      } finally {
        revokePreview(prepared);
      }
    }
    setUploading(false);

    if (errors.length) setNotice(errors[0]);
  };

  const handleOpen = async (id) => {
    if (openingId) return;
    setNotice(null);
    setOpeningId(id);
    try {
      setViewerSrc(await fetchGalleryPhotoUrl(id));
    } catch {
      setNotice("Не вдалося завантажити фото. Спробуйте ще раз");
    } finally {
      setOpeningId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Видалити це фото?")) return;
    setNotice(null);
    try {
      await deleteGalleryPhoto(id);
      setPhotos((prev) => prev.filter((photo) => photo.id !== id));
    } catch (err) {
      setNotice(err.message || "Не вдалося видалити фото");
    }
  };

  const maxInputMb = IMAGE_MAX_INPUT_BYTES / (1024 * 1024);

  return (
    <>
      <SubPanelView title="Фотогалерея" onBack={onBack}>
        <div className="gallery-toolbar">
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            hidden
            onChange={handleFilesChange}
          />

          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2"
            disabled={uploading || isFull || status !== "ready"}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <ImagePlus size={18} />
            )}
            {uploading ? "Завантаження…" : "Завантажити фото"}
          </button>

          <span className="gallery-counter">
            {photos.length} / {limit}
          </span>
        </div>

        <p className="gallery-hint">
          JPEG, PNG або WebP · до {maxInputMb} МБ на файл · не більше {limit} фото
        </p>

        {notice && (
          <div className="alert alert-danger mx-3 py-2" role="alert">
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
          <div className="gallery-state">Фото ще немає. Завантажте перше.</div>
        )}

        {status === "ready" && photos.length > 0 && (
          <ul className="gallery-grid">
            {photos.map((photo) => (
              <li key={photo.id} className="gallery-tile">
                <button
                  type="button"
                  className="gallery-tile-open"
                  aria-label="Відкрити фото"
                  disabled={openingId === photo.id}
                  onClick={() => handleOpen(photo.id)}
                >
                  <GalleryThumb id={photo.id} />
                  {openingId === photo.id && (
                    <span className="gallery-tile-loading">
                      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  className="gallery-tile-delete"
                  title="Видалити"
                  aria-label="Видалити фото"
                  onClick={() => handleDelete(photo.id)}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SubPanelView>

      {viewerSrc && (
        <ImageLightbox
          src={viewerSrc}
          alt="Фото з галереї"
          onClose={() => setViewerSrc(null)}
        />
      )}
    </>
  );
}
