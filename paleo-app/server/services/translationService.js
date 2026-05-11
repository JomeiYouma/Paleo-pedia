/**
 * translationService.js
 * Traduit les champs d'un cartel via les API OpenAI et/ou DeepL.
 * Les clés sont lues depuis la table `settings` de la BDD.
 *
 * Stratégie de routage :
 *  - FR↔EN : si `deepl_key` est renseignée → DeepL (moins coûteux),
 *            sinon fallback sur `openai_key`.
 *  - Autres langues : OpenAI uniquement (DeepL ne gère pas une langue cible libre).
 */

import OpenAI from 'openai';
import { SettingModel } from '../models/Setting.js';

const SOURCE_LANG_NAMES = { fr: 'French', en: 'English' };

const isOpenAIKey = (k) => typeof k === 'string' && (k.startsWith('sk-') || k.startsWith('proj-'));
const isDeepLKey  = (k) => typeof k === 'string' && k.length > 0 && !isOpenAIKey(k);

async function translateWithDeepL({ apiKey, target, fields }) {
  const isFree = apiKey.endsWith(':fx');
  const url = isFree ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: fields,
      target_lang: target === 'en' ? 'EN' : 'FR',
    }),
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errBody = await response.json();
      errorMsg = errBody.message || errorMsg;
    } catch { /* ignore */ }
    throw new Error(`Erreur DeepL API: ${response.status} - ${errorMsg}`);
  }

  const data = await response.json();
  if (!data.translations || !Array.isArray(data.translations)) {
    throw new Error(`Réponse DeepL invalide`);
  }
  return data.translations.map(t => t.text);
}

/**
 * Traduit un cartel.
 * @param {object} cartelData - { titre, description, location } dans la langue SOURCE.
 * @param {object} opts
 * @param {'en'|'fr'} [opts.target='en'] - Langue cible.
 * Retourne un objet avec les clés adaptées à la cible :
 *   - target='en' → { titre_en, description_en, location_en }
 *   - target='fr' → { titre, description, location }
 */
