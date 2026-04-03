import { SettingModel } from '../models/Setting.js';

export const SettingController = {

  async getAll(req, res) {
    try {
      const settings = await SettingModel.getAll();
      // Masquer la clé OpenAI complète (ne renvoyer que si elle est définie ou non)
      const safe = { ...settings };
      if (safe.openai_key) safe.openai_key_set = true;
      delete safe.openai_key; // Ne jamais exposer la clé brute en GET
      res.json(safe);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /** GET /api/settings/openai-key — Admin only, retourne la clé complète */
  async getOpenAIKey(req, res) {
    try {
      const key = await SettingModel.get('openai_key');
      res.json({ openai_key: key || '' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateMany(req, res) {
    try {
      const allowed = [
        'allow_anonymous_submit',
        'max_submissions_per_ip_total',
        'max_submissions_per_ip_window',
        'submission_window_minutes',
        'openai_key',
      ];
      const pairs = {};
      for (const key of allowed) {
        if (key in req.body) pairs[key] = req.body[key];
      }
      if (!Object.keys(pairs).length) {
        return res.status(400).json({ error: 'Aucun paramètre valide fourni' });
      }
      await SettingModel.setMany(pairs);
      const updated = await SettingModel.getAll();
      delete updated.openai_key;
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
