/**
 * teamMemberController.js
 * CRUD des membres de l'équipe affichés sur la page publique « À propos ».
 *
 * Scoping (v27) : chaque appel résout son scope via req.tenant si présent
 * (route /s/:slug/team-members) ou via la query ?subsiteId=... pour le
 * superadmin global. Le scope par défaut (route /team-members sans tenant
 * et sans query) reste l'équipe du site principal (subsite_id IS NULL).
 *
 * Permissions :
 *   - Lecture publique (pas d'auth).
 *   - Écriture : superadmin (n'importe quel scope) OU owner du subsite
 *     courant pour les routes scopées.
 *
 * Note : nommé "teamMember" et pas "team" pour éviter la collision avec
 * teamController.js (qui gère les comptes utilisateurs des sous-sites).
 */
import { TeamMemberModel } from '../models/TeamMember.js';
import { dispatchEvent } from '../services/eventDispatcher.js';

// Helper local : journalisation fire-and-forget (jamais bloquante).
const dispatch = (args) => { dispatchEvent(args).catch(() => {}); };

/** Résout le subsite_id cible :
 *   - req.tenant      → subsite courant
 *   - ?subsiteId=...  → superadmin uniquement (sinon ignoré)
 *   - sinon           → site principal (null)
 *  La query string accepte 'all' = tout (superadmin uniquement). */
function resolveScope(req) {
  if (req.tenant) return req.tenant.id;
  if (req.user?.can_manage_admin) {
    const q = req.query?.subsiteId;
    if (q === 'all') return 'all';
    if (q === 'main' || q === null) return null;
    if (q) return q;
  }
  return null;
}

/**
 * True si l'utilisateur peut écrire dans le scope demandé (modèle v33).
 *   - superadmin : partout
 *   - route sous-site (/s/:slug) : owner OU gestionnaire de contenu rattaché à CE sous-site
 *   - route principale : compte principal (home_subsite_id null) avec can_manage_content
 */
function canWrite(req) {
  if (req.user?.can_manage_admin) return true;
  if (req.tenant) {
    if (req.tenant.id !== req.user?.home_subsite_id) return false;
    return !!req.user?.can_manage_team || !!req.user?.can_manage_content;
  }
  return req.user?.home_subsite_id == null && !!req.user?.can_manage_content;
}

export const TeamMemberController = {

  async getAll(req, res) {
    try {
      const scope = resolveScope(req);
      // Sur les routes publiques scopées (anonyme), on retombe sur l'équipe
      // du site principal si le subsite n'a pas encore configuré la sienne.
      // En revanche pour l'admin (lecture explicite de l'équipe du subsite),
      // on ne fait pas le fallback pour ne pas masquer l'état réel.
      const fallback = !req.user?.can_manage_admin && !req.user?.can_manage_team && !req.user?.can_manage_content;
      res.json(await TeamMemberModel.findAll({ subsiteId: scope, fallbackToMain: fallback }));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async create(req, res) {
    try {
      if (!canWrite(req)) return res.status(403).json({ error: 'Permission refusée' });
      const scope = resolveScope(req);
      // Quand 'all' (superadmin global hors tenant), on prend le subsiteId du body si fourni, sinon null.
      const targetSubsite = scope === 'all' ? (req.body?.subsite_id ?? null) : scope;
      const created = await TeamMemberModel.create(req.body || {}, { subsiteId: targetSubsite });
      dispatch({ type: 'team_member.created', req, targetId: created.id, subsiteId: targetSubsite, summary: created.name || '' });
      res.status(201).json(created);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  },

  async update(req, res) {
    try {
      if (!canWrite(req)) return res.status(403).json({ error: 'Permission refusée' });
      const existing = await TeamMemberModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Membre introuvable' });
      // Cross-tenant guard : un owner ne peut pas éditer un membre d'un autre subsite.
      if (req.tenant && existing.subsite_id !== req.tenant.id) {
        return res.status(404).json({ error: 'Membre introuvable' });
      }
      const updated = await TeamMemberModel.update(req.params.id, req.body || {});
      dispatch({ type: 'team_member.updated', req, targetId: req.params.id, subsiteId: existing.subsite_id ?? null, summary: updated?.name || existing.name || '' });
      res.json(updated);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  },

  async remove(req, res) {
    try {
      if (!canWrite(req)) return res.status(403).json({ error: 'Permission refusée' });
      const existing = await TeamMemberModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Membre introuvable' });
      if (req.tenant && existing.subsite_id !== req.tenant.id) {
        return res.status(404).json({ error: 'Membre introuvable' });
      }
      await TeamMemberModel.delete(req.params.id);
      dispatch({ type: 'team_member.deleted', req, targetId: req.params.id, subsiteId: existing.subsite_id ?? null, summary: existing.name || '' });
      res.sendStatus(204);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};
