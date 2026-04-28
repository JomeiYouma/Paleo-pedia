/**
 * run_migration.js
 * Applique un fichier SQL sur la base configurée dans .env via mysql2.
 *
 * Usage : node server/scripts/run_migration.js server/migration_v8_event_logs.sql
 */

import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import mysql from 'mysql2/promise';

const file = process.argv[2];
if (!file) {
  console.error('Usage : node server/scripts/run_migration.js <chemin.sql>');
  process.exit(1);
}
const abs = path.resolve(process.cwd(), file);
if (!fs.existsSync(abs)) {
  console.error(`Fichier introuvable : ${abs}`);
  process.exit(1);
}

const sql = fs.readFileSync(abs, 'utf-8');

const conn = await mysql.createConnection(
  process.env.DATABASE_URL
    ? { uri: process.env.DATABASE_URL, multipleStatements: true }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        multipleStatements: true,
      }
);

try {
  console.log(`▶ Application de ${path.basename(abs)}...`);
  await conn.query(sql);
  console.log('✓ Migration appliquée.');
} catch (err) {
  console.error('✗ Échec migration :', err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