export async function translateCartel(cartelData, { target = 'en' } = {}) {
  if (target !== 'en' && target !== 'fr') {
    throw new Error(`Langue cible non supportée : ${target}`);
  }

  // Préférer DeepL pour FR↔EN si une clé dédiée est configurée (moins coûteux qu'OpenAI).
  // Rétro-compat : une clé DeepL stockée historiquement dans `openai_key` est aussi acceptée.
  const deeplKey  = await SettingModel.get('deepl_key');
  const openaiKey = await SettingModel.get('openai_key');

  let apiKey, useDeepL;
  if (deeplKey) {
    apiKey = deeplKey;
    useDeepL = true;
  } else if (openaiKey) {
    apiKey = openaiKey;
    useDeepL = isDeepLKey(openaiKey); // ancienne config : DeepL collée dans le champ unique
  } else {
    throw new Error('Clé API non configurée dans les réglages.');
  }

  // Clés de sortie selon la cible
  const outKeys = target === 'en'
    ? { titre: 'titre_en', description: 'description_en', location: 'location_en' }
    : { titre: 'titre',    description: 'description',    location: 'location'    };

  const sourceLangName = target === 'en' ? 'French' : 'English';
  const targetLangName = target === 'en' ? 'English' : 'French';

  if (!useDeepL) {
    // ── OpenAI ──────────────────────────────────────────────────
    const client = new OpenAI({ apiKey });

    const payload = {
      titre:       cartelData.titre       || '',
      description: cartelData.description || '',
      location:    cartelData.location    || '',
    };

    const prompt = `You are a professional translator for a scientific exhibition about historical energy called "Paléo-Énergétique".
Translate the following JSON fields from ${sourceLangName} to ${targetLangName}.
Return ONLY a valid JSON object with the same keys.
Keep empty strings empty. Do not add explanations.

Input:
${JSON.stringify(payload, null, 2)}`;

    const chat = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You translate JSON from ${sourceLangName} to ${targetLangName}. Output only valid JSON.` },
        { role: 'user',   content: prompt },
      ],
      temperature: 0.2,
      max_tokens:  800,
    });

    const raw = chat.choices[0]?.message?.content?.trim() ?? '';

    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : raw;

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error(`Réponse OpenAI non-JSON : ${raw.slice(0, 200)}`);
    }

    return {
      [outKeys.titre]:       (parsed.titre       || '').trim(),
      [outKeys.description]: (parsed.description || '').trim(),
      [outKeys.location]:    (parsed.location    || '').trim(),
    };
  } else {
    // ── DeepL ───────────────────────────────────────────────────
    const fieldsToTranslate = [];
    const mapping = [];

    if (cartelData.titre)       { fieldsToTranslate.push(cartelData.titre);       mapping.push(outKeys.titre); }
    if (cartelData.description) { fieldsToTranslate.push(cartelData.description); mapping.push(outKeys.description); }
    if (cartelData.location)    { fieldsToTranslate.push(cartelData.location);    mapping.push(outKeys.location); }

    const result = {
      [outKeys.titre]: '',
      [outKeys.description]: '',
      [outKeys.location]: '',
    };

    if (fieldsToTranslate.length === 0) return result;

    const translated = await translateWithDeepL({ apiKey, target, fields: fieldsToTranslate });
    mapping.forEach((key, index) => { result[key] = translated[index]; });
    return result;
  }
}

/**
 * Traduit un cartel vers une langue arbitraire (autre que FR/EN).
 * Utilise OpenAI uniquement (DeepL n'est pas adapté à un nom de langue libre).
 * Retourne { titre, description, location } dans la langue cible (clés non suffixées).
 *
 * @param {object} cartelData - { titre, description, location } dans la langue source
 * @param {object} opts
 * @param {'fr'|'en'} opts.sourceLang - Code de langue source (déterminé par l'UI)
 * @param {string}    opts.targetLanguageName - Nom libre de la langue cible (ex: "Spanish", "Espagnol", "日本語")
 */
export async function translateCartelToLanguage(cartelData, { sourceLang = 'fr', targetLanguageName } = {}) {
  if (!targetLanguageName || !String(targetLanguageName).trim()) {
    throw new Error('Langue cible manquante.');
  }
  const apiKey = await SettingModel.get('openai_key');
  if (!apiKey) throw new Error('Clé OpenAI non configurée dans les réglages (requise pour les langues autres que FR/EN).');
  if (!isOpenAIKey(apiKey)) {
    throw new Error('La traduction vers une langue arbitraire requiert une clé OpenAI (DeepL non supporté pour ce flux).');
  }

  const client = new OpenAI({ apiKey });
  const sourceLangName = SOURCE_LANG_NAMES[sourceLang] || 'French';

  const payload = {
    titre:       cartelData.titre       || '',
    description: cartelData.description || '',
    location:    cartelData.location    || '',
  };

  const prompt = `You are a professional translator for a scientific exhibition about historical energy called "Paléo-Énergétique".
Translate the following JSON fields from ${sourceLangName} to ${targetLanguageName}.
If "${targetLanguageName}" is ambiguous or not a recognised language, infer the most likely language and translate accordingly.
Return ONLY a valid JSON object with the same keys (titre, description, location).
Keep empty strings empty. Do not add explanations or markdown fences.

Input:
${JSON.stringify(payload, null, 2)}`;

  const chat = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: `You translate JSON from ${sourceLangName} to ${targetLanguageName}. Output only valid JSON.` },
      { role: 'user',   content: prompt },
    ],
    temperature: 0.2,
    max_tokens:  1200,
  });

  const raw = chat.choices[0]?.message?.content?.trim() ?? '';
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : raw;

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Réponse OpenAI non-JSON : ${raw.slice(0, 200)}`);
  }

  return {
    titre:       (parsed.titre       || '').trim(),
    description: (parsed.description || '').trim(),
    location:    (parsed.location    || '').trim(),
  };
}

/**
 * Traduit en un seul appel OpenAI un objet de libellés UI + une liste de noms
 * de catégories, depuis FR/EN vers une langue arbitraire (frise traduite).
 * Utilisé pour que l'export PDF affiche les "Pour aller plus loin", "Exhumé par",
 * "Catégories", noms de catégories, etc. dans la langue cible.
 *
 * @param {object} args
 * @param {object} args.labels             - { key: stringSource, ... }
 * @param {string[]} args.categories       - Liste de noms de catégories en langue source.
 * @param {'fr'|'en'} [args.sourceLang]    - Langue source.
 * @param {string} args.targetLanguageName - Nom libre de la langue cible.
 * Retourne : { labels: {...mêmes clés, valeurs traduites}, categories: [...même longueur] }
 */
