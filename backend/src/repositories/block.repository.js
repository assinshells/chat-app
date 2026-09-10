import { pool } from "../config/database.js";

/**
 * BlockRepository — user_blocks (див. docker/postgres/init.sql).
 * Односторонні записи: рядок (blocker_id, blocked_id) означає "blocker_id
 * заблокував blocked_id" — жодного автоматичного зворотного ефекту.
 */
export const BlockRepository = {
  /** isBlocked — чи заблокував САМЕ blockerId САМЕ blockedId (один напрямок). */
  async isBlocked(blockerId, blockedId) {
    const { rows } = await pool.query(
      "SELECT 1 FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2 LIMIT 1",
      [blockerId, blockedId],
    );
    return rows.length > 0;
  },

  /**
   * isBlockedEitherWay — використовується при відправленні особистого
   * повідомлення (privateMessage.service.js): забороняємо, якщо
   * ХОЧ ОДНА зі сторін заблокувала іншу, незалежно від напрямку.
   */
  async isBlockedEitherWay(userIdA, userIdB) {
    const { rows } = await pool.query(
      `SELECT 1 FROM user_blocks
       WHERE (blocker_id = $1 AND blocked_id = $2)
          OR (blocker_id = $2 AND blocked_id = $1)
       LIMIT 1`,
      [userIdA, userIdB],
    );
    return rows.length > 0;
  },

  async create(blockerId, blockedId) {
    const { rows } = await pool.query(
      `INSERT INTO user_blocks (blocker_id, blocked_id)
       VALUES ($1, $2)
       ON CONFLICT (blocker_id, blocked_id) DO NOTHING
       RETURNING *`,
      [blockerId, blockedId],
    );
    return rows[0] ?? null;
  },

  async remove(blockerId, blockedId) {
    const { rows } = await pool.query(
      "DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2 RETURNING *",
      [blockerId, blockedId],
    );
    return rows[0] ?? null;
  },

  /**
   * listByBlocker — усі користувачі, яких заблокував blockerId, разом
   * з їхніми даними (для сайдбара — список заблокованих потребує
   * логін/колір, а не лише id), останні заблоковані — першими.
   */
  async listByBlocker(blockerId) {
    const { rows } = await pool.query(
      `SELECT u.id, u.login, u.color, ub.created_at
       FROM user_blocks ub
       JOIN users u ON u.id = ub.blocked_id
       WHERE ub.blocker_id = $1
       ORDER BY ub.created_at DESC`,
      [blockerId],
    );
    return rows;
  },
};
