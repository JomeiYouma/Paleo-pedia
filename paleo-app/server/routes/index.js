import { Router } from 'express';
import { AuthController }      from '../controllers/authController.js';
import { CartelController }    from '../controllers/cartelController.js';
import { CategoryController }  from '../controllers/CategoryController.js';
import { UserController }      from '../controllers/userController.js';
import { WorkshopController }  from '../controllers/workshopController.js';
import { SettingController }   from '../controllers/settingController.js';
import { UploadController, upload } from '../controllers/uploadController.js';
import { TranslateController } from '../controllers/translateController.js';
import { ImportController }    from '../controllers/importController.js';
import { ExportController }    from '../controllers/exportController.js';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { submissionGuard } from '../middleware/submissionGuard.js';
import { resolveTenant, requireTenantAccess } from '../middleware/tenant.js';
import { SubsiteController }  from '../controllers/subsiteController.js';
import { PartnerController }  from '../controllers/partnerController.js';

const router = Router();

// ── Auth ─────────────────────────────────────────────────────
router.post('/auth/register', AuthController.register);
router.post('/auth/login',    AuthController.login);
router.get ('/auth/me',       authenticate, AuthController.me);

// ── Cartels ──────────────────────────────────────────────────
// GET public : sans auth → ne voit que published+visible
// GET admin  : avec token → voit tout (géré dans le contrôleur)
// Auth optionnelle : admin voit tout, visiteur ne voit que published
router.get   ('/cartels', optionalAuth, CartelController.getAll);
router.get   ('/cartels/:id',        optionalAuth, CartelController.getOne);

// POST : auth optionnelle + guard de soumission anonyme
router.post  ('/cartels', optionalAuth, submissionGuard, CartelController.create);

router.patch ('/cartels/:id',        authenticate, CartelController.update);
router.patch ('/cartels/:id/status', authenticate, CartelController.setStatus);
router.delete('/cartels/:id',        authenticate, CartelController.delete);

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
router.patch ('/settings',            authenticate, requireAdmin, SettingController.updateMany);

// ── Users (admin) ────────────────────────────────────────────
router.get   ('/users',              authenticate, requireAdmin, UserController.getAll);
router.get   ('/users/:id',          authenticate, requireAdmin, UserController.getOne);
router.patch ('/users/:id',          authenticate, requireAdmin, UserController.update);
router.delete('/users/:id',          authenticate, requireAdmin, UserController.delete);

// ── Upload image ─────────────────────────────────────────────
router.post('/upload', authenticate, upload.single('image'), UploadController.uploadImage);

// ── Traduction (admin) ───────────────────────────────────────
router.post('/translate', authenticate, requireAdmin, TranslateController.translate);

// ── Import ZIP (admin) ───────────────────────────────────────
router.post('/import', authenticate, requireAdmin, ImportController.middleware, ImportController.importZip);

// ── Export archive (admin) ───────────────────────────────────
router.get('/export', authenticate, requireAdmin, ExportController.exportArchive);

// ── Sous-sites (public GET, admin write) ─────────────────────
router.get   ('/subsites',       SubsiteController.getAll);
router.get   ('/subsites/:slug', SubsiteController.getOne);
router.post  ('/subsites',       authenticate, requireAdmin, SubsiteController.create);
router.patch ('/subsites/:slug', authenticate, requireAdmin, SubsiteController.update);
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

// ── Partenaires (public GET, admin write) ────────────────────
router.get   ('/partners',       PartnerController.getAll);
router.get   ('/partners/site',  PartnerController.getSiteSelection);
router.put   ('/partners/site',  authenticate, requireAdmin, PartnerController.setSiteSelection);
router.post  ('/partners',       authenticate, requireAdmin, PartnerController.create);
router.patch ('/partners/:id',   authenticate, requireAdmin, PartnerController.update);
router.delete('/partners/:id',   authenticate, requireAdmin, PartnerController.remove);

export default router;