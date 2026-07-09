/**
 * shopHelpers.js — utilitaires boutique partagés (front + serveur).
 *
 * Fichier PUR (aucun import React/DOM) pour être importable aussi bien côté
 * client (pages/composants) que côté serveur (lib/socialMeta.js pour l'OG),
 * comme subsiteHost.js.
 */

// Slug SEO-friendly depuis un titre : minuscules, sans accents, tirets.
export const slugify = (s = '') =>
    String(s).toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')   // retire les accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 60) || 'produit';

// Handle d'URL d'un produit : "<slug>-<uuid>". L'UUID fait foi (lookup), le
// slug est cosmétique / SEO — il peut changer sans casser le lien.
export const productHandle = (item) => `${slugify(item?.title || '')}-${item?.id ?? ''}`;

// Extrait l'UUID de fin d'un handle. Repli : le handle entier (cas d'un id nu).
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const idFromHandle = (handle = '') => {
    const m = String(handle).match(UUID_RE);
    return m ? m[0] : String(handle);
};

// Article → variantes d'affichage :
//   [{ label, label_en, price, options: [{ label, label_en, price, url }] }]
// Repli sur l'ancien format plat (version.url) puis sur external_url.
export const toVariants = (item) => {
    const raw = (Array.isArray(item?.versions) && item.versions.length)
        ? item.versions
        : (item?.external_url ? [{ label: '', label_en: '', price: item.price_text || '', url: item.external_url }] : []);
    return raw
        .map((v) => {
            const options = (Array.isArray(v.options) && v.options.length)
                ? v.options
                : (v.url ? [{ label: '', label_en: '', price: v.price || '', url: v.url }] : []);
            return { label: v.label || '', label_en: v.label_en || '', price: v.price || '', options };
        })
        .filter((v) => v.options.length);
};

// Parse un prix texte ("4,15 €", "28€") → nombre, ou null.
export const parsePrice = (s) => {
    if (typeof s !== 'string') return null;
    const m = s.replace(/\s/g, '').match(/(\d+(?:[.,]\d+)?)/);
    return m ? parseFloat(m[1].replace(',', '.')) : null;
};

// Nombre total d'options de paiement (liens) d'un article.
export const totalOptions = (item) => toVariants(item).reduce((n, v) => n + v.options.length, 0);

// Libellé « prix mini » pour la grille : plus petite valeur parseable parmi
// toutes les options, en gardant la chaîne d'origine (formatage saisi).
export const minPriceLabel = (item) => {
    const opts = toVariants(item).flatMap((v) => v.options);
    let best = null;
    for (const o of opts) {
        const n = parsePrice(o.price);
        if (n != null && (best === null || n < best.n)) best = { n, label: o.price };
    }
    return best ? best.label : (opts.find((o) => o.price)?.price || null);
};
