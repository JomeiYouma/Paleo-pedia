/**
 * uploadController.js
 * Gestion des uploads d'images via multer.
 * Les fichiers sont stockés dans server/uploads/ et servis par Express.
 */

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Créer le dossier uploads s'il n'existe pas
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Type de fichier non autorisé (JPEG, PNG, WEBP, GIF, SVG seulement)'));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 Mo max
});

export const UploadController = {
  /** POST /api/upload — Reçoit une image, retourne son URL publique */
  uploadImage(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }
    // URL publique : /api/images/<filename>
    const url = `/api/images/${req.file.filename}`;
    res.status(201).json({ url, filename: req.file.filename });
  },
};
