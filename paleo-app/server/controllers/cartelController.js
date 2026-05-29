import { CartelModel } from '../models/Cartel.js';
import { WorkshopModel } from '../models/Workshop.js';
import { dispatchEvent } from '../services/eventDispatcher.js';

// Helper local : dispatch fire-and-forget (jamais bloquant)
const dispatch = (args) => { dispatchEvent(args).catch(() => {}); };

const VALID_STATUSES = ['draft', 'pending_review', 'published', 'archived'];

/**
 * Longueurs maximales par champ (en caractères). Bornes raisonnables pour
 * éviter qu'un client envoie 10 Mo de texte dans description et sature la BDD.
 * Un visiteur légitime ne dépassera jamais ces limites ; un bot/attaque oui.
 */
const MAX_LENGTHS = {
  titre:          200,
  titre_en:       200,
  annee:          50,
  description:    10000,
  description_en: 10000,
  exhume_par:     200,
  location:       300,
  location_en:    300,
  image_credit:   300,
  imageCredit:    300,
  image_path:     500,
  url_qr:         500,
  submitter_contact: 255,
};

/**
 * Valide la taille des champs texte présents dans `data`. Retourne un message
 * d'erreur lisible si un champ dépasse la limite, `null` sinon. On ignore les
 * champs absents pour rester compatible avec les updates partiels.
 */
function validateFieldLengths(data) {
  if (!data || typeof data !== 'object') return 'Payload invalide';
  for (const [field, max] of Object.entries(MAX_LENGTHS)) {
    const v = data[field];
    if (typeof v === 'string' && v.length > max) {
      return `Le champ "${field}" dépasse la longueur maximale (${max} caractères).`;
    }
  }
  // details_blocks : tableau JSON sérialisé en BDD. Borne à ~500 Ko de JSON
  // pour éviter qu'un client envoie un payload géant. Largement suffisant
  // pour des dizaines de blocs (texte, image, vidéo embed, etc.).
  if ('details_blocks' in data && data.details_blocks != null) {
    if (!Array.isArray(data.details_blocks)) {
      return 'details_blocks doit être un tableau';
    }
    try {
      const serialized = JSON.stringify(data.details_blocks);
      if (serialized.length > 500_000) {
        return 'details_blocks dépasse la taille maximale (500 Ko)';
      }
    } catch {
      return 'details_blocks contient des données non sérialisables';
    }
  }
  return null;
}

function sanitizeWorkshopFields(body, canManageAdmin) {
  if (canManageAdmin) return body;
  const cleaned = { ...body };
  delete cleaned.workshop_ids;
  delete cleaned.workshopIds;
  return cleaned;
}

/**
 * Calcule le filtre de scope à partir de la requête. Règles :
 *   - Route /s/:slug/*                        → scope = ce sous-site précis
 *   - Superadmin global sur /cartels          → 'none' (voit tout)
 *   - Utilisateur rattaché à un sous-site     → son home_subsite_id
 *   - Anonyme sur /cartels (lecture)          → 'main_feed' (main + submissions validées)
 *   - Anonyme sur /cartels (écriture)         → 'main' (submission au site principal)
 */
function resolveSubsiteFilter(req, { anonymousIsMainFeed = true } = {}) {
  // En mode atelier, on signale workshopId au modèle pour que le filtrage
  // se fasse via workshop_cartels (vue live) plutôt que cartels.subsite_id.
  if (req.tenant) {
    return req.tenant.workshop_id
      ? { id: req.tenant.id, workshopId: req.tenant.workshop_id }
      : { id: req.tenant.id };
  }
  if (req.user?.can_manage_admin) return 'none';
  if (req.user?.home_subsite_id) return { id: req.user.home_subsite_id };
  return anonymousIsMainFeed ? 'main_feed' : 'main';
}

/** Vérifie qu'un cartel chargé en BDD tombe bien dans le scope autorisé.
 *  Le cartel doit avoir été chargé avec `includeWorkshops: true` quand le
 *  filtre est en mode atelier (sinon cartel.workshopIds est undefined). */
