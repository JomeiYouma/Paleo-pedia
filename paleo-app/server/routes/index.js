import { Router } from 'express';
import { AuthController }      from '../controllers/authController.js';
import { CartelController }    from '../controllers/cartelController.js';
import { CartelNoteController } from '../controllers/cartelNoteController.js';
import { CategoryController }  from '../controllers/CategoryController.js';
import { UserController }      from '../controllers/userController.js';
import { WorkshopController }  from '../controllers/workshopController.js';
import { SettingController }   from '../controllers/settingController.js';
import { UploadController, upload } from '../controllers/uploadController.js';
import { TranslateController } from '../controllers/translateController.js';
import { ImportController }    from '../controllers/importController.js';
import { ExportController }    from '../controllers/exportController.js';
import { authenticate, requireAdmin, requireExportOrAdmin, optionalAuth } from '../middleware/auth.js';
import { submissionGuard } from '../middleware/submissionGuard.js';
import { loginRateLimit } from '../middleware/loginGuard.js';
import { uploadGuard } from '../middleware/uploadGuard.js';
import { resolveTenant, requireTenantAccess } from '../middleware/tenant.js';
import { SubsiteController }  from '../controllers/subsiteController.js';
import { PartnerController }  from '../controllers/partnerController.js';
import { TeamController }     from '../controllers/teamController.js';
import { TeamMemberController } from '../controllers/teamMemberController.js';
import { PressArticleController } from '../controllers/pressArticleController.js';
import { MissionController } from '../controllers/missionController.js';
import { MissionApplicationController } from '../controllers/missionApplicationController.js';
import { ContactMessageController } from '../controllers/contactMessageController.js';
import { PrestationController } from '../controllers/prestationController.js';
import { ShopItemController } from '../controllers/shopItemController.js';
import { EventLogController } from '../controllers/eventLogController.js';

const router = Router();

// ── Auth ─────────────────────────────────────────────────────
router.post('/auth/register', AuthController.register);
router.post('/auth/login',    loginRateLimit, AuthController.login);
router.get ('/auth/me',       authenticate, AuthController.me);
router.post('/auth/change-password', authenticate, AuthController.changePassword);

// ── Cartels ──────────────────────────────────────────────────
// GET public : sans auth → ne voit que published+visible
// GET admin  : avec token → voit tout (géré dans le contrôleur)
// Auth optionnelle : admin voit tout, visiteur ne voit que published
router.get   ('/cartels', optionalAuth, CartelController.getAll);
// /cartels/stats DOIT précéder /cartels/:id sinon "stats" serait matché comme un id
router.get   ('/cartels/stats',      authenticate, CartelController.getStats);
router.get   ('/cartels/:id',        optionalAuth, CartelController.getOne);

// POST : auth optionnelle + guard de soumission anonyme
router.post  ('/cartels', optionalAuth, submissionGuard, CartelController.create);

router.patch ('/cartels/:id',        authenticate, CartelController.update);
router.patch ('/cartels/:id/status', authenticate, CartelController.setStatus);
router.delete('/cartels/:id',        authenticate, CartelController.delete);

// Notes admin internes (auth requise, scope = admin du cartel)
router.get   ('/cartels/:id/notes',           authenticate, CartelNoteController.list);
router.post  ('/cartels/:id/notes',           authenticate, CartelNoteController.create);
router.delete('/cartels/:id/notes/:noteId',   authenticate, CartelNoteController.remove);

// ── Categories ───────────────────────────────────────────────
router.get   ('/categories',         CategoryController.getAll);
router.get   ('/categories/:id',     CategoryController.getOne);
router.post  ('/categories',         authenticate, requireAdmin, CategoryController.create);
router.patch ('/categories/:id',     authenticate, requireAdmin, CategoryController.update);
router.delete('/categories/:id',     authenticate, requireAdmin, CategoryController.delete);

// ── Workshops ────────────────────────────────────────────────
router.get   ('/workshops',                            WorkshopController.getAll);
router.get   ('/workshops/:id',                        WorkshopController.getOne);
router.post  ('/workshops',          authenticate,     WorkshopController.create);
router.patch ('/workshops/:id',      authenticate,     WorkshopController.update);
router.post  ('/workshops/:id/cartels', authenticate,  WorkshopController.addCartels);
router.delete('/workshops/:id/cartels/:cartelId', authenticate, WorkshopController.removeCartel);
router.delete('/workshops/:id',      authenticate,     WorkshopController.delete);

// ── Settings (admin) ─────────────────────────────────────────
router.get   ('/settings',            authenticate, requireAdmin, SettingController.getAll);
router.get   ('/settings/openai-key', authenticate, requireAdmin, SettingController.getOpenAIKey);
router.get   ('/settings/deepl-key',  authenticate, requireAdmin, SettingController.getDeepLKey);
router.patch ('/settings',            authenticate, requireAdmin, SettingController.updateMany);

