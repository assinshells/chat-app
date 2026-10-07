import { pool } from "../config/database.js";
import { PHOTO_STATUS } from "../constants/gallery.constants.js";

// Ключ advisory-lock: (namespace, ownerId) — серіалізує паралельні
// завантаження ОДНОГО користувача, щоб перевірка ліміту не обходилась
// двома одночасними запитами.
const GALLERY_LOCK_NAMESPACE = 7004;

// Лише метадані (без BYTEA) + автор — для загальної галереї та черги перевірки.
const FEED_COLUMNS = `p.id, p.size, p.status, p.created_at,
                      u.login AS owner_login, u.color AS owner_color`;

export const GalleryRepository = {
  /** Метадані фото користувача (без самих байтів), нові — першими. */
  async listByOwner(ownerId) {
    const { rows } = await pool.query(
      `SELECT id, size, status, created_at
       FROM user_gallery_photos
       WHERE owner_id = $1
       ORDER BY created_at DESC, id DESC`,
      [ownerId],
    );
    return rows;
  },

  /**
   * listFeed — стрічка фото ВСІХ користувачів із заданим статусом, нові
   * першими, keyset-пагінація за id (before — id останнього отриманого).
   * Бере limit + 1 рядок, щоб сервіс знав, чи є ще сторінка.
   */
  async listFeed({ status, before, limit }) {
    const { rows } = await pool.query(
      `SELECT ${FEED_COLUMNS}
       FROM user_gallery_photos p
       JOIN users u ON u.id = p.owner_id
       WHERE p.status = $1 AND ($2::bigint IS NULL OR p.id < $2::bigint)
       ORDER BY p.id DESC
       LIMIT $3`,
      [status, before ?? null, limit + 1],
    );
    return rows;
  },

  async countByStatus(status) {
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM user_gallery_photos WHERE status = $1",
      [status],
    );
    return rows[0].count;
  },

  /**
   * create — додає фото (завжди зі статусом 'pending'), якщо в користувача
   * ще менше maxPhotos. Повертає { id, size, status, created_at } або null,
   * якщо ліміт вичерпано.
   */
  async create({ ownerId, mime, size, data, thumbMime, thumb, maxPhotos }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock($1, $2)", [
        GALLERY_LOCK_NAMESPACE,
        ownerId,
      ]);

      const { rows: countRows } = await client.query(
        "SELECT COUNT(*)::int AS count FROM user_gallery_photos WHERE owner_id = $1",
        [ownerId],
      );
      if (countRows[0].count >= maxPhotos) {
        await client.query("ROLLBACK");
        return null;
      }

      const { rows } = await client.query(
        `INSERT INTO user_gallery_photos (owner_id, mime, size, data, thumb_mime, thumb, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, size, status, created_at`,
        [ownerId, mime, size, data, thumbMime, thumb, PHOTO_STATUS.PENDING],
      );
      await client.query("COMMIT");
      return rows[0];
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * findFile — байти повного фото або мініатюри. Віддається, якщо фото
   * схвалене, або належить viewerId, або (bypass = true) запитує той, хто
   * перевіряє фото. Інакше null (для виклику — те саме, що "не існує").
   */
  async findFile({ id, viewerId, bypass = false, variant }) {
    // Назви колонок — з фіксованого тернарника, не з вводу користувача.
    const isThumb = variant === "thumb";
    const { rows } = await pool.query(
      `SELECT ${isThumb ? "thumb_mime" : "mime"} AS mime,
              ${isThumb ? "thumb" : "data"} AS data
       FROM user_gallery_photos
       WHERE id = $1
         AND ($4::boolean OR owner_id = $2 OR status = $3)`,
      [id, viewerId, PHOTO_STATUS.APPROVED, bypass],
    );
    return rows[0] ?? null;
  },

  async findMeta(id) {
    const { rows } = await pool.query(
      "SELECT id, owner_id, status FROM user_gallery_photos WHERE id = $1",
      [id],
    );
    return rows[0] ?? null;
  },

  /**
   * approve — pending -> approved. Повертає true, якщо саме цей виклик
   * змінив статус; false — якщо фото вже було схвалене (або зникло).
   */
  async approve({ id, reviewerId }) {
    const { rowCount } = await pool.query(
      `UPDATE user_gallery_photos
       SET status = $3, reviewed_by = $2, reviewed_at = NOW()
       WHERE id = $1 AND status = $4`,
      [id, reviewerId, PHOTO_STATUS.APPROVED, PHOTO_STATUS.PENDING],
    );
    return rowCount > 0;
  },

  async deleteById(id) {
    const { rowCount } = await pool.query(
      "DELETE FROM user_gallery_photos WHERE id = $1",
      [id],
    );
    return rowCount > 0;
  },
};
