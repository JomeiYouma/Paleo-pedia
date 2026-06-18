/**
 * importController.js
 * POST /api/import — Importe un ZIP contenant cartels.json + images.
 *
 * Le ZIP doit avoir la structure :
 *   cartels.json          (Array de cartels)
 *   images/photo.jpg      (optionnel, chemin correspondant à image_path dans le JSON)
 *   ou juste photo.jpg    (à la racine, même nom que image_path)
 *
 * Les images sont extraites et sauvegardées dans server/uploads/.
 * Chaque cartel est inséré en base avec status='draft'.
 */

import multer from 'multer';
import JSZip from 'jszip';
import path from 'path';
import fs from 'fs';
import { CartelModel } from '../models/Cartel.js';
import { UPLOADS_DIR } from './uploadController.js';
import { dispatchEvent } from '../services/eventDispatcher.js';

// Helper local : journalisation fire-and-forget (jamais bloquante).
const dispatch = (args) => { dispatchEvent(args).catch(() => {}); };

// Multer en mémoire pour recevoir le ZIP
const zipUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 Mo
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) cb(null, true);
    else cb(new Error('Seuls les fichiers .zip sont acceptés'));
  },
}).single('archive');

export const ImportController = {
  /** Middleware multer */
  middleware: zipUpload,

  async importZip(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier ZIP reçu.' });
    }

    let zip;
    try {
      zip = await JSZip.loadAsync(req.file.buffer);
    } catch {
      return res.status(400).json({ error: 'Fichier ZIP invalide ou corrompu.' });
    }

    // Lire cartels.json
    const jsonFile = zip.file('cartels.json');
    if (!jsonFile) {
      return res.status(400).json({ error: 'Le ZIP doit contenir un fichier cartels.json à la racine.' });
    }

    let cartelsData;
    try {
      const raw = await jsonFile.async('string');
      cartelsData = JSON.parse(raw);
      if (!Array.isArray(cartelsData)) throw new Error('cartels.json doit être un Array');
    } catch (e) {
      return res.status(400).json({ error: 'cartels.json invalide : ' + e.message });
    }

    // Extraire les images du ZIP vers /uploads/
    const imageMap = {}; // originalName → savedFilename
    const imageFiles = Object.entries(zip.files).filter(([name, f]) =>
      !f.dir && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name)
    );

    for (const [zipPath, zipEntry] of imageFiles) {
      const originalName = path.basename(zipPath);
      const ext  = path.extname(originalName).toLowerCase();
      const savedName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
      const destPath  = path.join(UPLOADS_DIR, savedName);
      const buf = await zipEntry.async('nodebuffer');
      fs.writeFileSync(destPath, buf);
      imageMap[originalName] = savedName;
      // Aussi indexer par chemin complet (ex: "images/photo.jpg" → "photo.jpg")
      imageMap[zipPath] = savedName;
    }

    // Insérer les cartels
    const results = { created: 0, errors: [] };
    const userId  = req.user?.id ?? null;

    for (const [idx, raw] of cartelsData.entries()) {
      try {
        // Résoudre l'image : chercher dans imageMap par basename ou chemin complet
        let imagePath = raw.image_path || '';
        const imgBasename = path.basename(imagePath);
        if (imageMap[imagePath])  imagePath = `/api/images/${imageMap[imagePath]}`;
        else if (imageMap[imgBasename]) imagePath = `/api/images/${imageMap[imgBasename]}`;

        await CartelModel.create(
          {
            titre:          raw.titre          || raw.title || `Cartel importé ${idx + 1}`,
            titre_en:       raw.titre_en       || raw.title_en || '',
            annee:          raw.annee          || raw.year   || '',
            description:    raw.description    || '',
            description_en: raw.description_en || '',
            exhume_par:     raw.exhume_par     || raw.exhume || '',
            location:       raw.location       || '',
            location_en:    raw.location_en    || '',
            lat:            raw.lat            ?? null,
            lng:            raw.lng            ?? null,
            url_qr:         raw.url_qr         || '',
            image_path:     imagePath,
            status:         'draft',
            visible:        false,
            category_ids:   [], // Les catégories peuvent être re-liées manuellement
          },
          userId
        );
        results.created++;
      } catch (e) {
        results.errors.push({ index: idx, titre: raw.titre, error: e.message });
      }
    }

    // Un seul événement de synthèse par import (≠ un par cartel : éviterait de
    // noyer le journal lors d'un import de masse).
    dispatch({
      type: 'cartel.imported', req,
      summary: `${results.created} cartel(s) importé(s)`,
      payload: { created: results.created, errors: results.errors.length, total: cartelsData.length },
    });

    res.status(201).json({
      message: `Import terminé : ${results.created} cartel(s) créé(s).`,
      ...results,
    });
  },
};