// ── Users (admin) ────────────────────────────────────────────
router.get   ('/users',              authenticate, requireAdmin, UserController.getAll);
router.post  ('/users',              authenticate, requireAdmin, UserController.create);
router.get   ('/users/:id',          authenticate, requireAdmin, UserController.getOne);
router.patch ('/users/:id',          authenticate, requireAdmin, UserController.update);
router.patch ('/users/:id/password', authenticate, requireAdmin, UserController.setPassword);
router.delete('/users/:id',          authenticate, requireAdmin, UserController.delete);

// ── Upload image ─────────────────────────────────────────────
// optionalAuth : autorise les visiteurs anonymes (pour la soumission publique
// de cartels avec image, côté site principal et côté /site/:slug). Multer
// borne déjà la taille et le type (20 Mo, images uniquement), uploadGuard
// ajoute un rate-limit par IP pour les visiteurs anonymes.
router.post('/upload', optionalAuth, uploadGuard, upload.single('image'), UploadController.uploadImage);

// ── Traduction (admin ; /bulk ouvert aux exportateurs pour la frise traduite) ──
router.post('/translate',        authenticate, requireAdmin, TranslateController.translate);
router.post('/translate/bulk',   authenticate, requireExportOrAdmin, TranslateController.bulkTranslate);
router.post('/translate/fields', authenticate, requireAdmin, TranslateController.translateFields);

// ── Import ZIP (admin) ───────────────────────────────────────
router.post('/import', authenticate, requireAdmin, ImportController.middleware, ImportController.importZip);

// ── Export archive (admin + exportateurs) ────────────────────
router.get('/export/image-check', authenticate, requireExportOrAdmin, ExportController.imageCheck);
router.get('/export',             authenticate, requireExportOrAdmin, ExportController.exportArchive);

// ── Sous-sites (public GET, admin write) ─────────────────────
router.get   ('/subsites',       SubsiteController.getAll);
router.get   ('/subsites/:slug', SubsiteController.getOne);
router.post  ('/subsites',       authenticate, requireAdmin, SubsiteController.create);
// PATCH : permission gérée dans le controller (superadmin OU owner du subsite courant).
router.patch ('/subsites/:slug', authenticate,                SubsiteController.update);
router.delete('/subsites/:slug', authenticate, requireAdmin, SubsiteController.remove);

// ── Routes scopées par sous-site (/s/:slug/*) ────────────────
// Lecture publique et soumission anonyme d'un sous-site donné.
// Les admins d'un tenant peuvent aussi y éditer (protégé par requireTenantAccess).
router.get   ('/s/:slug/cartels',              optionalAuth, resolveTenant, CartelController.getAll);
router.get   ('/s/:slug/cartels/:id',          optionalAuth, resolveTenant, CartelController.getOne);
router.post  ('/s/:slug/cartels',              optionalAuth, resolveTenant, submissionGuard, CartelController.create);
router.patch ('/s/:slug/cartels/:id',          authenticate, resolveTenant, requireTenantAccess, CartelController.update);
router.patch ('/s/:slug/cartels/:id/status',   authenticate, resolveTenant, requireTenantAccess, CartelController.setStatus);
router.delete('/s/:slug/cartels/:id',          authenticate, resolveTenant, requireTenantAccess, CartelController.delete);

router.get   ('/s/:slug/cartels/:id/notes',         authenticate, resolveTenant, requireTenantAccess, CartelNoteController.list);
router.post  ('/s/:slug/cartels/:id/notes',         authenticate, resolveTenant, requireTenantAccess, CartelNoteController.create);
router.delete('/s/:slug/cartels/:id/notes/:noteId', authenticate, resolveTenant, requireTenantAccess, CartelNoteController.remove);

// Workflow de soumission au site principal (owner du sous-site)
router.post  ('/s/:slug/cartels/:id/submit-to-main',  authenticate, resolveTenant, requireTenantAccess, CartelController.submitToMain);
router.post  ('/s/:slug/cartels/:id/withdraw-from-main', authenticate, resolveTenant, requireTenantAccess, CartelController.withdrawFromMain);

// File d'attente de validation (superadmin)
router.get   ('/submissions',            authenticate, requireAdmin, CartelController.listSubmissions);
router.post  ('/submissions/:id/approve', authenticate, requireAdmin, CartelController.approveSubmission);
router.post  ('/submissions/:id/reject',  authenticate, requireAdmin, CartelController.rejectSubmission);

// Gestion d'équipe scopée (owner du sous-site OU superadmin)
router.get   ('/s/:slug/users',     authenticate, resolveTenant, requireTenantAccess, TeamController.list);
router.post  ('/s/:slug/users',     authenticate, resolveTenant, requireTenantAccess, TeamController.create);
router.patch ('/s/:slug/users/:id', authenticate, resolveTenant, requireTenantAccess, TeamController.update);
router.patch ('/s/:slug/users/:id/password', authenticate, resolveTenant, requireTenantAccess, TeamController.setPassword);
router.delete('/s/:slug/users/:id', authenticate, resolveTenant, requireTenantAccess, TeamController.remove);

