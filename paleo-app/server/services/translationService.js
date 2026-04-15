/**
 * translationService.js
 * Traduit les champs d'un cartel FR → EN via l'API OpenAI ou DeepL.
 * La clé est lue depuis la table `settings` de la BDD.
 */

import OpenAI from 'openai';
import { SettingModel } from '../models/Setting.js';

/** Traduit un cartel. Retourne les champs _en enrichis. */
export async function translateCartel(cartelData) {
  const apiKey = await SettingModel.get('openai_key');
  if (!apiKey) throw new Error('Clé API non configurée dans les réglages.');

  const isDeepL = apiKey.endsWith(':fx') || (!apiKey.startsWith('sk-') && !apiKey.startsWith('proj-'));

  if (!isDeepL) {
    // ── OpenAI ──────────────────────────────────────────────────
    const client = new OpenAI({ apiKey });

    const payload = {
      titre:       cartelData.titre       || '',
      description: cartelData.description || '',
      location:    cartelData.location    || '',
    };

    const prompt = `You are a professional translator for a scientific exhibition about historical energy called "Paléo-Énergétique".
Translate the following JSON fields from French to English.
Return ONLY a valid JSON object with the same keys.
Keep empty strings empty. Do not add explanations.

Input:
${JSON.stringify(payload, null, 2)}`;

    const chat = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You translate JSON from French to English. Output only valid JSON.' },
        { role: 'user',   content: prompt },
      ],
      temperature: 0.2,
      max_tokens:  800,
    });

    const raw = chat.choices[0]?.message?.content?.trim() ?? '';

    // Extraire le JSON même si entouré de \`\`\`json ... \`\`\`
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ;
    const jsonStr = jsonMatch ? jsonMatch[1] : raw;

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error(`Réponse OpenAI non-JSON : ${raw.slice(0, 200)}`);
    }

    return {
      titre_en:       (parsed.titre       || '').trim(),
      description_en: (parsed.description || '').trim(),
      location_en:    (parsed.location    || '').trim(),
    };
  } else {
    // ── DeepL ───────────────────────────────────────────────────
    const isFree = apiKey.endsWith(':fx');
    const url = isFree ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';

    const fieldsToTranslate = [];
    const mapping = [];

    if (cartelData.titre) {
        fieldsToTranslate.push(cartelData.titre);
        mapping.push('titre_en');
    }
    if (cartelData.description) {
        fieldsToTranslate.push(cartelData.description);
        mapping.push('description_en');
    }
    if (cartelData.location) {
        fieldsToTranslate.push(cartelData.location);
        mapping.push('location_en');
    }

    if (fieldsToTranslate.length === 0) {
        return { titre_en: '', description_en: '', location_en: '' };
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `DeepL-Auth-Key ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: fieldsToTranslate,
            target_lang: 'EN'
        })
    });

    if (!response.ok) {
        let errorMsg = response.statusText;
        try {
            const errBody = await response.json();
            errorMsg = errBody.message || errorMsg;
        } catch (e) {
            // On ignore l'erreur de parsing
        }
        throw new Error(`Erreur DeepL API: ${response.status} - ${errorMsg}`);
    }

    const data = await response.json();
    
    if (!data.translations || !Array.isArray(data.translations)) {
        throw new Error(`Réponse DeepL invalide`);
    }

    const result = {
        titre_en: cartelData.titre_en || '',
        description_en: cartelData.description_en || '',
        location_en: cartelData.location_en || ''
    };

    mapping.forEach((key, index) => {
        result[key] = data.translations[index].text;
    });

    return result;
  }
}
