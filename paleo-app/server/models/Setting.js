import { query } from '../lib/db.js';

// Cache en mémoire pour éviter une requête SQL à chaque soumission
let _cache = null;
let _cacheTs = 0;
const CACHE_TTL = 60_000; // 60 secondes

export const SettingModel = {

  async getAll() {
    const { rows } = await query('SELECT key_name, value FROM settings');
    const settings = {};
    for (const row of rows) settings[row.key_name] = row.value;
    return settings;
  },

  async get(key) {
    const { rows } = await query('SELECT value FROM settings WHERE key_name = ?', [key]);
    return rows[0]?.value ?? null;
  },

  async set(key, value) {
    await query(
      'INSERT INTO settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
      [key, String(value), String(value)]
    );
    _cache = null; // Invalider le cache
  },

  async setMany(pairs) {
    for (const [key, value] of Object.entries(pairs)) {
      await this.set(key, value);
    }
    _cache = null;
  },

  /** Retourne les settings depuis le cache (pour le middleware critique) */
  async getCached() {
    const now = Date.now();
    if (_cache && now - _cacheTs < CACHE_TTL) return _cache;
    _cache = await this.getAll();
    _cacheTs = now;
    return _cache;
  },
};
