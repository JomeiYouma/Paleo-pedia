/**
 * translateController.js
 * POST /api/translate       — Traduit un cartel FR↔EN via OpenAI ou DeepL.
 * POST /api/translate/bulk  — Traduit une sélection de cartels vers une langue
 *                             arbitraire (frise traduite). OpenAI uniquement.
 * Routes admin (token requis).
 */

import { translateCartel, translateCartelToLanguage, translateLabelsAndCategories, translateFields } from '../services/translationService.js';
import { CartelModel } from '../models/Cartel.js';
import { resolveCartelExportScope, cartelMatchesExportScope } from '../middleware/tenant.js';

export const TranslateController = {
  /**
   * POST /api/translate/fields
   * Endpoint générique pour traduire un set de champs FR↔EN, utilisé par le
   * gestionnaire de contenu (team, press, prestations, shop).
   * Body : { fields: { key: text, ... }, target: 'en' | 'fr' }
   * Renvoie : { key: translated, ... }
   */
  async translateFields(req, res) {
    try {
      const { fields, target } = req.body || {};
      if (!fields || typeof fields !== 'object') {
        return res.status(400).json({ error: 'Champ `fields` requis (objet clé/valeur).' });
      }
      const normalizedTarget = target === 'fr' ? 'fr' : 'en';
      const out = await translateFields(fields, { target: normalizedTarget });
      res.json(out);
    } catch (err) {
      const status = err.message.includes('Clé API non configurée') ? 503 : 500;
      res.status(status).json({ error: err.message });
    }
  },

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

      // Charger les cartels une seule fois, EN RESTANT dans le périmètre du
      // compte (modèle v33) : on écarte silencieusement les ids hors périmètre
      // pour ne pas exposer les cartels d'un autre sous-site.
      const scope = resolveCartelExportScope(req);
      const cartels = (await Promise.all(ids.map(id => CartelModel.findById(id))))
        .filter(Boolean)
        .filter(c => cartelMatchesExportScope(c, scope));

      // Traduire en parallèle limité (5 à la fois pour éviter de saturer l'API)
      const translations = [];
      const concurrency = 5;
      for (let i = 0; i < cartels.length; i += concurrency) {
        const slice = cartels.slice(i, i + concurrency);
        const results = await Promise.all(slice.map(async (c) => {
          // Si la langue source est EN, on lit les champs _en, sinon les champs FR.
          // `annee` n'a pas de variante _en (un seul champ DB) — OpenAI gère
          // la conversion roman/arabe + "siècle/century" → langue cible.
          const fields = normalizedSource === 'en'
            ? {
                titre:       c.titre_en       || c.titre       || '',
                annee:       c.annee          || '',
                description: c.description_en || c.description || '',
                location:    c.location_en    || c.location    || '',
              }
            : {
                titre:       c.titre       || '',
                annee:       c.annee       || '',
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

      // Libellés UI + catégories uniques traduits en un seul appel supplémentaire,
      // pour que generatePdf puisse afficher "Exhumé par", "Catégories", noms de
      // catégories, etc. dans la langue cible.
      const sourceLabels = normalizedSource === 'en'
        ? { moreText: 'Read more', exhumeText: 'Exhumed by', catText: 'Categories', creditText: 'Image source', unknownText: 'Unknown' }
        : { moreText: 'Pour aller plus loin', exhumeText: 'Exhumé par', catText: 'Catégories', creditText: 'Source image', unknownText: 'Inconnu' };

      const catKey = normalizedSource === 'en' ? 'categories_en' : 'categories';
      const uniqueCats = [...new Set(
        cartels.flatMap(c => (Array.isArray(c[catKey]) ? c[catKey] : c.categories) || [])
               .filter(Boolean)
      )];

      let labels = sourceLabels;
      let categoryMap = {};
      try {
        const localized = await translateLabelsAndCategories({
          labels: sourceLabels,
          categories: uniqueCats,
          sourceLang: normalizedSource,
          targetLanguageName: String(targetLanguage).trim(),
        });
        labels = { ...sourceLabels, ...localized.labels };
        uniqueCats.forEach((src, i) => {
          if (localized.categories[i]) categoryMap[src] = localized.categories[i];
        });
      } catch (e) {
        // Si la traduction des libellés échoue, on n'empêche pas l'export :
        // on retombe sur les libellés source.
        console.warn('[translate.bulk] échec libellés/catégories, fallback source:', e.message);
      }

      res.json({ translations, labels, categoryMap });
    } catch (err) {
      const status = err.message.includes('Clé API non configurée') ? 503 : 500;
      res.status(status).json({ error: err.message });
    }
  },
};
