import pg from "pg";
import logger from "./logger.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: false,
});

pool.on("error", (err) => {
  logger.error(`Помилка пулу PostgreSQL: ${err.message}`);
});

const connectDatabase = async () => {
  let client;
  try {
    client = await pool.connect();
    await client.query("SELECT 1");
    logger.info("PostgreSQL успішно підключено");
  } catch (err) {
    const detail = err?.message || err?.code || JSON.stringify(err);
    logger.error(`Не вдалося підключитися до PostgreSQL: ${detail}`);
    logger.debug(
      `Об'єкт помилки PostgreSQL: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`,
    );
    throw err;
  } finally {
    if (client) client.release();
  }
};

export { pool, connectDatabase };
