/**
 * ShopItem.js — Modèle MySQL pour les articles de la boutique
 * (livres, jeux, autres) affichés sur la page publique /boutique.
 * Pas de panier ni paiement côté site : chaque article renvoie vers un
 * ou plusieurs liens de paiement Stripe.
 *
 * Un article propose plusieurs VARIANTES (ex. Papier / E-book), et chaque
 * variante plusieurs OPTIONS DE PAIEMENT (ex. modes d'envoi), avec un lien
 * Stripe par option :
 *   versions: [
 *     { label:'Papier', label_en:'Paperback', options: [
 *         { label:'Point Relais', price:'4,15 €', url:'https://buy.stripe.com/…' },
 *         { label:'À domicile',   price:'7,49 €', url:'…' },
 *     ] },
 *     { label:'E-book', options: [ { label:'', price:'9,99 €', url:'…' } ] },
 *   ]
 * Stocké en JSON dans la colonne `versions` (LONGTEXT). Rétro-compat : une
 * variante « plate » (avec `url` mais sans `options`) est repliée en une
 * option unique. Les colonnes `external_url` / `price_text` sont conservées
 * comme repli (articles pas migrés) et tenues à jour en miroir de la 1re
 * option de la 1re variante.
 */
import pool from '../lib/db.js';

const ALLOWED_CATEGORIES = new Set(['book', 'game', 'other']);

const ALLOWED_FIELDS = [
  'category',
  'title',
  'title_en',
  'subtitle',
  'subtitle_en',
  'description',
  'description_en',
  'image_path',
  'external_url',
  'price_text',
  'versions',
  'display_order',
  'is_published',
];

function normalizeCategory(value) {
  if (typeof value !== 'string') return 'book';
  const v = value.trim().toLowerCase();
  return ALLOWED_CATEGORIES.has(v) ? v : 'book';
}

const str = (v) => (typeof v === 'string' ? v.trim() : '');

// Nettoie un tableau d'options de paiement → [{label,label_en,price,url}].
// Toute option sans lien (url) est écartée.
function normalizeOptions(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((o) => ({
      label:    str(o?.label),
      label_en: str(o?.label_en),
      price:    str(o?.price),
      url:      str(o?.url),
    }))
    .filter((o) => o.url);
}

// Nettoie un tableau de variantes → [{label,label_en,price,url,options[]}].
// - `options` est normalisé ; une variante « plate » (url sans options) est
//   repliée en une option unique (rétro-compat de l'ancien format).
// - `url`/`price` de la variante = miroir de sa 1re option (repli legacy).
// - Toute variante sans option valide est écartée.
function normalizeVersions(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((v) => {
      let options = normalizeOptions(v?.options);
      if (!options.length && str(v?.url)) {
        options = [{ label: '', label_en: '', price: str(v?.price), url: str(v?.url) }];
      }
      const first = options[0] || null;
      return {
        label:    str(v?.label),
        label_en: str(v?.label_en),
        price:    str(v?.price) || (first ? first.price : ''),
        url:      first ? first.url : '',
        options,
      };
    })
    .filter((v) => v.options.length);
}

// Première option de la 1re variante — sert de miroir legacy (external_url/price_text).
function firstOptionOf(versions) {
  return versions[0]?.options?.[0] || null;
}

// Enrichit une ligne DB avec un tableau `versions` normalisé :
//   colonne `versions` si présente, sinon repli sur external_url/price_text.
function withVersions(row) {
  if (!row) return row;
  let versions = [];
  if (row.versions) {
    try {
      const arr = typeof row.versions === 'string' ? JSON.parse(row.versions) : row.versions;
      versions = normalizeVersions(arr);
    } catch {
      versions = [];
    }
  }
  if (!versions.length && row.external_url) {
    const opt = { label: '', label_en: '', price: row.price_text || '', url: row.external_url };
    versions = [{ label: '', label_en: '', price: opt.price, url: opt.url, options: [opt] }];
  }
  return { ...row, versions };
}

