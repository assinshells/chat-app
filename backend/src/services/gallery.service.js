import { GalleryRepository } from "../repositories/gallery.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { ImageProvider } from "../providers/image.provider.js";
import {
  GALLERY_ERRORS,
  GALLERY_LIMITS,
  GALLERY_PAGE,
  PHOTO_STATUS,
  canReviewPhotos,
} from "../constants/gallery.constants.js";
import {
  GalleryLimitException,
  GalleryPhotoNotFoundException,
  GalleryReviewForbiddenException,
  GalleryValidationException,
} from "../exceptions/gallery.exceptions.js";

const toOwnDto = (row) => ({
  id: String(row.id),
  size: row.size,
  status: row.status,
  createdAt: row.created_at,
});

const toFeedDto = (row) => ({
  id: String(row.id),
  size: row.size,
  status: row.status,
  createdAt: row.created_at,
  owner: { login: row.owner_login, color: row.owner_color },
});

const isValidId = (id) => /^\d{1,18}$/.test(String(id));

const decodeBase64 = (value) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new GalleryValidationException();
  }
  return Buffer.from(value, "base64");
};

// Права читаємо наживо з БД (як requireRole): роль/прапорець можуть
// змінитися швидше, ніж спливе access-токен.
const loadReviewerFlag = async (userId) =>
  canReviewPhotos(await UserRepository.findById(userId));

const assertReviewer = async (userId) => {
  if (!(await loadReviewerFlag(userId))) throw new GalleryReviewForbiddenException();
};

const parseBefore = (before) => (isValidId(before) ? String(before) : null);
const parseLimit = (limit) => {
  const n = Number.parseInt(limit, 10);
  if (!Number.isFinite(n) || n < 1) return GALLERY_PAGE.DEFAULT;
  return Math.min(n, GALLERY_PAGE.MAX);
};

async function loadFeed({ status, before, limit }) {
  const size = parseLimit(limit);
  const rows = await GalleryRepository.listFeed({
    status,
    before: parseBefore(before),
    limit: size,
  });
  return {
    photos: rows.slice(0, size).map(toFeedDto),
    hasMore: rows.length > size,
  };
}

export const GalleryService = {
  /** Власні фото користувача (з їхнім статусом: pending/approved). */
  async list(userId) {
    const rows = await GalleryRepository.listByOwner(Number(userId));
    return { photos: rows.map(toOwnDto), limit: GALLERY_LIMITS.MAX_PHOTOS };
  },

  /**
   * upload — приймає фото і мініатюру (base64). Тип і розмір обох
   * перевіряються за самими байтами (ImageProvider.normalize), заявлений
   * клієнтом mime не використовується. Нове фото завжди 'pending'.
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

    return toOwnDto(row);
  },

  /** Загальна галерея: схвалені фото всіх користувачів, нові першими. */
  listPublic({ before, limit }) {
    return loadFeed({ status: PHOTO_STATUS.APPROVED, before, limit });
  },

  /** Черга перевірки: непроверені фото всіх користувачів. Лише для reviewer. */
  async listReview({ userId, before, limit }) {
    await assertReviewer(userId);
    const feed = await loadFeed({ status: PHOTO_STATUS.PENDING, before, limit });
    const pendingCount = await GalleryRepository.countByStatus(PHOTO_STATUS.PENDING);
    return { ...feed, pendingCount };
  },

  /**
   * getFile — { mime, data }. Схвалене фото бачать усі, власне — його
   * автор, непроверене чуже — лише той, хто перевіряє. Інакше 404 (щоб не
   * розкривати, що таке фото існує).
   */
  async getFile({ id, userId, variant }) {
    if (!isValidId(id)) throw new GalleryPhotoNotFoundException();
    const viewerId = Number(userId);

    let file = await GalleryRepository.findFile({ id, viewerId, variant });
    if (!file && (await loadReviewerFlag(viewerId))) {
      file = await GalleryRepository.findFile({ id, viewerId, bypass: true, variant });
    }
    if (!file) throw new GalleryPhotoNotFoundException();
    return file;
  },

  /** Схвалення: фото стає видимим усім. Ідемпотентно (повторне — ок). */
  async approve({ id, userId }) {
    if (!isValidId(id)) throw new GalleryPhotoNotFoundException();
    await assertReviewer(userId);

    const changed = await GalleryRepository.approve({ id, reviewerId: Number(userId) });
    if (!changed && !(await GalleryRepository.findMeta(id))) {
      throw new GalleryPhotoNotFoundException();
    }
  },

  /** Видалення з БД: власник — своє, reviewer — будь-яке. */
  async remove({ id, userId }) {
    if (!isValidId(id)) throw new GalleryPhotoNotFoundException();

    const meta = await GalleryRepository.findMeta(id);
    if (!meta) throw new GalleryPhotoNotFoundException();

    const isOwner = meta.owner_id === Number(userId);
    if (!isOwner && !(await loadReviewerFlag(userId))) {
      throw new GalleryPhotoNotFoundException();
    }
    await GalleryRepository.deleteById(id);
  },
};