export async function translateLabelsAndCategories({ labels = {}, categories = [], sourceLang = 'fr', targetLanguageName } = {}) {
  if (!targetLanguageName || !String(targetLanguageName).trim()) {
    throw new Error('Langue cible manquante.');
  }
  const apiKey = await SettingModel.get('openai_key');
  if (!apiKey) throw new Error('Clé OpenAI non configurée dans les réglages (requise pour les langues autres que FR/EN).');
  if (!isOpenAIKey(apiKey)) {
    throw new Error('La traduction vers une langue arbitraire requiert une clé OpenAI (DeepL non supporté pour ce flux).');
  }

  const labelKeys = Object.keys(labels);
  const cleanCategories = Array.isArray(categories) ? categories.filter(Boolean) : [];

  if (labelKeys.length === 0 && cleanCategories.length === 0) {
    return { labels: {}, categories: [] };
  }

  const client = new OpenAI({ apiKey });
  const sourceLangName = SOURCE_LANG_NAMES[sourceLang] || 'French';

  const payload = { labels, categories: cleanCategories };

  const prompt = `Translate UI labels and category names from ${sourceLangName} to ${targetLanguageName} for a scientific exhibition catalog about historical energy ("Paléo-Énergétique").
Return ONLY a valid JSON object with the EXACT same shape as the input:
{ "labels": { same keys as input, translated values }, "categories": [ same length, each item translated ] }
If "${targetLanguageName}" is ambiguous, infer the most likely language.
Keep empty strings empty. No explanations, no markdown fences.

Input:
${JSON.stringify(payload, null, 2)}`;

  const chat = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: `You translate JSON from ${sourceLangName} to ${targetLanguageName}. Output only valid JSON with the same shape.` },
      { role: 'user',   content: prompt },
    ],
    temperature: 0.2,
    max_tokens:  1200,
  });

  const raw = chat.choices[0]?.message?.content?.trim() ?? '';
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : raw;

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Réponse OpenAI non-JSON : ${raw.slice(0, 200)}`);
  }

  const outLabels = {};
  for (const k of labelKeys) {
    const v = parsed?.labels?.[k];
    outLabels[k] = (typeof v === 'string' ? v : labels[k] || '').trim();
  }
  const outCats = Array.isArray(parsed?.categories) ? parsed.categories : [];
  const normalizedCats = cleanCategories.map((src, i) => {
    const t = outCats[i];
    return (typeof t === 'string' && t.trim()) ? t.trim() : src;
  });

  return { labels: outLabels, categories: normalizedCats };
}

/**
 * Traduit un set arbitraire de champs FR↔EN (générique — pour le gestionnaire
 * de contenu : team_members, press_articles, prestations, shop_items…).
 * Préfère DeepL si configurée. Conserve les clés ; les valeurs vides restent vides.
 *
 * @param {object} fields - { key1: text1, key2: text2, ... } dans la langue SOURCE.
 * @param {object} opts
 * @param {'en'|'fr'} [opts.target='en'] - Langue cible.
 * @returns {Promise<object>} - { key1: translated1, ... } (mêmes clés).
 */
export async function translateFields(fields, { target = 'en' } = {}) {
  if (target !== 'en' && target !== 'fr') {
    throw new Error(`Langue cible non supportée : ${target}`);
  }
  if (!fields || typeof fields !== 'object') {
    throw new Error('fields doit être un objet { key: text }');
  }

  // Ne traduire que les entrées non vides ; on garde les autres telles quelles.
  const entries = Object.entries(fields).filter(([, v]) => typeof v === 'string' && v.trim().length > 0);
  if (entries.length === 0) {
    return Object.fromEntries(Object.keys(fields).map(k => [k, fields[k] || '']));
  }

  const deeplKey  = await SettingModel.get('deepl_key');
  const openaiKey = await SettingModel.get('openai_key');

  let apiKey, useDeepL;
  if (deeplKey) {
    apiKey = deeplKey;
    useDeepL = true;
  } else if (openaiKey) {
    apiKey = openaiKey;
    useDeepL = isDeepLKey(openaiKey);
  } else {
    throw new Error('Clé API non configurée dans les réglages.');
  }

  const sourceLangName = target === 'en' ? 'French' : 'English';
  const targetLangName = target === 'en' ? 'English' : 'French';

  if (useDeepL) {
    const texts = entries.map(([, v]) => v);
    const translated = await translateWithDeepL({ apiKey, target, fields: texts });
    const result = {};
    for (const k of Object.keys(fields)) result[k] = fields[k] || '';
    entries.forEach(([k], i) => { result[k] = translated[i] ?? fields[k] ?? ''; });
    return result;
  }

  // Fallback OpenAI
  const client = new OpenAI({ apiKey });
  const payload = Object.fromEntries(entries);

  const prompt = `You are a professional translator for a scientific programme on historical energy ("Paléo-Énergétique").
Translate the values of this JSON object from ${sourceLangName} to ${targetLangName}.
Keep the SAME keys. Preserve formatting (line breaks, punctuation). Output ONLY a valid JSON object.

Input:
${JSON.stringify(payload, null, 2)}`;

  const chat = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: `You translate JSON values from ${sourceLangName} to ${targetLangName}. Output only valid JSON with the same keys.` },
      { role: 'user',   content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 1500,
  });

  const raw = chat.choices[0]?.message?.content?.trim() ?? '';
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : raw;

  let parsed;
  try { parsed = JSON.parse(jsonStr); }
  catch { throw new Error(`Réponse OpenAI non-JSON : ${raw.slice(0, 200)}`); }

  const result = {};
  for (const k of Object.keys(fields)) {
    const v = parsed?.[k];
    result[k] = (typeof v === 'string' ? v : fields[k] || '').trim();
  }
  return result;
}
