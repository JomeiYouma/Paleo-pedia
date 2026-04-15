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
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { verifyToken } from '../lib/jwt.js';
import { submissionGuard } from '../middleware/submissionGuard.js';
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
router.get   ('/cartels',            (req, res, next) => {
  // Auth optionnelle: si token présent et valide, req.user est rempli.
  // Sinon on continue en mode public.
  const auth = req.headers.authorization;
  req.user = null;

  if (auth?.startsWith('Bearer ')) {
    try {
      const decoded = verifyToken(auth.slice(7));
      req.user = {
        id:                 decoded.id,
        role:               decoded.role,
        can_create_cartel:  !!decoded.can_create_cartel,
        can_publish_cartel: !!decoded.can_publish_cartel,
        can_manage_admin:   !!decoded.can_manage_admin,
        can_create_subsite: !!decoded.can_create_subsite,
      };
    } catch {
      req.user = null;
    }
  }

  next();
}, CartelController.getAll);
router.get   ('/cartels/:id',        CartelController.getOne);

// POST : auth optionnelle + guard de soumission anonyme
router.post  ('/cartels',            (req, res, next) => {
  // on essaie de lire le token, mais sans bloquer si absent
  authenticate(req, res, err => {
    if (err) { req.user = null; } // Token invalide → on traite comme anonyme
    next();
  });
}, submissionGuard, CartelController.create);

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

// ── Partenaires (public GET, admin write) ────────────────────
router.get   ('/partners',       PartnerController.getAll);
router.post  ('/partners',       authenticate, requireAdmin, PartnerController.create);
router.patch ('/partners/:id',   authenticate, requireAdmin, PartnerController.update);
router.delete('/partners/:id',   authenticate, requireAdmin, PartnerController.remove);

export default router;