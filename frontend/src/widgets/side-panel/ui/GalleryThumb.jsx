import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";

import { fetchGalleryThumbUrl } from "@shared/api/gallery.api.js";

/** GalleryThumb — мініатюра в плитці (завантажується з бекенда як blob, з кешем). */
export function GalleryThumb({ id }) {
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
