import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  timezone: 'Z',
});

/** Exécute une requête paramétrée (utiliser ? comme placeholders) */
export async function query(text, params = []) {
  const start = Date.now();
  const [rows] = await pool.execute(text, params);
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SQL] ${text.slice(0, 60)}... (${Date.now() - start}ms)`);
  }
  return { rows: Array.isArray(rows) ? rows : [rows] };
}

/** Fournit un client pour les transactions */
export async function getClient() {
  const conn = await pool.getConnection();
  return {
    query: async (text, params = []) => {
      const [rows] = await conn.execute(text, params);
      return { rows: Array.isArray(rows) ? rows : [rows] };
    },
    release: () => conn.release(),
  };
}

export default pool;