function cartelInScope(cartel, filter) {
  if (filter === 'none') return true;
  if (filter === 'main')      return cartel.subsite_id === null;
  if (filter === 'main_feed') return cartel.subsite_id === null || !!cartel.visible_on_main;
  if (filter && typeof filter === 'object') {
    // Mode atelier : « in scope » couvre deux cas :
    //   - le cartel est subsite-owned (cas des cartels créés via ce subsite-atelier)
    //   - le cartel est membre de l'atelier source (cas des cartels existants
    //     du main que l'équipe du subsite a la responsabilité de modérer)
    if (filter.workshopId) {
      return cartel.subsite_id === filter.id
          || (Array.isArray(cartel.workshopIds) && cartel.workshopIds.includes(filter.workshopId));
    }
    return cartel.subsite_id === filter.id;
  }
  return false;
}

/** True si le filtre actuel impose le chargement des workshops du cartel
 *  (utile pour cartelInScope en mode atelier). À combiner avec
 *  includeWorkshops dans les findById/findAll. */
function filterNeedsWorkshops(filter) {
  return !!(filter && typeof filter === 'object' && filter.workshopId);
}

/** Helper : charge un cartel par id en s'assurant que workshops sont
 *  chargés si le filtre l'impose. Centralise le pattern findById+cartelInScope
 *  utilisé par toutes les routes single-cartel (PATCH/DELETE/getOne…).
 *  Retourne le cartel si in-scope, null sinon (le caller renvoie un 404). */
async function loadCartelInScope(id, filter) {
  const cartel = await CartelModel.findById(id, {
    includeWorkshops: filterNeedsWorkshops(filter) || filter === 'none',
  });
  if (!cartel) return null;
  if (!cartelInScope(cartel, filter)) return null;
  return cartel;
}

/** True si l'utilisateur, en tant qu'owner d'un subsite, est légitime
 *  pour modérer ce cartel. Couvre :
 *   - cartels directement rattachés au subsite (cartels.subsite_id = home)
 *   - cartels membres de l'atelier source d'un subsite-atelier (vue live)
 *  La 2ᵉ branche n'est testable que si le cartel a été chargé avec
 *  includeWorkshops:true (workshopIds présent). */
function canTenantOwnerEdit(req, cartel) {
  if (!req.user?.can_manage_team) return false;
  if (cartel.subsite_id && cartel.subsite_id === req.user.home_subsite_id) return true;
  // Pour la branche atelier, il faut que la requête soit dans le tenant courant
  // (req.tenant) pour qu'on connaisse le workshop_id sans nouveau round-trip BDD.
  if (req.tenant?.workshop_id && req.tenant.id === req.user.home_subsite_id
      && Array.isArray(cartel.workshopIds)
      && cartel.workshopIds.includes(req.tenant.workshop_id)) {
    return true;
  }
  return false;
}

/** Résout le subsite_id à stocker pour un cartel créé via cette requête.
 *  En mode atelier, le cartel devient subsite-owned (subsite_id = tenant.id) :
 *  cela permet l'édition ultérieure par les owners ET le passage par le flow
 *  soumissions supplémentaires quand le cartel est publié. */
function resolveTargetSubsiteId(req) {
  if (req.tenant) return req.tenant.id;
  // Sur /cartels, un admin rattaché à un sous-site crée dans son sous-site.
  // Un superadmin non rattaché crée sur le site principal (subsite_id = NULL).
  if (req.user?.home_subsite_id && !req.user?.can_manage_admin) return req.user.home_subsite_id;
  return null;
}

/**
 * Détermine le statut autorisé à la création selon l'identité de l'émetteur.
 *
 * Un visiteur anonyme ne peut JAMAIS publier directement : son cartel part
 * toujours en `pending_review`, quel que soit le `status` envoyé dans le body.
 * Sans cette garde, un attaquant peut POST avec `{status: 'published'}` et
 * contourner la modération (le modèle respectait `data.status ?? 'draft'`).
 */
function resolveCreateStatus(req, requestedStatus) {
  // Anonyme : on force pending_review, point final.
  if (!req.user) return 'pending_review';

  // Authentifié mais sans permission de publier : il peut au mieux soumettre
  // en pending_review ; on refuse 'published' et 'archived' silencieusement
  // en les ramenant à un brouillon.
  if (!req.user.can_publish_cartel && !req.user.can_manage_admin) {
    if (requestedStatus === 'published' || requestedStatus === 'archived') {
      return 'pending_review';
    }
    return VALID_STATUSES.includes(requestedStatus) ? requestedStatus : 'draft';
  }

  // Permissions suffisantes : on respecte le choix du client s'il est valide.
  return VALID_STATUSES.includes(requestedStatus) ? requestedStatus : 'draft';
}

