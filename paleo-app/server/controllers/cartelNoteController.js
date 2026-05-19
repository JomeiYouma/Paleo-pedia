/**
 * cartelNoteController.js — Notes admin internes par cartel.
 *
 * Règle d'accès : tout utilisateur authentifié qui a accès au cartel (via le
 * scope habituel main/main_feed/sous-site) peut lire, créer et supprimer
 * n'importe quelle note de ce cartel. Pas de notion de "propriétaire de la
 * note" — on est entre admins de confiance.
 */
import { CartelModel }     from '../models/Cartel.js';
import { CartelNoteModel } from '../models/CartelNote.js';

const MAX_NOTE_LENGTH = 5000;

function resolveSubsiteFilter(req) {
  if (req.tenant) return { id: req.tenant.id };
  if (req.user?.can_manage_admin) return 'none';
  if (req.user?.home_subsite_id) return { id: req.user.home_subsite_id };
  return null; // pas d'admin → pas d'accès
}

function cartelInScope(cartel, filter) {
  if (!filter) return false;
  if (filter === 'none') return true;
  if (filter && typeof filter === 'object') return cartel.subsite_id === filter.id;
  return false;
}

async function loadCartelForAdmin(req, res) {
  const cartel = await CartelModel.findById(req.params.id);
  if (!cartel) { res.status(404).json({ error: 'Cartel introuvable' }); return null; }
  const filter = resolveSubsiteFilter(req);
  if (!cartelInScope(cartel, filter)) {
    res.status(404).json({ error: 'Cartel introuvable' });
    return null;
  }
  return cartel;
}

export const CartelNoteController = {

  async list(req, res) {
    try {
      const cartel = await loadCartelForAdmin(req, res);
      if (!cartel) return;
      const notes = await CartelNoteModel.findByCartel(cartel.id);
      res.json(notes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const cartel = await loadCartelForAdmin(req, res);
      if (!cartel) return;

      const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
      if (!body) return res.status(400).json({ error: 'Note vide' });
      if (body.length > MAX_NOTE_LENGTH) {
        return res.status(400).json({ error: `Note trop longue (max ${MAX_NOTE_LENGTH} caractères)` });
      }

      const note = await CartelNoteModel.create({
        cartelId: cartel.id,
        authorId: req.user.id,
        authorEmail: req.user.email || '',
        body,
      });
      res.status(201).json(note);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const cartel = await loadCartelForAdmin(req, res);
      if (!cartel) return;

      const note = await CartelNoteModel.findById(req.params.noteId);
      if (!note || note.cartel_id !== cartel.id) {
        return res.status(404).json({ error: 'Note introuvable' });
      }
      await CartelNoteModel.delete(note.id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
