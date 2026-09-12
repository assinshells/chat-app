import { pool } from "../config/database.js";

/**
 * FriendRepository — user_friends (див. docker/postgres/init.sql).
 * Односторонні записи: рядок (owner_id, friend_id) означає "owner_id
 * додав friend_id до своїх друзів" — жодного автоматичного зворотного
 * ефекту чи підтвердження з боку friend_id.
 */
export const FriendRepository = {
  async isFriend(ownerId, friendId) {
    const { rows } = await pool.query(
      "SELECT 1 FROM user_friends WHERE owner_id = $1 AND friend_id = $2 LIMIT 1",
      [ownerId, friendId],
    );
    return rows.length > 0;
  },

  async create(ownerId, friendId) {
    const { rows } = await pool.query(
      `INSERT INTO user_friends (owner_id, friend_id)
       VALUES ($1, $2)
       ON CONFLICT (owner_id, friend_id) DO NOTHING
       RETURNING *`,
      [ownerId, friendId],
    );
    return rows[0] ?? null;
  },

  async remove(ownerId, friendId) {
    const { rows } = await pool.query(
      "DELETE FROM user_friends WHERE owner_id = $1 AND friend_id = $2 RETURNING *",
      [ownerId, friendId],
    );
    return rows[0] ?? null;
  },

  /**
   * listByOwner — усі користувачі, яких ownerId додав до друзів, разом
   * з їхніми даними (для сайдбара — список друзів потребує логін/колір,
   * а не лише id), останні додані — першими.
   */
  async listByOwner(ownerId) {
    const { rows } = await pool.query(
      `SELECT u.id, u.login, u.color, uf.created_at
       FROM user_friends uf
       JOIN users u ON u.id = uf.friend_id
       WHERE uf.owner_id = $1
       ORDER BY uf.created_at DESC`,
      [ownerId],
    );
    return rows;
  },
};
