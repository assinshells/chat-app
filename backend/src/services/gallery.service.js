import { GalleryRepository } from "../repositories/gallery.repository.js";
import { ImageProvider } from "../providers/image.provider.js";
import { GALLERY_ERRORS, GALLERY_LIMITS } from "../constants/gallery.constants.js";
import {
  GalleryLimitException,
  GalleryPhotoNotFoundException,
  GalleryValidationException,
} from "../exceptions/gallery.exceptions.js";

const toDto = (row) => ({
  id: String(row.id),
  size: row.size,
  createdAt: row.created_at,
});

const isValidId = (id) => /^\d{1,18}$/.test(String(id));

const decodeBase64 = (value) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new GalleryValidationException();
  }
  return Buffer.from(value, "base64");
};

export const GalleryService = {
  async list(userId) {
    const rows = await GalleryRepository.listByOwner(Number(userId));
    return { photos: rows.map(toDto), limit: GALLERY_LIMITS.MAX_PHOTOS };
  },

  /**
   * upload — приймає фото і мініатюру (base64). Тип і розмір обох
   * перевіряються за самими байтами (ImageProvider.normalize), заявлений
   * клієнтом mime не використовується.
   */
  async upload({ userId, image, thumb }) {
    const full = ImageProvider.normalize(decodeBase64(image));
    const small = ImageProvider.normalize(decodeBase64(thumb));

    if (small.size > GALLERY_LIMITS.MAX_THUMB_BYTES) {
      throw new GalleryValidationException(GALLERY_ERRORS.TOO_LARGE, "GALLERY_THUMB_TOO_LARGE");
    }

    const row = await GalleryRepository.create({
      ownerId: Number(userId),
      mime: full.mime,
      size: full.size,
      data: full.data,
      thumbMime: small.mime,
      thumb: small.data,
      maxPhotos: GALLERY_LIMITS.MAX_PHOTOS,
    });
    if (!row) throw new GalleryLimitException();

    return toDto(row);
  },

  /**
   * getFile — { mime, data } повного фото (variant="full") або мініатюри
   * (variant="thumb"). Галерея поки приватна: чуже фото віддається з тим
   * самим 404, що й неіснуюче.
   */
  async getFile({ id, userId, variant }) {
    if (!isValidId(id)) throw new GalleryPhotoNotFoundException();
    const file = await GalleryRepository.findFile({ id, ownerId: Number(userId), variant });
    if (!file) throw new GalleryPhotoNotFoundException();
    return file;
  },

  async remove({ id, userId }) {
    if (!isValidId(id)) throw new GalleryPhotoNotFoundException();
    const deleted = await GalleryRepository.deleteOwned({ id, ownerId: Number(userId) });
    if (!deleted) throw new GalleryPhotoNotFoundException();
  },
};
