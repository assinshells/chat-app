import { pool } from "../config/database.js";

export const UserRepository = {
  async findByLogin(login) {
    const { rows } = await pool.query(
      "SELECT id, login, email, password_hash, gender, color, role FROM users WHERE login = $1",
      [login],
    );
    return rows[0] ?? null;
  },

  async findByEmail(email) {
    const { rows } = await pool.query(
      "SELECT id, login, email, password_hash, gender, color, role FROM users WHERE email = $1",
      [email],
    );
    return rows[0] ?? null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      "SELECT id, login, email, password_hash, gender, color, role FROM users WHERE id = $1",
      [id],
    );
    return rows[0] ?? null;
  },

  async create({ login, passwordHash, email, gender, role }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const loginCheck = await client.query(
        "SELECT id FROM users WHERE login = $1 FOR UPDATE",
        [login],
      );
      if (loginCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        return null;
      }

      if (email) {
        const emailCheck = await client.query(
          "SELECT id FROM users WHERE email = $1 FOR UPDATE",
          [email],
        );
        if (emailCheck.rows.length > 0) {
          await client.query("ROLLBACK");
          return null;
        }
      }

      const { rows } = await client.query(
        // role — необов'язковий параметр: за замовчуванням береться
        // DEFAULT 'user' з таблиці (звичайна реєстрація), явне значення
        // передається лише при заведенні дефолтного суперадміна (див.
        // services/superadminBootstrap.service.js).
        "INSERT INTO users (login, password_hash, email, gender, role) VALUES ($1, $2, $3, $4, COALESCE($5, 'user')) RETURNING id",
        [login, passwordHash, email ?? null, gender, role ?? null],
      );

      await client.query("COMMIT");
      return rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async updatePassword(id, passwordHash) {
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      passwordHash,
      id,
    ]);
  },
  async updateGender(id, gender) {
    const { rows } = await pool.query(
      "UPDATE users SET gender = $1 WHERE id = $2 RETURNING id, login, email, gender",
      [gender, id],
    );
    return rows[0] ?? null;
  },
  async updateColor(id, color) {
    const { rows } = await pool.query(
      "UPDATE users SET color = $1 WHERE id = $2 RETURNING id, login, email, color",
      [color, id],
    );
    return rows[0] ?? null;
  },

  // Керування ролями (див. services/role.service.js,
  // services/superadminBootstrap.service.js). Повертає null, якщо
  // користувача з таким id не існує.
  async updateRole(id, role) {
    const { rows } = await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, login, email, role",
      [role, id],
    );
    return rows[0] ?? null;
  },
};