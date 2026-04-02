/**
 * helpers.js — Utilitaires partagés
 * Portage depuis paleo-app/src/utils/helpers.js
 */

/** Convertit un chiffre romain en entier */
export const romanToInt = (s) => {
  if (!s) return 0;
  const roman = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let num = 0;
  try {
    s = s.toUpperCase();
    for (let i = 0; i < s.length - 1; i++) {
      if (roman[s[i]] < roman[s[i + 1]]) num -= roman[s[i]];
      else num += roman[s[i]];
    }
    num += roman[s[s.length - 1]];
    return num;
  } catch { return 0; }
};

/**
 * Extrait l'année numérique d'un cartel pour le tri chronologique.
 * Gère : "1350", "-500", "XIVe s.", "300 av. J.-C.", "av JC"...
 */
export const getYearForSort = (entry) => {
  const text = String(entry?.annee || '9999').toLowerCase().trim();
  const isBc = text.includes('av') || text.includes('bc') || text.includes('bef') || text.startsWith('-');

  const matchDigit = text.match(/\d+/);
  if (matchDigit) {
    let val = parseInt(matchDigit[0], 10);
    if (isBc) val = -Math.abs(val);
    return val;
  }

  const matchRoman = text.match(/\b[mdclxvi]+\b/i);
  if (matchRoman) {
    let val = romanToInt(matchRoman[0]) * 100;
    if (isBc) val = -Math.abs(val);
    return val;
  }

  return 9999;
};

/**
 * Formate l'année pour l'affichage (avec conversion BC/AD ↔ av. J.-C. / ap. J.-C.)
 * @param {string} yearStr
 * @param {string} lang - 'fr' ou 'en'
 */
export const formatYear = (yearStr, lang = 'fr') => {
  if (!yearStr) return '';
  let val = String(yearStr);
  const isEn = lang?.startsWith('en');

  if (isEn) {
    val = val.replace(/(av|avant)\.?\s*J\.?-?C\.?/gi, 'BC');
    val = val.replace(/(ap|apres|après)\.?\s*J\.?-?C\.?/gi, 'AD');
  } else {
    val = val.replace(/\bB\.?C\.?\b/gi, 'av. J.-C.');
    val = val.replace(/\bA\.?D\.?\b/gi, 'ap. J.-C.');
  }
  return val;
};

/**
 * Tronque un texte à une longueur donnée avec ellipsis.
 */
export const truncate = (str, len = 120) =>
  str && str.length > len ? str.slice(0, len) + '…' : (str || '');

/**
 * Groupe un tableau par une clé.
 */
export const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const k = typeof key === 'function' ? key(item) : item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
