import { pool } from "../config/database.js";

/**
 * ModeratorRoomRepository — перелік кімнат, які конкретний модератор
 * (role = 'moderator') має право модерувати. Для admin/superadmin ця
 * таблиця не використовується — вони модерують усі кімнати одразу
 * (див. RoleService.getModeratedRooms).
 */
export const ModeratorRoomRepository = {
  async listByUserId(userId) {
    const { rows } = await pool.query(
      "SELECT room FROM moderator_rooms WHERE user_id = $1 ORDER BY room",
      [userId],
    );
    return rows.map((row) => row.room);
  },

  /**
   * replaceForUser — повністю замінює перелік кімнат користувача на
   * переданий (транзакційно: старий перелік видаляється, новий
   * вставляється). Порожній rooms просто очищає перелік — викликається,
   * коли роль користувача більше не 'moderator' (див. RoleService).
   */
  async replaceForUser(userId, rooms) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM moderator_rooms WHERE user_id = $1", [
        userId,
      ]);

      if (rooms.length > 0) {
        const values = rooms
          .map((_, i) => `($1, $${i + 2})`)
          .join(", ");
        await client.query(
          `INSERT INTO moderator_rooms (user_id, room) VALUES ${values}`,
          [userId, ...rooms],
        );
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async clearForUser(userId) {
    await pool.query("DELETE FROM moderator_rooms WHERE user_id = $1", [
      userId,
    ]);
  },
};
