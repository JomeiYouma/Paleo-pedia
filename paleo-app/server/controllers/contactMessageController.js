/**
 * contactMessageController.js
 * Soumission publique du formulaire /contact. Validation simple +
 * honeypot anti-bot, puis dispatchEvent pour journaliser + notifier
 * par email selon la config.
 */
import { ContactMessageModel } from '../models/ContactMessage.js';
import { dispatchEvent }       from '../services/eventDispatcher.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ContactMessageController = {

  async create(req, res) {
    try {
      const body = req.body || {};

      // Honeypot : un humain ne remplit pas ce champ caché.
      if (typeof body.website === 'string' && body.website.trim() !== '') {
        return res.status(400).json({ error: 'Requête invalide.' });
      }

      const name    = (body.name    || '').trim();
      const email   = (body.email   || '').trim();
      const subject = (body.subject || '').trim() || null;
      const message = (body.message || '').trim();

      if (!name)    return res.status(400).json({ error: 'Le nom est requis.' });
      if (!email)   return res.status(400).json({ error: "L'e-mail est requis." });
      if (!message) return res.status(400).json({ error: 'Le message est requis.' });
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'E-mail invalide.' });
      if (name.length    > 255)  return res.status(400).json({ error: 'Nom trop long.' });
      if (email.length   > 255)  return res.status(400).json({ error: 'E-mail trop long.' });
      if (subject && subject.length > 500) return res.status(400).json({ error: 'Sujet trop long.' });
      if (message.length > 10000) return res.status(400).json({ error: 'Message trop long (10 000 caractères max).' });

      const ip = req.ip || null;
      const created = await ContactMessageModel.create({
        name, email, subject, message, submitterIp: ip,
      });

      dispatchEvent({
        type: 'contact_message.created',
        actorEmail: email,
        targetId: created.id,
        summary: subject ? `${name} — ${subject}` : name,
        payload: { name, email, subject, message },
      }).catch(() => { /* swallow */ });

      res.status(201).json({ ok: true, id: created.id });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  },

  async list(req, res) {
    try {
      const data = await ContactMessageModel.findAll({ limit: req.query.limit });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
