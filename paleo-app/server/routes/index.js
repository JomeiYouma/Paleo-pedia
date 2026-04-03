import { Router } from 'express';
import { AuthController }     from '../controllers/authController.js';
import { CartelController }   from '../controllers/cartelController.js';
import { CategoryController } from '../controllers/categoryController.js';
import { UserController }     from '../controllers/userController.js';
import { authenticate, requireCreate, requirePublish, requireAdmin } from '../middleware/auth.js';

const router = Router();

// ── Auth ────────────────────────────────────────────────────
router.post('/auth/register', AuthController.register);
router.post('/auth/login',    AuthController.login);
router.get ('/auth/me',       authenticate, AuthController.me);

// ── Cartels (public: lire les publiés) ──────────────────────
router.get   ('/cartels',              CartelController.getAll);
router.get   ('/cartels/:id',          CartelController.getOne);
router.post  ('/cartels',              authenticate, requireCreate,  CartelController.create);
router.patch ('/cartels/:id',          authenticate, requireCreate,  CartelController.update);
router.patch ('/cartels/:id/status',   authenticate,                 CartelController.setStatus);
router.delete('/cartels/:id',          authenticate,                 CartelController.delete);

// ── Categories ──────────────────────────────────────────────
router.get   ('/categories',           CategoryController.getAll);
router.get   ('/categories/:id',       CategoryController.getOne);
router.post  ('/categories',           authenticate, requireAdmin,   CategoryController.create);
router.patch ('/categories/:id',       authenticate, requireAdmin,   CategoryController.update);
router.delete('/categories/:id',       authenticate, requireAdmin,   CategoryController.delete);

// ── Users (admin only) ──────────────────────────────────────
router.get   ('/users',                authenticate, requireAdmin,   UserController.getAll);
router.get   ('/users/:id',            authenticate, requireAdmin,   UserController.getOne);
router.patch ('/users/:id',            authenticate, requireAdmin,   UserController.update);
router.delete('/users/:id',            authenticate, requireAdmin,   UserController.delete);

export default router;