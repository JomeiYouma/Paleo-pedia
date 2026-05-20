/**
 * missionApplicationController.js
 * Soumission publique du formulaire de candidature aux missions
 * (en bas de /participer). Validation simple + honeypot anti-bot,
 * puis dispatchEvent pour journaliser + notifier par email.
 */
import { MissionApplicationModel } from '../models/MissionApplication.js';
import { MissionModel }            from '../models/Mission.js';
import { dispatchEvent }           from '../services/eventDispatcher.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MissionApplicationController = {

  async create(req, res) {
    try {
      const body = req.body || {};

      // Honeypot : un humain ne remplit pas ce champ caché.
      if (typeof body.website === 'string' && body.website.trim() !== '') {
        return res.status(400).json({ error: 'Requête invalide.' });
      }

      const name      = (body.name || '').trim();
      const email     = (body.email || '').trim();
      const missionId = body.mission_id || null;
      const knowledge = (body.knowledge || '').trim() || null;

      if (!name)  return res.status(400).json({ error: 'Le nom est requis.' });
      if (!email) return res.status(400).json({ error: "L'e-mail est requis." });
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'E-mail invalide.' });
      if (name.length > 255 || email.length > 255) return res.status(400).json({ error: 'Champs trop longs.' });
      if (knowledge && knowledge.length > 5000)    return res.status(400).json({ error: 'Message trop long (5000 caractères max).' });

      // Si une mission est fournie, on récupère son nom pour le summary du log.
      let missionName = null;
      if (missionId) {
        const mission = await MissionModel.findById(missionId);
        if (mission) missionName = mission.name;
      }

      const ip = req.ip || null;
      const created = await MissionApplicationModel.create({
        name, email, missionId, knowledge, submitterIp: ip,
      });

      // Fire-and-forget : log + email éventuel
      dispatchEvent({
        type: 'mission_application.created',
        actorEmail: email,
        targetId: created.id,
        summary: missionName ? `${name} → ${missionName}` : name,
        payload: {
          name,
          email,
          mission_id: missionId,
          mission_name: missionName,
          knowledge,
        },
      }).catch(() => { /* swallow */ });

      // On ne renvoie pas la ligne complète (PII), juste un accusé.
      res.status(201).json({ ok: true, id: created.id });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  },

  async list(req, res) {
    try {
      const data = await MissionApplicationModel.findAll({ limit: req.query.limit });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
