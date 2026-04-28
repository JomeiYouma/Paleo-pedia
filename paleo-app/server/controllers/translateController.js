/**
 * translateController.js
 * POST /api/translate       — Traduit un cartel FR↔EN via OpenAI ou DeepL.
 * POST /api/translate/bulk  — Traduit une sélection de cartels vers une langue
 *                             arbitraire (frise traduite). OpenAI uniquement.
 * Routes admin (token requis).
 */

import { translateCartel, translateCartelToLanguage } from '../services/translationService.js';
import { CartelModel } from '../models/Cartel.js';

export const TranslateController = {
  async translate(req, res) {
    try {
      const { titre, description, location, target } = req.body;
      if (!titre && !description) {
        return res.status(400).json({ error: 'Champs titre ou description requis.' });
      }
      const normalizedTarget = target === 'fr' ? 'fr' : 'en';
      const translations = await translateCartel(
        { titre, description, location },
        { target: normalizedTarget }
      );
      res.json(translations);
    } catch (err) {
      // Ne pas planter l'app si la clé est manquante : retourner un 503 clair
      const status = err.message.includes('Clé API non configurée') ? 503 : 500;
      res.status(status).json({ error: err.message });
    }
  },

  /**
   * POST /api/translate/bulk
   * Body: { ids: string[], sourceLang: 'fr'|'en', targetLanguage: string }
   * Renvoie : { translations: [{ id, titre, description, location }] }
   * L'ordre suit l'ordre des ids reçus. Les ids inconnus sont ignorés.
   */
  async bulkTranslate(req, res) {
    try {
      const { ids, sourceLang, targetLanguage } = req.body || {};
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Liste d\'IDs requise.' });
      }
      if (!targetLanguage || !String(targetLanguage).trim()) {
        return res.status(400).json({ error: 'Langue cible requise.' });
      }
      const normalizedSource = sourceLang === 'en' ? 'en' : 'fr';

      // Charger les cartels une seule fois
      const cartels = (await Promise.all(ids.map(id => CartelModel.findById(id))))
        .filter(Boolean);

      // Traduire en parallèle limité (5 à la fois pour éviter de saturer l'API)
      const translations = [];
      const concurrency = 5;
      for (let i = 0; i < cartels.length; i += concurrency) {
        const slice = cartels.slice(i, i + concurrency);
        const results = await Promise.all(slice.map(async (c) => {
          // Si la langue source est EN, on lit les champs _en, sinon les champs FR
          const fields = normalizedSource === 'en'
            ? {
                titre:       c.titre_en       || c.titre       || '',
                description: c.description_en || c.description || '',
                location:    c.location_en    || c.location    || '',
              }
            : {
                titre:       c.titre       || '',
                description: c.description || '',
                location:    c.location    || '',
              };
          const out = await translateCartelToLanguage(fields, {
            sourceLang: normalizedSource,
            targetLanguageName: String(targetLanguage).trim(),
          });
          return { id: c.id, ...out };
        }));
        translations.push(...results);
      }

      res.json({ translations });
    } catch (err) {
      const status = err.message.includes('Clé API non configurée') ? 503 : 500;
      res.status(status).json({ error: err.message });
    }
  },
};
