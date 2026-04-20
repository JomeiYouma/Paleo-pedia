/**
 * translateController.js
 * POST /api/translate — Traduit les champs d'un cartel via OpenAI.
 * Nécessite un token admin.
 */

import { translateCartel } from '../services/translationService.js';

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
};
