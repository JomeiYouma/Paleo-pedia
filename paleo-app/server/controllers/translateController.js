/**
 * translateController.js
 * POST /api/translate — Traduit les champs d'un cartel via OpenAI.
 * Nécessite un token admin.
 */

import { translateCartel } from '../services/translationService.js';

export const TranslateController = {
  async translate(req, res) {
    try {
      const { titre, description, location } = req.body;
      if (!titre && !description) {
        return res.status(400).json({ error: 'Champs titre ou description requis.' });
      }
      const translations = await translateCartel({ titre, description, location });
      res.json(translations);
    } catch (err) {
      // Ne pas planter l'app si la clé est manquante : retourner un 503 clair
      const status = err.message.includes('Clé OpenAI') ? 503 : 500;
      res.status(status).json({ error: err.message });
    }
  },
};
