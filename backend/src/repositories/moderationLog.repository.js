import { pool } from "../config/database.js";

/**
 * ModerationLogRepository — аудит-журнал усіх дій модерації. На
 * відміну від BanRepository (стан "зараз заблоковано"), тут просто
 * додаються рядки — kick не створює запис у bans взагалі (миттєва дія
 * без стану), тому єдине місце, де кік взагалі десь фіксується — цей журнал.
 */
export const ModerationLogRepository = {
  async record({ action, targetUserId, room, actorId, reason, expiresAt }) {
    await pool.query(
      `INSERT INTO moderation_log (action, target_user_id, room, actor_id, reason, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [action, targetUserId, room ?? null, actorId, reason ?? null, expiresAt ?? null],
    );
  },

  async listForUser(userId, limit = 50) {
    const { rows } = await pool.query(
      `SELECT * FROM moderation_log WHERE target_user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit],
    );
    return rows;
  },
};
