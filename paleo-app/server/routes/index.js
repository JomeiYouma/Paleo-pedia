import { Router } from 'express';
import { AuthController }     from '../controllers/authController.js';
import { CartelController }   from '../controllers/cartelController.js';
import { CategoryController } from '../controllers/CategoryController.js';
import { UserController }     from '../controllers/userController.js';
import { WorkshopController } from '../controllers/workshopController.js';
import { SettingController }  from '../controllers/settingController.js';
import { authenticate, requireCreate, requirePublish, requireAdmin } from '../middleware/auth.js';
import { submissionGuard } from '../middleware/submissionGuard.js';

const router = Router();

// ── Auth ─────────────────────────────────────────────────────
router.post('/auth/register', AuthController.register);
router.post('/auth/login',    AuthController.login);
router.get ('/auth/me',       authenticate, AuthController.me);

// ── Cartels ──────────────────────────────────────────────────
// GET public : sans auth → ne voit que published+visible
// GET admin  : avec token → voit tout (géré dans le contrôleur)
router.get   ('/cartels',            CartelController.getAll);
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

export default router;