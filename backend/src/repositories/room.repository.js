import { pool } from "../config/database.js";

export const RoomRepository = {
  async findAll() {
    const { rows } = await pool.query(
      `SELECT r.id, r.name, r.created_by, r.created_at,
              u.login AS created_by_login
       FROM rooms r
       LEFT JOIN users u ON u.id = r.created_by
       ORDER BY r.name ASC`,
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT r.id, r.name, r.created_by, r.created_at,
              u.login AS created_by_login
       FROM rooms r
       LEFT JOIN users u ON u.id = r.created_by
       WHERE r.id = $1`,
      [id],
    );
    return rows[0] ?? null;
  },

  /**
   * ON CONFLICT DO NOTHING + RETURNING — атомарная проверка уникальности
   * имени без отдельного SELECT-перед-INSERT (и без гонки между ними).
   * null означает "имя уже занято" — сервисный слой превращает это в
   * RoomNameTakenException.
   */
  async create({ name, createdBy }) {
    const { rows } = await pool.query(
      `INSERT INTO rooms (name, created_by) VALUES ($1, $2)
       ON CONFLICT (name) DO NOTHING
       RETURNING id, name, created_by, created_at`,
      [name, createdBy],
    );
    return rows[0] ?? null;
  },
};
