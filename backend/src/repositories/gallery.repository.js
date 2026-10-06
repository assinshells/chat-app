import { pool } from "../config/database.js";

// Ключ advisory-lock: (namespace, ownerId) — серіалізує паралельні
// завантаження ОДНОГО користувача, щоб перевірка ліміту не обходилась
// двома одночасними запитами.
const GALLERY_LOCK_NAMESPACE = 7004;

export const GalleryRepository = {
  /** Метадані фото користувача (без самих байтів), нові — першими. */
  async listByOwner(ownerId) {
    const { rows } = await pool.query(
      `SELECT id, size, created_at
       FROM user_gallery_photos
       WHERE owner_id = $1
       ORDER BY created_at DESC, id DESC`,
      [ownerId],
    );
    return rows;
  },

  /**
   * create — додає фото, якщо в користувача ще менше maxPhotos.
   * Повертає { id, size, created_at } або null, якщо ліміт вичерпано.
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
        `INSERT INTO user_gallery_photos (owner_id, mime, size, data, thumb_mime, thumb)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, size, created_at`,
        [ownerId, mime, size, data, thumbMime, thumb],
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

  /** Байти повного фото або мініатюри; лише якщо воно належить ownerId. */
  async findFile({ id, ownerId, variant }) {
    // Назви колонок — з фіксованого тернарника, не з вводу користувача.
    const isThumb = variant === "thumb";
    const { rows } = await pool.query(
      `SELECT ${isThumb ? "thumb_mime" : "mime"} AS mime,
              ${isThumb ? "thumb" : "data"} AS data
       FROM user_gallery_photos
       WHERE id = $1 AND owner_id = $2`,
      [id, ownerId],
    );
    return rows[0] ?? null;
  },

  async deleteOwned({ id, ownerId }) {
    const { rowCount } = await pool.query(
      "DELETE FROM user_gallery_photos WHERE id = $1 AND owner_id = $2",
      [id, ownerId],
    );
    return rowCount > 0;
  },
};