// ── Partenaires (public GET, admin write) ────────────────────
// optionalAuth sur GET pour que le filtre par scope (pool public vs pool+exclusifs
// d'un tenant admin) soit calculé depuis req.user.
router.get   ('/partners',       optionalAuth, PartnerController.getAll);
router.get   ('/partners/site',  PartnerController.getSiteSelection);
router.put   ('/partners/site',  authenticate, requireAdmin, PartnerController.setSiteSelection);
// CREATE / UPDATE / DELETE : le superadmin passe par requireAdmin, les tenant
// admins doivent avoir can_manage_team (contrôlé dans le contrôleur via canModifyPartner).
// On ouvre donc aux utilisateurs authentifiés et on délègue l'authz au contrôleur.
router.post  ('/partners',       authenticate, PartnerController.create);
router.patch ('/partners/:id',   authenticate, PartnerController.update);
router.delete('/partners/:id',   authenticate, PartnerController.remove);

// ── Membres d'équipe (page publique « À propos ») ────────────
// GET public, write réservé au superadmin.
// Lecture publique avec optionalAuth pour permettre au superadmin de viser
// un autre subsite via ?subsiteId=... (la cible reste main pour les anonymes).
router.get   ('/team-members',     optionalAuth, TeamMemberController.getAll);
router.post  ('/team-members',     authenticate, requireAdmin, TeamMemberController.create);
router.patch ('/team-members/:id', authenticate, requireAdmin, TeamMemberController.update);
router.delete('/team-members/:id', authenticate, requireAdmin, TeamMemberController.remove);

// Variantes scopées par sous-site (équipe propre à un subsite).
// Écriture autorisée à l'owner du subsite OU au superadmin (canWrite côté controller).
router.get   ('/s/:slug/team-members',     optionalAuth, resolveTenant, TeamMemberController.getAll);
router.post  ('/s/:slug/team-members',     authenticate, resolveTenant, requireTenantAccess, TeamMemberController.create);
router.patch ('/s/:slug/team-members/:id', authenticate, resolveTenant, requireTenantAccess, TeamMemberController.update);
router.delete('/s/:slug/team-members/:id', authenticate, resolveTenant, requireTenantAccess, TeamMemberController.remove);

// ── Articles de presse (page publique /presse) ────────────────
// optionalAuth pour que les admins puissent voir les articles non publiés.
router.get   ('/press-articles',     optionalAuth,                PressArticleController.getAll);
router.post  ('/press-articles',     authenticate, requireAdmin,  PressArticleController.create);
router.patch ('/press-articles/:id', authenticate, requireAdmin,  PressArticleController.update);
router.delete('/press-articles/:id', authenticate, requireAdmin,  PressArticleController.remove);

// ── Missions (page publique /participer — appels à participation) ──
// optionalAuth pour que les admins puissent voir les missions non publiées.
router.get   ('/missions',     optionalAuth,                MissionController.getAll);
router.post  ('/missions',     authenticate, requireAdmin,  MissionController.create);
router.patch ('/missions/:id', authenticate, requireAdmin,  MissionController.update);
router.delete('/missions/:id', authenticate, requireAdmin,  MissionController.remove);

// ── Candidatures aux missions (formulaire public en bas de /participer) ──
// POST public (avec honeypot dans le contrôleur), lecture admin only.
router.post('/mission-applications', MissionApplicationController.create);
router.get ('/mission-applications', authenticate, requireAdmin, MissionApplicationController.list);

// ── Messages du formulaire /contact ───────────────────────────
// POST public (avec honeypot), lecture admin only.
router.post('/contact-messages', ContactMessageController.create);
router.get ('/contact-messages', authenticate, requireAdmin, ContactMessageController.list);

// ── Prestations (page publique /prestations) ──────────────────
router.get   ('/prestations',     optionalAuth,                PrestationController.getAll);
router.post  ('/prestations',     authenticate, requireAdmin,  PrestationController.create);
router.patch ('/prestations/:id', authenticate, requireAdmin,  PrestationController.update);
router.delete('/prestations/:id', authenticate, requireAdmin,  PrestationController.remove);

// ── Shop items (page publique /ouvrages, liens vers PrestaShop) ───
router.get   ('/shop-items',     optionalAuth,                ShopItemController.getAll);
router.post  ('/shop-items',     authenticate, requireAdmin,  ShopItemController.create);
router.patch ('/shop-items/:id', authenticate, requireAdmin,  ShopItemController.update);
router.delete('/shop-items/:id', authenticate, requireAdmin,  ShopItemController.remove);

// ── Event logs + config emails (superadmin only) ─────────────
router.get   ('/logs',                       authenticate, requireAdmin, EventLogController.list);
router.get   ('/logs/types',                 authenticate, requireAdmin, EventLogController.distinctTypes);
router.get   ('/logs/email-config',          authenticate, requireAdmin, EventLogController.listEmailConfig);
router.patch ('/logs/email-config',           authenticate, requireAdmin, EventLogController.bulkUpdateRecipient);
router.patch ('/logs/email-config/:type',    authenticate, requireAdmin, EventLogController.updateEmailConfig);

export default router;