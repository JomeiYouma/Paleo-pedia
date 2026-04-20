/**
 * translationService.js
 * Traduit les champs d'un cartel FR → EN via l'API OpenAI ou DeepL.
 * La clé est lue depuis la table `settings` de la BDD.
 */

import OpenAI from 'openai';
import { SettingModel } from '../models/Setting.js';

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

  const apiKey = await SettingModel.get('openai_key');
  if (!apiKey) throw new Error('Clé API non configurée dans les réglages.');

  const isDeepL = apiKey.endsWith(':fx') || (!apiKey.startsWith('sk-') && !apiKey.startsWith('proj-'));

  // Clés de sortie selon la cible
  const outKeys = target === 'en'
    ? { titre: 'titre_en', description: 'description_en', location: 'location_en' }
    : { titre: 'titre',    description: 'description',    location: 'location'    };

  const sourceLangName = target === 'en' ? 'French' : 'English';
  const targetLangName = target === 'en' ? 'English' : 'French';

  if (!isDeepL) {
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
    const isFree = apiKey.endsWith(':fx');
    const url = isFree ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';

    const fieldsToTranslate = [];
    const mapping = [];

    if (cartelData.titre)       { fieldsToTranslate.push(cartelData.titre);       mapping.push(outKeys.titre); }
    if (cartelData.description) { fieldsToTranslate.push(cartelData.description); mapping.push(outKeys.description); }
    if (cartelData.location)    { fieldsToTranslate.push(cartelData.location);    mapping.push(outKeys.location); }

    if (fieldsToTranslate.length === 0) {
      return {
        [outKeys.titre]: '',
        [outKeys.description]: '',
        [outKeys.location]: '',
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: fieldsToTranslate,
        target_lang: target === 'en' ? 'EN' : 'FR',
      }),
    });

    if (!response.ok) {
      let errorMsg = response.statusText;
      try {
        const errBody = await response.json();
        errorMsg = errBody.message || errorMsg;
      } catch {
        // On ignore l'erreur de parsing
      }
      throw new Error(`Erreur DeepL API: ${response.status} - ${errorMsg}`);
    }

    const data = await response.json();
    if (!data.translations || !Array.isArray(data.translations)) {
      throw new Error(`Réponse DeepL invalide`);
    }

    const result = {
      [outKeys.titre]: '',
      [outKeys.description]: '',
      [outKeys.location]: '',
    };
    mapping.forEach((key, index) => {
      result[key] = data.translations[index].text;
    });
    return result;
  }
}
