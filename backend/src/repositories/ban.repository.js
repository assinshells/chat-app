import { pool } from "../config/database.js";

/**
 * BanRepository — bans — єдине джерело істини щодо активних
 * блокувань. "Активний" тут завжди означає: revoked_at IS NULL AND
 * (expires_at IS NULL OR expires_at > now()) — обчислюється в SQL, не
 * в JS, щоб не тягнути прострочені/розбанені рядки з БД взагалі.
 *
 * Свідомо БЕЗ Redis/in-memory кешу поверх цих запитів: перевірки
 * відбуваються при connect/room:join/message:send (див.
 * guards/socketAuth.guard.js, sockets/chat.socket.js) — для
 * караючих/безпекових даних коректність важливіша за мікролатентність
 * зайвого індексованого SELECT, а масштаб застосунку (один
 * backend-інстанс, див. коментарі в moderation/moderation.service.js
 * та chat.socket.js) поки цього й не вимагає.
 */
export const BanRepository = {
  /**
   * findActive — активний бан, що стосується конкретної кімнати:
   * або глобальний (room IS NULL), або саме на цю кімнату. Глобальний
   * має пріоритет (ORDER BY room IS NULL DESC), якщо раптом існують
   * обидва одночасно — викликаючому коду достатньо одного рядка, щоб
   * зрозуміти "заблоковано" і показати причину/термін.
   */
  async findActive({ userId, room }) {
    const { rows } = await pool.query(
      `SELECT * FROM bans
       WHERE target_user_id = $1
         AND (room IS NULL OR room = $2)
         AND revoked_at IS NULL
         AND (expires_at IS NULL OR expires_at > now())
       ORDER BY room IS NULL DESC
       LIMIT 1`,
      [userId, room],
    );
    return rows[0] ?? null;
  },

  /** findActiveGlobal — лише глобальний бан (перевірка при connect, до вибору кімнати). */
  async findActiveGlobal(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM bans
       WHERE target_user_id = $1
         AND room IS NULL
         AND revoked_at IS NULL
         AND (expires_at IS NULL OR expires_at > now())
       LIMIT 1`,
      [userId],
    );
    return rows[0] ?? null;
  },

  /** listActiveForUser — усі активні бани користувача (для модалки керування банами). */
  async listActiveForUser(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM bans
       WHERE target_user_id = $1
         AND revoked_at IS NULL
         AND (expires_at IS NULL OR expires_at > now())
       ORDER BY created_at DESC`,
      [userId],
    );
    return rows;
  },

  async create({ targetUserId, room, issuedBy, reason, expiresAt }) {
    const { rows } = await pool.query(
      `INSERT INTO bans (target_user_id, room, issued_by, reason, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [targetUserId, room ?? null, issuedBy, reason ?? null, expiresAt ?? null],
    );
    return rows[0];
  },

  /** revoke — м'яке зняття бану (id — конкретний рядок bans, а не userId). */
  async revoke(id, revokedBy) {
    const { rows } = await pool.query(
      `UPDATE bans SET revoked_at = now(), revoked_by = $2
       WHERE id = $1 AND revoked_at IS NULL
       RETURNING *`,
      [id, revokedBy],
    );
    return rows[0] ?? null;
  },

  async findById(id) {
    const { rows } = await pool.query("SELECT * FROM bans WHERE id = $1", [id]);
    return rows[0] ?? null;
  },
};