/**
 * Auto-submission au site principal : ne déclenche que si le cartel est sur
 * un sous-site ET publié localement ET pas encore visible sur le principal.
 *   - Brouillons / pending_review : pas de soumission (l'owner modère d'abord)
 *   - Déjà approuvé (visible_on_main=1) : on ne re-queue pas, l'owner peut
 *     retirer+soumettre manuellement s'il veut une re-validation
 */
async function maybeAutoSubmitToMain(cartel) {
  if (!cartel) return cartel;
  if (!cartel.subsite_id) return cartel;
  if (cartel.status !== 'published') return cartel;
  if (cartel.visible_on_main) return cartel;
  if (cartel.submitted_to_main_at) return cartel; // déjà en file, idempotent
  return await CartelModel.markSubmittedToMain(cartel.id);
}

export const CartelController = {

  async getAll(req, res) {
    try {
      const isAdmin = req.user?.can_manage_admin || !!req.user?.home_subsite_id;
      const { category, search, limit, offset } = req.query;

      const filters = {
        category, search,
        limit:  limit  ? parseInt(limit)  : 5000,
        offset: offset ? parseInt(offset) : 0,
        subsiteFilter: resolveSubsiteFilter(req),
      };

      if (!isAdmin) filters.status = 'published';
      // Toujours inclure les workshops : le frontend en a besoin pour filtrer
      // l'affichage public des subsites-ateliers (Library/SubsiteFrise matchent
      // les cartels par appartenance à l'atelier, pas seulement par subsite_id).
      filters.includeWorkshops = true;

      const cartels = await CartelModel.findAll(filters);
      res.json(cartels);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getOne(req, res) {
    try {
      const filter = resolveSubsiteFilter(req);
      const cartel = await loadCartelInScope(req.params.id, filter);
      // Ne pas divulguer l'existence du cartel hors scope
      if (!cartel) return res.status(404).json({ error: 'Cartel introuvable' });
      res.json(cartel);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const lengthError = validateFieldLengths(req.body);
      if (lengthError) return res.status(400).json({ error: lengthError });

      const targetSubsiteId = resolveTargetSubsiteId(req);
      const body = sanitizeWorkshopFields(req.body, req.user?.can_manage_admin);
      // Le statut du client est ignoré si l'utilisateur n'est pas autorisé à le choisir
      // (cf. resolveCreateStatus). Évite qu'un visiteur anonyme poste {status:'published'}.
      body.status = resolveCreateStatus(req, body.status);
      let cartel = await CartelModel.create(
        body,
        req.user?.id ?? null,
        req.submitterIp ?? null,
        targetSubsiteId,
      );
      // Subsite-atelier : le nouveau cartel rejoint automatiquement l'atelier
      // source. Sans ça, le cartel serait subsite-owned mais invisible dans la
      // vue live (filtre via workshop_cartels).
      if (req.tenant?.workshop_id) {
        await WorkshopModel.addCartels(req.tenant.workshop_id, [cartel.id]);
      }
      cartel = await maybeAutoSubmitToMain(cartel);

      // Choix du type d'event : anonyme → submission_pending, sinon selon statut
      let eventType;
      if (!req.user) eventType = 'cartel.submission_pending';
      else if (cartel.status === 'published') eventType = cartel.subsite_id ? 'cartel.subsite_published' : 'cartel.published';
      else if (cartel.status === 'draft') eventType = 'cartel.draft_created';
      else eventType = 'cartel.created';
      dispatch({
        type: eventType, req,
        targetId: cartel.id, subsiteId: cartel.subsite_id ?? null,
        summary: cartel.titre || '(sans titre)',
        payload: { status: cartel.status, anonymous: !req.user },
      });
      res.status(201).json(cartel);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const lengthError = validateFieldLengths(req.body);
      if (lengthError) return res.status(400).json({ error: lengthError });

      const filter = resolveSubsiteFilter(req, { anonymousIsMainFeed: false });
      const existing = await loadCartelInScope(req.params.id, filter);
      if (!existing) return res.status(404).json({ error: 'Cartel introuvable' });

      const isOwner = existing.created_by === req.user.id;
      const isEditor = req.user.can_publish_cartel || req.user.can_manage_admin;
      // Owner d'un sous-site : peut modérer tout cartel rattaché à son sous-site,
      // soit directement (subsite_id) soit via l'atelier source (subsite-atelier).
      const isTenantOwnerOfThisCartel = canTenantOwnerEdit(req, existing);
      if (!isOwner && !isEditor && !isTenantOwnerOfThisCartel) {
        return res.status(403).json({ error: 'Non autorisé' });
      }

      let cartel = await CartelModel.update(
        req.params.id,
        sanitizeWorkshopFields(req.body, req.user?.can_manage_admin)
      );
      cartel = await maybeAutoSubmitToMain(cartel);

      // Si la modif passe le statut à "published", c'est sémantiquement une publication
      const becamePublished = existing.status !== 'published' && cartel.status === 'published';
      dispatch({
        type: becamePublished
          ? (cartel.subsite_id ? 'cartel.subsite_published' : 'cartel.published')
          : 'cartel.updated',
        req,
        targetId: cartel.id, subsiteId: cartel.subsite_id ?? null,
        summary: cartel.titre || '(sans titre)',
        payload: { previousStatus: existing.status, status: cartel.status },
      });
      res.json(cartel);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async setStatus(req, res) {
    try {
      const { status } = req.body;
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Statut invalide. Valeurs acceptées: ${VALID_STATUSES.join(', ')}` });
      }

      const filter = resolveSubsiteFilter(req, { anonymousIsMainFeed: false });
      const existing = await loadCartelInScope(req.params.id, filter);
      if (!existing) return res.status(404).json({ error: 'Cartel introuvable' });

      if (status === 'published' && !req.user.can_publish_cartel) {
        return res.status(403).json({ error: 'Permission can_publish_cartel requise' });
      }

      let cartel = await CartelModel.setStatus(req.params.id, status);
      // Publier un cartel de sous-site → l'envoyer en file de validation principale
      cartel = await maybeAutoSubmitToMain(cartel);

      const becamePublished = existing.status !== 'published' && cartel.status === 'published';
      dispatch({
        type: becamePublished
          ? (cartel.subsite_id ? 'cartel.subsite_published' : 'cartel.published')
          : 'cartel.updated',
        req,
        targetId: cartel.id, subsiteId: cartel.subsite_id ?? null,
        summary: cartel.titre || '(sans titre)',
        payload: { previousStatus: existing.status, status: cartel.status },
      });
      res.json(cartel);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async delete(req, res) {
    try {
      const filter = resolveSubsiteFilter(req, { anonymousIsMainFeed: false });
      const existing = await loadCartelInScope(req.params.id, filter);
      if (!existing) return res.status(404).json({ error: 'Cartel introuvable' });

      const isOwner = existing.created_by === req.user.id;
      const isAdmin = req.user.can_manage_admin;
      const isTenantOwnerOfThisCartel = canTenantOwnerEdit(req, existing);
      if (!isOwner && !isAdmin && !isTenantOwnerOfThisCartel) {
        return res.status(403).json({ error: 'Non autorisé' });
      }

      await CartelModel.delete(req.params.id);
      dispatch({
        type: 'cartel.deleted', req,
        targetId: existing.id, subsiteId: existing.subsite_id ?? null,
        summary: existing.titre || '(sans titre)',
        payload: { status: existing.status },
      });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * Agrégations pour la page Stats admin.
   *
   * Accessible aux admins (superadmin ou rattachés à un sous-site). Le
   * superadmin peut filtrer librement par sous-site (?subsiteId=...) ou voir
   * l'ensemble. Un admin de sous-site est cloué à son propre périmètre peu
   * importe ce qu'il envoie dans la query, comme dans le reste de l'app.
   */
  async getStats(req, res) {
    try {
      const isSuperadmin = !!req.user?.can_manage_admin;
      const isTenantAdmin = !!req.user?.home_subsite_id;
      if (!isSuperadmin && !isTenantAdmin) {
        return res.status(403).json({ error: 'Non autorisé' });
      }

      let subsiteFilter;
      if (isSuperadmin) {
        const sub = req.query.subsiteId;
        if (sub === 'main') subsiteFilter = 'main';
        else if (sub && sub !== 'all') subsiteFilter = { id: sub };
        else subsiteFilter = 'none';
      } else {
        subsiteFilter = { id: req.user.home_subsite_id };
      }

      const csv = (v) => (typeof v === 'string' && v.length ? v.split(',').filter(Boolean) : undefined);

      const filters = {
        subsiteFilter,
        categoryIds: csv(req.query.categoryIds),
        statuses:    csv(req.query.statuses),
        createdFrom: req.query.createdFrom || undefined,
        createdTo:   req.query.createdTo   || undefined,
        yearMin:     req.query.yearMin     || undefined,
        yearMax:     req.query.yearMax     || undefined,
        exhumePar:   req.query.exhumePar   || undefined,
        visible:     req.query.visible === 'true' ? true
                   : req.query.visible === 'false' ? false
                   : undefined,
      };

      const stats = await CartelModel.getStats(filters);
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ── Workflow soumission au site principal ──────────────────

  /** Owner d'un sous-site soumet un cartel publié pour affichage sur le site principal */
  async submitToMain(req, res) {
    try {
      const filter = resolveSubsiteFilter(req, { anonymousIsMainFeed: false });
      const existing = await loadCartelInScope(req.params.id, filter);
      if (!existing) return res.status(404).json({ error: 'Cartel introuvable' });

      // Un cartel de sous-site uniquement, publié localement
      if (existing.subsite_id === null) {
        return res.status(400).json({ error: 'Seul un cartel de sous-site peut être soumis au site principal' });
      }
      if (existing.status !== 'published') {
        return res.status(400).json({ error: 'Seul un cartel publié peut être soumis' });
      }

      const isOwnerOfTenant = !!req.user?.can_manage_team && req.user.home_subsite_id === existing.subsite_id;
      const isSuperadmin = !!req.user?.can_manage_admin;
      if (!isOwnerOfTenant && !isSuperadmin) {
        return res.status(403).json({ error: 'Permission can_manage_team requise' });
      }

      const cartel = await CartelModel.markSubmittedToMain(req.params.id);
      dispatch({
        type: 'cartel.subsite_submitted', req,
        targetId: cartel.id, subsiteId: cartel.subsite_id ?? null,
        summary: cartel.titre || '(sans titre)',
        payload: { subsite_id: cartel.subsite_id },
      });
      res.json(cartel);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /** Owner retire une soumission (annule la demande ou retire un cartel déjà approuvé) */
  async withdrawFromMain(req, res) {
    try {
      const filter = resolveSubsiteFilter(req, { anonymousIsMainFeed: false });
      const existing = await loadCartelInScope(req.params.id, filter);
      if (!existing) return res.status(404).json({ error: 'Cartel introuvable' });
      if (existing.subsite_id === null) {
        return res.status(400).json({ error: 'Non applicable aux cartels du site principal' });
      }

      const isOwnerOfTenant = !!req.user?.can_manage_team && req.user.home_subsite_id === existing.subsite_id;
      const isSuperadmin = !!req.user?.can_manage_admin;
      if (!isOwnerOfTenant && !isSuperadmin) {
        return res.status(403).json({ error: 'Permission can_manage_team requise' });
      }

      const cartel = await CartelModel.clearSubmissionToMain(req.params.id);
      res.json(cartel);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /** Superadmin : liste les cartels soumis en attente de décision */
  async listSubmissions(req, res) {
    try {
      const { limit, offset } = req.query;
      const cartels = await CartelModel.findPendingSubmissions({
        limit:  limit  ? parseInt(limit)  : 50,
        offset: offset ? parseInt(offset) : 0,
      });
      res.json(cartels);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /** Superadmin : approuve un cartel soumis → visible_on_main = 1 */
  async approveSubmission(req, res) {
    try {
      const existing = await CartelModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Cartel introuvable' });
      if (!existing.submitted_to_main_at || existing.subsite_id === null) {
        return res.status(400).json({ error: 'Ce cartel n\'est pas en attente de validation' });
      }
      const cartel = await CartelModel.approveForMain(req.params.id);
      dispatch({
        type: 'cartel.subsite_approved', req,
        targetId: cartel.id, subsiteId: cartel.subsite_id ?? null,
        summary: cartel.titre || '(sans titre)',
      });
      res.json(cartel);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /** Superadmin : rejette une soumission → retire de la file d'attente */
  async rejectSubmission(req, res) {
    try {
      const existing = await CartelModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Cartel introuvable' });
      if (!existing.submitted_to_main_at || existing.subsite_id === null) {
        return res.status(400).json({ error: 'Ce cartel n\'est pas en attente de validation' });
      }
      const cartel = await CartelModel.clearSubmissionToMain(req.params.id);
      dispatch({
        type: 'cartel.subsite_rejected', req,
        targetId: cartel.id, subsiteId: cartel.subsite_id ?? null,
        summary: cartel.titre || '(sans titre)',
      });
      res.json(cartel);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
