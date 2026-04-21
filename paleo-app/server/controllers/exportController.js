/**
 * exportController.js
 * GET /api/export?ids=id1,id2,...  (ou sans ids = tous les publiés)
 * Génère une archive ZIP contenant :
 *   cartels.json  — données complètes des cartels sélectionnés
 *   images/       — copies des images référencées
 */

import JSZip from 'jszip';
import path from 'path';
import fs from 'fs';
import { CartelModel } from '../models/Cartel.js';
import { UPLOADS_DIR, LEGACY_UPLOADS_DIR } from './uploadController.js';

function classifyImagePath(imagePath) {
  if (!imagePath) return { type: 'no_image', filename: null };
  if (/^https?:\/\//i.test(imagePath)) return { type: 'remote_url', filename: null };
  if (imagePath.startsWith('images/') || imagePath.startsWith('../images/')) {
    return { type: 'legacy_format', filename: path.basename(imagePath) };
  }
  const filename = path.basename(imagePath);
  const candidates = [
    path.join(UPLOADS_DIR, filename),
    path.join(LEGACY_UPLOADS_DIR, filename),
  ];
  const found = candidates.some(p => fs.existsSync(p));
  return { type: found ? 'ok' : 'missing_file', filename };
}

export const ExportController = {
  /**
   * GET /api/export/image-check — audit des image_path avant export.
   * Par défaut on n'inspecte que les cartels `published` : les brouillons et
   * propositions en attente ne partent pas à l'export, donc leurs images
   * cassées pollueraient le modal. Override : ?ids=a,b,c pour une sélection
   * précise, ou ?status=all pour auditer tout le stock.
   */
  async imageCheck(req, res) {
    try {
      const { ids, status = 'published' } = req.query || {};
      let cartels;
      if (ids) {
        const idList = String(ids).split(',').map(s => s.trim()).filter(Boolean);
        cartels = (await Promise.all(idList.map(id => CartelModel.findById(id)))).filter(Boolean);
      } else {
        const statusFilter = status === 'all' ? undefined : status;
        cartels = await CartelModel.findAll({ status: statusFilter, limit: 10000 });
      }
      const issues = [];
      for (const c of cartels) {
        const { type, filename } = classifyImagePath(c.image_path);
        if (type === 'ok') continue;
        issues.push({
          id: c.id,
          titre: c.titre || '',
          subsite_slug: c.subsite_slug || null,
          subsite_name: c.subsite_name || null,
          status: c.status,
          image_path: c.image_path || '',
          filename,
          type,
        });
      }
      res.json({ total: cartels.length, issues });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async exportArchive(req, res) {
    try {
      const idsParam = req.query.ids;
      let cartels;

      if (idsParam) {
        const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
        cartels = await Promise.all(ids.map(id => CartelModel.findById(id)));
        cartels = cartels.filter(Boolean);
      } else {
        // Par défaut : tous les publiés
        cartels = await CartelModel.findAll({ status: 'published', limit: 5000 });
      }

      if (!cartels.length) {
        return res.status(404).json({ error: 'Aucun cartel trouvé pour cet export.' });
      }

      const zip = new JSZip();
      const imgFolder = zip.folder('images');

      // Pour chaque cartel, inclure l'image si elle est locale
      const exportData = cartels.map(c => {
        const cleanedImagePath = c.image_path || '';

        // Tenter d'inclure l'image dans le ZIP
        if (cleanedImagePath) {
          // Extraire le nom de fichier de l'URL /api/images/<filename>
          const filename = path.basename(cleanedImagePath);
          const localPaths = [
            path.join(UPLOADS_DIR, filename),
            path.join(LEGACY_UPLOADS_DIR, filename),
          ];
          const localPath = localPaths.find(candidate => fs.existsSync(candidate));
          if (localPath) {
            imgFolder.file(filename, fs.readFileSync(localPath));
          }
        }

        return {
          titre:          c.titre,
          titre_en:       c.titre_en,
          annee:          c.annee,
          description:    c.description,
          description_en: c.description_en,
          exhume_par:     c.exhume_par,
          location:       c.location,
          location_en:    c.location_en,
          lat:            c.lat,
          lng:            c.lng,
          url_qr:         c.url_qr,
          image_path:     cleanedImagePath ? path.basename(cleanedImagePath) : '',
          imageCredit:    c.imageCredit || '',
          categories:     (c.categories || []),
          status:         c.status,
        };
      });

      zip.file('cartels.json', JSON.stringify(exportData, null, 2));

      const content = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const dateStr = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="paleo-export-${dateStr}.zip"`);
      res.send(content);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
