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
import { UPLOADS_DIR } from './uploadController.js';

export const ExportController = {
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
        cartels = await CartelModel.findAll({ status: 'published', visible: true, limit: 5000 });
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
          const localPath = path.join(UPLOADS_DIR, filename);
          if (fs.existsSync(localPath)) {
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
