import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

// Configuration
const DPI = 300;
const A4_WIDTH_PX = 3508;
const A4_HEIGHT_PX = 2480;
const MM_TO_PX = A4_WIDTH_PX / 297; // ~11.81
const PINK_HEX = "#FCEDEC";
const MARGIN = Math.round(15 * MM_TO_PX); // ~177px

// Fonts
const FONTS_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=PT+Sans+Narrow:wght@400;700&family=PT+Serif:wght@400;700&display=swap');
`;

const formatDate = (dateValue) => {
    if (!dateValue) return '';
    return dateValue;
};

// Helper to load image and get dimensions + Base64 data
const loadAndEncodeImage = (src) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            try {
                // Convert to Base64 via Canvas to bypass html2canvas CORS issues later
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/png'); // Can optimize format if needed
                resolve({
                    img,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    dataUrl
                });
            } catch (e) {
                console.warn("Could not encode image (likely Tainted canvas)", e);
                // Fallback to simpler loading if Tainted (might still fail in html2canvas but best effort)
                resolve({ img, width: img.naturalWidth, height: img.naturalHeight, dataUrl: src });
            }
        };
        img.onerror = () => resolve(null);
        img.src = src;
    });
};

import jsPDF from 'jspdf';

// ... (Previous imports and config)

// Helper: Render Single Cartel directly to Canvas
const renderCartelToCanvas = async (cartel, container, lang) => {
    // Determine Content Language
    const title = (lang === 'en' && cartel.titre_en) ? cartel.titre_en : cartel.titre;
    const description = (lang === 'en' && cartel.description_en) ? cartel.description_en : (cartel.description || '');

    // 1. Generate QR Code
    let qrDataUrl = '';
    if (cartel.url_qr) {
        qrDataUrl = await QRCode.toDataURL(cartel.url_qr, {
            width: Math.round(30 * MM_TO_PX),
            margin: 0,
            color: { dark: '#000000', light: '#00000000' }
        });
    }

    // 2. Prepare Description
    const descriptionHtml = description.split('\n').map(l => `<p style="margin: 0;">${l}</p>`).join('<br/>');

    // 3. Layout Constants & Text
    const mid_x = Math.round(A4_WIDTH_PX / 2);
    const text_start_x = mid_x + MARGIN;
    const text_width = A4_WIDTH_PX - text_start_x - MARGIN;
    const initial_y = Math.round(15 * MM_TO_PX);
    const cat_y = Math.round(180 * MM_TO_PX);
    const qr_size = Math.round(22 * MM_TO_PX);
    const qr_x = MARGIN;
    const qr_y = A4_HEIGHT_PX - MARGIN - qr_size;
    const footer_text_x = MARGIN + qr_size + 20;
    const footer_text_y = qr_y;
    const img_limit_y = qr_y - 30;

    // Localized Strings
    const moreText = lang === 'en' ? "Read more" : "Pour aller plus loin";
    const exhumeText = lang === 'en' ? "Exhumed by" : "Exhumé par";
    const catText = lang === 'en' ? "Categories" : "Catégories";
    const unknownText = lang === 'en' ? "Unknown" : "Inconnu";

    // 4. Manual Image Geometry
    let imgHtml = '';
    const sourceImage = cartel.imageUrl || cartel.image_path;
    if (sourceImage) {
        const imgResult = await loadAndEncodeImage(sourceImage);
        if (imgResult) {
            const natW = imgResult.width;
            const natH = imgResult.height;
            const imgSrc = imgResult.dataUrl || sourceImage;

            const boxW = mid_x - (2 * MARGIN);
            const boxH = img_limit_y - MARGIN;
            const imgRatio = natW / natH;
            const boxRatio = boxW / boxH;

            let finalW, finalH;
            if (imgRatio > boxRatio) {
                finalW = boxW;
                finalH = Math.round(boxW / imgRatio);
            } else {
                finalH = boxH;
                finalW = Math.round(boxH * imgRatio);
            }

            const posX = MARGIN + Math.round((boxW - finalW) / 2);
            const posY = MARGIN + Math.round((boxH - finalH) / 2);

            imgHtml = `<img src="${imgSrc}" style="position: absolute; left: ${posX}px; top: ${posY}px; width: ${finalW}px; height: ${finalH}px; object-fit: fill;" />`;
        }
    }

    container.innerHTML = `
        <style>
            ${FONTS_CSS}
            .cartel-canvas {
                width: ${A4_WIDTH_PX}px;
                height: ${A4_HEIGHT_PX}px;
                background-color: white;
                position: relative;
                overflow: hidden;
                display: flex;
            }
            .pink-zone {
                position: absolute; right: 0; top: 0; width: 50%; height: 100%;
                background-color: ${PINK_HEX}; z-index: 0;
            }
            .pt-sans-bold { font-family: 'PT Sans Narrow', sans-serif; font-weight: 700; color: black; }
            .pt-serif-reg { font-family: 'PT Serif', serif; font-weight: 400; color: #141414; }
            .footer-info {
                position: absolute; left: ${footer_text_x}px; top: ${footer_text_y}px; height: ${qr_size}px;
                display: flex; flex-direction: column; justify-content: center; z-index: 10;
            }
            .more-link {
                font-family: 'PT Sans Narrow', sans-serif; font-weight: 700; font-size: 35px;
                color: #000; margin-bottom: 5px; display: flex; align-items: center;
            }
            .credit-line {
                font-family: 'PT Sans Narrow', sans-serif; font-weight: 400; font-size: 30px; color: #505050;
            }
            .title-container {
                position: absolute; left: ${text_start_x}px; top: ${initial_y}px; width: ${text_width}px;
                display: flex; flex-direction: column; align-items: flex-end; z-index: 10;
            }
            .year-label { font-size: 90px; margin-bottom: 5px; }
            .location-label { font-size: 50px; margin-bottom: 20px; font-family: 'PT Serif', serif; font-style: italic; color: #333; }
            .title-label { 
                font-size: 120px; text-transform:uppercase; line-height:1.1; margin-bottom:40px; text-align:right; width: 100%; 
            }
            .desc-content { 
                font-size: 55px; text-align: left; width: 100%; line-height: 1.3; 
            }
            .categories-text {
                position: absolute; left: ${text_start_x}px; top: ${cat_y}px; font-size: 40px; color: black; z-index: 10; font-family: 'PT Sans Narrow', sans-serif;
            }
            .qr-code {
                position: absolute; left: ${qr_x}px; top: ${qr_y}px; width: ${qr_size}px; height: ${qr_size}px; z-index: 10;
            }
        </style>
        <div class="cartel-canvas">
            <div class="pink-zone"></div>
            ${imgHtml}
            ${qrDataUrl ? `<img src="${qrDataUrl}" class="qr-code" />` : ''}
            <div class="footer-info">
                ${qrDataUrl ? `<div class="more-link"><span style="margin-right: 10px; font-size: 1.2em;">←</span> ${moreText}</div>` : ''}
                <div class="credit-line">${exhumeText} ${cartel.exhume_par || unknownText}</div>
            </div>
            <div class="title-container">
                <div class="year-label pt-sans-bold">${formatDate(cartel.annee)}</div>
                ${cartel.location ? `<div class="location-label">${cartel.location}</div>` : ''}
                <div class="title-label pt-sans-bold">${title}</div>
                <div class="desc-content pt-serif-reg">${descriptionHtml}</div>
            </div>
            <div class="categories-text">${catText} : ${(cartel.categories || []).join(' • ')}</div>
        </div>
    `;

    // Wait for images
    const domImages = Array.from(container.querySelectorAll('img'));
    await Promise.all(domImages.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
    }));

    // Auto-fit
    const titleContainer = container.querySelector('.title-container');
    const descContent = container.querySelector('.desc-content');
    const maxBottom = cat_y - 20;
    let currentFontSize = 55;
    let safetyLoop = 0;
    while (safetyLoop < 50) {
        if ((initial_y + titleContainer.offsetHeight) > maxBottom && currentFontSize > 20) {
            currentFontSize -= 2;
            descContent.style.fontSize = `${currentFontSize}px`;
        } else break;
        safetyLoop++;
    }

    // Render Config
    return await html2canvas(container.querySelector('.cartel-canvas'), {
        scale: 1, useCORS: true, allowTaint: true, backgroundColor: '#FFFFFF',
        width: A4_WIDTH_PX, height: A4_HEIGHT_PX
    });
};

const setupContainer = () => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-10000px';
    container.style.left = '-10000px';
    container.style.width = `${A4_WIDTH_PX}px`;
    container.style.height = `${A4_HEIGHT_PX}px`;
    document.body.appendChild(container);
    return container;
};

// EXPORT ZIP
export const generateZip = async (cartels, lang = 'fr', onProgress) => {
    const zip = new JSZip();
    const container = setupContainer();
    console.log(`Starting ZIP export for ${cartels.length} cartels...`);

    let processedCount = 0;
    for (const cartel of cartels) {
        processedCount++;
        if (onProgress) onProgress(processedCount, cartels.length);
        try {
            const canvas = await renderCartelToCanvas(cartel, container, lang);
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
            // Filename
            const title = (lang === 'en' && cartel.titre_en) ? cartel.titre_en : cartel.titre;
            const safeTitle = (title || 'sans-titre').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            zip.file(`${safeTitle}.jpg`, blob);
        } catch (e) {
            console.error(`Failed ZIP item ${cartel.id}`, e);
        }
    }
    document.body.removeChild(container);
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "export_paleo_images.zip");
};

// EXPORT PDF
export const generatePdf = async (cartels, lang = 'fr', onProgress) => {
    // A4 dimensions in mm: 297 x 210 (Landscape)
    const pdf = new jsPDF('l', 'mm', 'a4');
    const container = setupContainer();
    console.log(`Starting PDF export for ${cartels.length} cartels...`);

    let processedCount = 0;

    for (const cartel of cartels) {
        processedCount++;
        if (onProgress) onProgress(processedCount, cartels.length);

        try {
            const canvas = await renderCartelToCanvas(cartel, container, lang);
            const imgData = canvas.toDataURL('image/jpeg', 0.90);

            // Add page if not first
            if (processedCount > 1) pdf.addPage('a4', 'l'); // Ensure new page is landscape

            // Add image full page (A4 Landscape: 297x210)
            pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);

        } catch (e) {
            console.error(`Failed PDF item ${cartel.id}`, e);
        }
    }
    document.body.removeChild(container);
    pdf.save("export_paleo_print.pdf");
};
