import { pool } from "../config/database.js";

export const ImageRepository = {
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT id, owner_id, scope, recipient_id, mime, size, data
       FROM chat_images WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  },
};
