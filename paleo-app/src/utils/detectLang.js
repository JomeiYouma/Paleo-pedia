/**
 * Heuristique simple de détection FR/EN pour alerter l'utilisateur quand il
 * écrit dans la mauvaise langue par rapport à la page courante.
 *
 * Volontairement naïve : on compte la présence de mots courts très fréquents
 * de chaque langue. Suffisant pour détecter une phrase complète mal saisie,
 * sans recourir à une librairie (pas de nouvelle dépendance).
 *
 * Ignorer les toponymes / noms propres : la détection doit être utilisée sur
 * les champs "titre" et "description", PAS sur "location".
 */

const EN_INDICATORS = new Set([
  'the', 'and', 'is', 'of', 'with', 'for', 'was', 'were', 'are', 'have',
  'had', 'this', 'that', 'these', 'those', 'but', 'from', 'not', 'one',
  'which', 'their', 'his', 'her', 'our', 'about', 'after', 'before',
  'between', 'during', 'through', 'when', 'where', 'while', 'would',
  'could', 'should', 'been', 'being',
]);

const FR_INDICATORS = new Set([
  'le', 'la', 'les', 'est', 'et', 'pour', 'dans', 'avec', 'son', 'une',
  'des', 'qui', 'que', 'sont', 'était', 'étaient', 'ces', 'cette', 'ce',
  'cet', 'du', 'au', 'aux', 'par', 'mais', 'sur', 'sans', 'entre',
  'pendant', 'avant', 'après', 'leur', 'leurs', 'notre', 'votre', 'nos',
  'vos', 'être', 'avoir',
]);

const MIN_LENGTH = 20;
const MIN_HITS = 3;

/**
 * @param {string} text
 * @param {'fr'|'en'} expectedLang - langue attendue (celle de la page courante)
 * @returns {'fr'|'en'|null} la langue détectée si elle DIFFÈRE de l'attendue,
 *   sinon null (aucune alerte à lever).
 */
export function detectWrongLanguage(text, expectedLang) {
  if (!text || typeof text !== 'string') return null;
  if (text.trim().length < MIN_LENGTH) return null;

  const words = text.toLowerCase().match(/[a-zàâçéèêëîïôûùüÿñæœ']+/g) || [];
  if (words.length < 5) return null;

  let enHits = 0;
  let frHits = 0;
  for (const w of words) {
    if (EN_INDICATORS.has(w)) enHits++;
    if (FR_INDICATORS.has(w)) frHits++;
  }

  // Normaliser : i18n peut renvoyer 'fr-FR', 'en-GB', ou l'ancienne valeur 'gb'.
  const exp = (expectedLang === 'gb' ? 'en' : (expectedLang || '')).slice(0, 2).toLowerCase();
  if (exp === 'fr' && enHits >= MIN_HITS && enHits > frHits) return 'en';
  if (exp === 'en' && frHits >= MIN_HITS && frHits > enHits) return 'fr';
  return null;
}
