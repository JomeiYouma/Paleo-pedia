/**
 * zipGenerator.js
 * Utilitaires d'export des cartels :
 *  - generateZip(cartels, lang, onProgress)    → ZIP d'images JPEG
 *  - generatePdf(cartels, lang, onProgress)    → PDF A4 paysage
 *  - generateArchive(cartels, onProgress)      → ZIP complet (cartels.json + images)
 */

import JSZip      from 'jszip';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import QRCode     from 'qrcode';
import jsPDF      from 'jspdf';
import { formatYear } from './helpers';
import { cartelDetailAbsoluteUrl } from './subsiteHost';

// ── Configuration du rendu ────────────────────────────────────
const A4_WIDTH_PX  = 3508;
const A4_HEIGHT_PX = 2480;
const MM_TO_PX     = A4_WIDTH_PX / 297; // ~11.81 px/mm
const PINK_HEX     = '#FCEDEC';
const MARGIN       = Math.round(15 * MM_TO_PX); // ~177px

const FONTS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=PT+Sans+Narrow:wght@400;700&family=PT+Serif:wght@400;700&display=swap');
`;

// ── Helpers ───────────────────────────────────────────────────

/**
 * Charge une image et la renvoie en base64 (contourne CORS html2canvas).
 *
 * Optimisation perf : on **downscale** à `MAX_IMG_DIM` côté max avant d'encoder
 * le dataURL. La zone d'image dans le PDF fait au plus ~1530×1100 px ; encoder
 * une image legacy de 5000×3500 à sa taille native gonflait le dataURL à
 * plusieurs Mo et faisait exploser le temps de rendu html2canvas (O(n²) sur
 * les pixels source). Le ratio est strictement préservé, donc la mise en page
 * en aval (`imgRatio = width / height`) est inchangée.
 */
const MAX_IMG_DIM = 1600;
const loadAndEncodeImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const natW = img.naturalWidth;
      const natH = img.naturalHeight;
      // Si dimensions invalides (ex: SVG sans width/height intrinsèques), on
      // retombe en mode "passe-plat" pour ne rien casser.
      if (!natW || !natH) {
        resolve({ img, width: natW || 1, height: natH || 1, dataUrl: src });
        return;
      }
      const ratio = Math.min(1, MAX_IMG_DIM / Math.max(natW, natH));
      const w = Math.max(1, Math.round(natW * ratio));
      const h = Math.max(1, Math.round(natH * ratio));
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve({ img, width: w, height: h, dataUrl: canvas.toDataURL('image/jpeg', 0.92) });
      } catch {
        // Canvas tainted (CORS) : on retombe sur la source originale, ratio
        // recalculé depuis les dimensions natives — html2canvas s'en chargera.
        resolve({ img, width: natW, height: natH, dataUrl: src });
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

// Dimensions du cartel imprimé exposées pour l'aperçu (ratio A4 paysage).
export const PRINT_CARTEL_DIMS = { width: A4_WIDTH_PX, height: A4_HEIGHT_PX };

/** Crée un conteneur hors-écran pour renderer les cartels. */
export const setupContainer = () => {
  const div = document.createElement('div');
  div.style.cssText = `position:fixed;top:-10000px;left:-10000px;width:${A4_WIDTH_PX}px;height:${A4_HEIGHT_PX}px;`;
  document.body.appendChild(div);
  return div;
};

// ── Rendu d'un cartel → Canvas ────────────────────────────────

export const renderCartelToCanvas = async (cartel, container, lang, overrides) => {
  const isEn  = lang && lang.startsWith('en');
  const title = (isEn && cartel.titre_en)       ? cartel.titre_en       : cartel.titre;
  const desc  = (isEn && cartel.description_en) ? cartel.description_en : (cartel.description || '');
  const loc   = isEn
    ? (cartel.location_en || cartel.location || '')
    : (cartel.location    || cartel.location_en || '');
  const rawCats = (isEn ? cartel.categories_en : cartel.categories) || [];
  const oCategoryMap = overrides?.categoryMap || null;
  const cats  = oCategoryMap ? rawCats.map(c => oCategoryMap[c] || c) : rawCats;
  const imageCredit = (cartel.imageCredit || cartel.image_credit || '').trim();

  // En mode frise traduite (overrides présents), `cartel.annee` a déjà été
  // traduit par OpenAI vers la langue cible — on l'affiche tel quel.
  // Sinon, `formatYear` gère la conversion FR↔EN à partir de la source.
  const isTranslatedFrise = !!overrides?.labels;
  const yearLabel = isTranslatedFrise ? (cartel.annee || '') : formatYear(cartel.annee, lang);

  // QR Code : si `use_internal_details` est activé, on pointe vers la page
  // détail interne (URL absolue côté host dédié si dispo, sinon hash router
  // sur le site principal). Sinon comportement historique : on encode `url_qr`.
  const qrTarget = cartel.use_internal_details
    ? cartelDetailAbsoluteUrl(cartel.id, cartel.subsite_slug)
    : cartel.url_qr;
  let qrDataUrl = '';
  if (qrTarget) {
    qrDataUrl = await QRCode.toDataURL(qrTarget, {
      width: Math.round(30 * MM_TO_PX), margin: 0,
      color: { dark: '#000000', light: '#00000000' },
    });
  }

  // Textes localisés (overrides.labels prend le dessus pour la frise traduite)
  const oLabels = overrides?.labels || {};
  const moreText    = oLabels.moreText    || (isEn ? 'Read more'    : 'Pour aller plus loin');
  const exhumeText  = oLabels.exhumeText  || (isEn ? 'Exhumed by'   : 'Exhumé par');
  const catText     = oLabels.catText     || (isEn ? 'Categories'   : 'Catégories');
  const creditText  = oLabels.creditText  || (isEn ? 'Image source' : 'Source image');
  const unknownText = oLabels.unknownText || (isEn ? 'Unknown'      : 'Inconnu');

  const parseMd = (t) => t
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
  const descHtml = desc.split('\n').map(l => `<p style="margin:0">${parseMd(l)}</p>`).join('<br/>');

  // Layout
  const mid_x         = Math.round(A4_WIDTH_PX / 2);
  const text_start_x  = mid_x + MARGIN;
  const text_width    = A4_WIDTH_PX - text_start_x - MARGIN;
  const initial_y     = Math.round(15  * MM_TO_PX);
  const cat_y         = Math.round(180 * MM_TO_PX);
  const qr_size       = Math.round(22  * MM_TO_PX);
  const qr_x          = MARGIN;
  const qr_y          = A4_HEIGHT_PX - MARGIN - qr_size;
  const footer_text_x = MARGIN + qr_size + 20;
  const footer_max_w  = Math.max(260, mid_x - footer_text_x - 20);
  const img_limit_y   = qr_y - 30;

  // Image
  let imgHtml = '';
  const srcImg = cartel.imageUrl || cartel.image_path;
  if (srcImg) {
    const imgResult = await loadAndEncodeImage(srcImg);
    if (imgResult) {
      const { width: natW, height: natH, dataUrl } = imgResult;
      const boxW = mid_x - 2 * MARGIN;
      const boxH = img_limit_y - MARGIN;
      const imgRatio = natW / natH;
      const boxRatio = boxW / boxH;
      let finalW, finalH;
      if (imgRatio > boxRatio) { finalW = boxW; finalH = Math.round(boxW / imgRatio); }
      else                     { finalH = boxH; finalW = Math.round(boxH * imgRatio); }
      const posX = MARGIN + Math.round((boxW - finalW) / 2);
      const posY = MARGIN + Math.round((boxH - finalH) / 2);
      imgHtml = `<img src="${dataUrl}" style="position:absolute;left:${posX}px;top:${posY}px;width:${finalW}px;height:${finalH}px;object-fit:fill;" />`;
    }
  }

  container.innerHTML = `
    <style>
      ${FONTS_CSS}
      .cc { width:${A4_WIDTH_PX}px; height:${A4_HEIGHT_PX}px; background:white; position:relative; overflow:hidden; }
      .pz { position:absolute; right:0; top:0; width:50%; height:100%; background:${PINK_HEX}; z-index:0; }
      .psb { font-family:'PT Sans Narrow',sans-serif; font-weight:700; color:black; }
      .psr { font-family:'PT Serif',serif;            font-weight:400; color:#141414; }
      .fi  { position:absolute; left:${footer_text_x}px; top:${qr_y}px; min-height:${qr_size}px; display:flex; flex-direction:column; justify-content:center; z-index:10; width:${footer_max_w}px; max-width:${footer_max_w}px; }
      .ml  { font-family:'PT Sans Narrow',sans-serif; font-weight:700; font-size:35px; color:#000; margin-bottom:5px; display:flex; align-items:center; }
      .cl  { font-family:'PT Sans Narrow',sans-serif; font-weight:700; font-size:55px; color:#000; line-height:1.05; }
      .sl  { font-family:'PT Sans Narrow',sans-serif; font-weight:400; font-size:22px; color:#666; line-height:1.2; margin-top:4px; width:100%; max-width:100%; white-space:normal; word-break:break-word; overflow-wrap:anywhere; }
      .tc  { position:absolute; left:${text_start_x}px; top:${initial_y}px; width:${text_width}px; display:flex; flex-direction:column; align-items:flex-end; z-index:10; }
      .yl  { font-size:90px; margin-bottom:5px; }
      .ll  { font-size:50px; margin-bottom:20px; font-family:'PT Serif',serif; font-style:italic; color:#333; }
      .tl  { font-size:120px; text-transform:uppercase; line-height:1.1; margin-bottom:40px; text-align:right; width:100%; }
      .dc  { font-size:55px; text-align:justify; width:100%; line-height:1.3; }
      .ct  { position:absolute; left:${text_start_x}px; top:${cat_y}px; font-size:40px; color:black; z-index:10; font-family:'PT Sans Narrow',sans-serif; }
      .qr  { position:absolute; left:${qr_x}px; top:${qr_y}px; width:${qr_size}px; height:${qr_size}px; z-index:10; }
    </style>
    <div class="cc">
      <div class="pz"></div>
      ${imgHtml}
      ${qrDataUrl ? `<img src="${qrDataUrl}" class="qr" />` : ''}
      <div class="fi">
        ${qrDataUrl ? `<div class="ml"><span style="margin-right:10px;font-size:1.2em">←</span> ${moreText}</div>` : ''}
        <div class="cl">${exhumeText} ${cartel.exhume_par || unknownText}</div>
        ${imageCredit ? `<div class="sl">${creditText}: ${imageCredit}</div>` : ''}
      </div>
      <div class="tc">
        <div class="yl psb">${yearLabel}</div>
        ${loc ? `<div class="ll">${loc}</div>` : ''}
        <div class="tl psb">${title}</div>
        <div class="dc psr">${descHtml}</div>
      </div>
      <div class="ct">${catText} : ${cats.join(' • ')}</div>
    </div>`;

  // Attendre les images du DOM
  await Promise.all(
    Array.from(container.querySelectorAll('img')).map(img =>
      img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
    )
  );

  // Auto-fit texte si trop long
  const titleContainer = container.querySelector('.tc');
  const descContent    = container.querySelector('.dc');
  const maxBottom      = cat_y - 20;
  let fontSize         = 55;
  for (let i = 0; i < 50; i++) {
    if (initial_y + titleContainer.offsetHeight > maxBottom && fontSize > 20) {
      fontSize -= 2;
      descContent.style.fontSize = `${fontSize}px`;
    } else break;
  }

  return html2canvas(container.querySelector('.cc'), {
    scale: 1, useCORS: true, allowTaint: true, backgroundColor: '#FFFFFF',
    width: A4_WIDTH_PX, height: A4_HEIGHT_PX,
  });
};

// ── Exports publics ───────────────────────────────────────────

/**
 * Export ZIP d'images JPEG (une par cartel).
 * @param {Array}    cartels
 * @param {string}   lang       'fr' | 'en'
 * @param {Function} onProgress (current, total) => void
 */
export const generateZip = async (cartels, lang = 'fr', onProgress) => {
  const zip       = new JSZip();
  const container = setupContainer();
  let   count     = 0;

  for (const cartel of cartels) {
    count++;
    onProgress?.(count, cartels.length);
    try {
      const canvas = await renderCartelToCanvas(cartel, container, lang);
      const blob   = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.95));
      const isEn   = lang && lang.startsWith('en');
      const t      = (isEn && cartel.titre_en) ? cartel.titre_en : cartel.titre;
      const safe   = (t || 'sans-titre').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
      zip.file(`${safe}.jpg`, blob);
    } catch (e) {
      console.error(`ZIP : erreur cartel ${cartel.id}`, e);
    }
  }

  document.body.removeChild(container);
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'paleo-images.zip');
};

/**
 * Export en image d'un cartel individuel (téléchargement direct).
 * @param {Object}   cartel
 * @param {string}   lang       'fr' | 'en'
 */
export const generateImage = async (cartel, lang = 'fr') => {
  const container = setupContainer();
  try {
    const canvas = await renderCartelToCanvas(cartel, container, lang);
    const blob   = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const isEn   = lang && lang.startsWith('en');
    const t      = (isEn && cartel.titre_en) ? cartel.titre_en : cartel.titre;
    const safe   = (t || 'sans-titre').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    saveAs(blob, `${safe}.png`);
  } catch (e) {
    console.error(`IMAGE : erreur cartel ${cartel.id}`, e);
  } finally {
    document.body.removeChild(container);
  }
};

/**
 * Export PDF A4 paysage (toutes les pages).
 * @param {Array}    cartels
 * @param {string}   lang       'fr' | 'en'
 * @param {Function} onProgress (current, total) => void
 * @param {object}   [overrides]
 * @param {object}   [overrides.labels]      - { moreText, exhumeText, catText, creditText, unknownText } pour la frise traduite.
 * @param {object}   [overrides.categoryMap] - { [catSrc]: catTraduit } pour la frise traduite.
 */
export const generatePdf = async (cartels, lang = 'fr', onProgress, overrides) => {
  const pdf       = new jsPDF('l', 'mm', 'a4');
  const container = setupContainer();
  let   count     = 0;

  for (const cartel of cartels) {
    count++;
    onProgress?.(count, cartels.length);
    try {
      const canvas  = await renderCartelToCanvas(cartel, container, lang, overrides);
      const imgData = canvas.toDataURL('image/jpeg', 0.90);
      if (count > 1) pdf.addPage('a4', 'l');
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
    } catch (e) {
      console.error(`PDF : erreur cartel ${cartel.id}`, e);
    }
  }

  document.body.removeChild(container);
  pdf.save('paleo-impression.pdf');
};

/**
 * Export archive complète (cartels.json + images téléchargées depuis le serveur).
 * @param {Array}    cartels
 * @param {Function} onProgress (current, total) => void
 */
export const generateArchive = async (cartels, onProgress) => {
  const zip      = new JSZip();
  const imgFolder = zip.folder('images');
  let   count    = 0;

  // 1. Préparer le JSON propre
  const exportData = cartels.map(c => ({
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
    image_path:     c.image_path ? c.image_path.split('/').pop() : '',
    imageCredit:    c.imageCredit || c.image_credit || '',
    categories:     c.categories || [],
    status:         c.status,
  }));
  zip.file('cartels.json', JSON.stringify(exportData, null, 2));

  // 2. Télécharger les images
  for (const cartel of cartels) {
    count++;
    onProgress?.(count, cartels.length);
    const src = cartel.imageUrl || cartel.image_path;
    if (!src) continue;
    try {
      const resp = await fetch(src);
      if (!resp.ok) continue;
      const blob = await resp.blob();
      const filename = src.split('/').pop().split('?')[0];
      imgFolder.file(filename, blob);
    } catch (e) {
      console.warn(`Archive : image non récupérable ${src}`, e);
    }
  }

  const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const date    = new Date().toISOString().split('T')[0];
  saveAs(content, `paleo-archive-${date}.zip`);
};