export const ShopItemModel = {

  async findAll({ publishedOnly = false } = {}) {
    let sql = `
      SELECT * FROM shop_items
    `;
    if (publishedOnly) sql += ` WHERE is_published = 1`;
    sql += ` ORDER BY FIELD(category, 'book', 'game', 'other'), display_order ASC, created_at ASC`;
    const [rows] = await pool.query(sql);
    return rows.map(withVersions);
  },

  async findById(id) {
    const [[row]] = await pool.query('SELECT * FROM shop_items WHERE id = ?', [id]);
    return withVersions(row ?? null);
  },

  async create(data) {
    const id = crypto.randomUUID();
    const title = (data.title || '').trim();
    if (!title) {
      const err = new Error('title est requis');
      err.status = 400;
      throw err;
    }
    // Versions = source de vérité ; on tient external_url/price_text en miroir
    // de la 1re OPTION de la 1re variante (repli + compat lecteurs legacy). On ne
    // traite que les vrais tableaux : versions absent/undefined → on garde
    // external_url/price_text.
    const versions = Array.isArray(data.versions) ? normalizeVersions(data.versions) : [];
    const firstOpt = firstOptionOf(versions);
    const payload = {
      category:       normalizeCategory(data.category),
      title,
      title_en:       data.title_en       ?? null,
      subtitle:       data.subtitle       ?? null,
      subtitle_en:    data.subtitle_en    ?? null,
      description:    data.description    ?? null,
      description_en: data.description_en ?? null,
      image_path:     data.image_path     ?? null,
      external_url:   firstOpt ? firstOpt.url : (data.external_url ?? null),
      price_text:     firstOpt ? (firstOpt.price || null) : (data.price_text ?? null),
      versions:       versions.length ? JSON.stringify(versions) : null,
      display_order:  Number.isFinite(+data.display_order) ? +data.display_order : 0,
      is_published:   data.is_published === false ? 0 : 1,
    };
    await pool.query(
      `INSERT INTO shop_items
        (id, category, title, title_en, subtitle, subtitle_en, description, description_en, image_path, external_url, price_text, versions, display_order, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        payload.category,
        payload.title,
        payload.title_en,
        payload.subtitle,
        payload.subtitle_en,
        payload.description,
        payload.description_en,
        payload.image_path,
        payload.external_url,
        payload.price_text,
        payload.versions,
        payload.display_order,
        payload.is_published,
      ]
    );
    return this.findById(id);
  },

  async update(id, data) {
    const sets = [];
    const vals = [];
    for (const k of ALLOWED_FIELDS) {
      if (k === 'versions') continue; // géré séparément (sérialisation + miroir)
      if (k in data) {
        let v = data[k];
        if (k === 'category')      v = normalizeCategory(v);
        if (k === 'is_published')  v = v ? 1 : 0;
        if (k === 'display_order') v = Number.isFinite(+v) ? +v : 0;
        sets.push(`\`${k}\` = ?`);
        vals.push(v ?? null);
      }
    }
    if (Array.isArray(data.versions)) {
      const versions = normalizeVersions(data.versions);
      const firstOpt = firstOptionOf(versions);
      sets.push('`versions` = ?');      vals.push(versions.length ? JSON.stringify(versions) : null);
      // On resynchronise le repli legacy sur la 1re option de la 1re variante.
      sets.push('`external_url` = ?');  vals.push(firstOpt ? firstOpt.url : null);
      sets.push('`price_text` = ?');    vals.push(firstOpt ? (firstOpt.price || null) : null);
    }
    if (!sets.length) return this.findById(id);
    vals.push(id);
    await pool.query(`UPDATE shop_items SET ${sets.join(', ')} WHERE id = ?`, vals);
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM shop_items WHERE id = ?', [id]);
  },
};
