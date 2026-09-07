import { pool } from "../config/database.js";

/**
 * ConfinementRepository — стан "кого зараз замкнено в одній кімнаті
 * (bespredel) після кіку". Не більше одного активного рядка на
 * користувача (UNIQUE target_user_id) — повторний кік просто
 * продовжує/оновлює той самий рядок через upsert.
 */
export const ConfinementRepository = {
  async findActive(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM room_confinements
       WHERE target_user_id = $1
         AND revoked_at IS NULL
         AND expires_at > now()
       LIMIT 1`,
      [userId],
    );
    return rows[0] ?? null;
  },

  /**
   * upsert — призначає/продовжує обмеження. ON CONFLICT скидає
   * revoked_at/revoked_by навіть якщо попередній рядок уже був знятий
   * чи сплив — новий кік завжди створює свіже активне обмеження.
   */
  async upsert({ userId, confinedRoom, sourceRoom, issuedBy, reason, expiresAt }) {
    const { rows } = await pool.query(
      `INSERT INTO room_confinements
         (target_user_id, confined_room, source_room, issued_by, reason, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (target_user_id) DO UPDATE SET
         confined_room = EXCLUDED.confined_room,
         source_room = EXCLUDED.source_room,
         issued_by = EXCLUDED.issued_by,
         reason = EXCLUDED.reason,
         created_at = now(),
         expires_at = EXCLUDED.expires_at,
         revoked_at = NULL,
         revoked_by = NULL
       RETURNING *`,
      [userId, confinedRoom, sourceRoom ?? null, issuedBy, reason ?? null, expiresAt],
    );
    return rows[0];
  },

  async revoke(userId, revokedBy) {
    const { rows } = await pool.query(
      `UPDATE room_confinements SET revoked_at = now(), revoked_by = $2
       WHERE target_user_id = $1 AND revoked_at IS NULL
       RETURNING *`,
      [userId, revokedBy],
    );
    return rows[0] ?? null;
  },
};
