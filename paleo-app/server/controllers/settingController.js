import { SettingModel } from '../models/Setting.js';

export const SettingController = {

  async getAll(req, res) {
    try {
      const settings = await SettingModel.getAll();
      // Masquer les clés API complètes (ne renvoyer que des flags présence)
      const safe = { ...settings };
      if (safe.openai_key) safe.openai_key_set = true;
      if (safe.deepl_key)  safe.deepl_key_set  = true;
      delete safe.openai_key;
      delete safe.deepl_key;
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

  /** GET /api/settings/deepl-key — Admin only, retourne la clé complète */
  async getDeepLKey(req, res) {
    try {
      const key = await SettingModel.get('deepl_key');
      res.json({ deepl_key: key || '' });
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
        'deepl_key',
        'site_primary_partner_ids',
        'site_partner_ids',
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
      delete updated.deepl_key;
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
