import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import {
    renderCartelToCanvas,
    setupContainer,
    PRINT_CARTEL_DIMS,
} from '../utils/zipGenerator';

/**
 * Aperçu fidèle du rendu imprimé d'un cartel.
 *
 * Utilise `renderCartelToCanvas` (même fonction que les exports PNG/PDF) pour
 * garantir un rendu strictement identique au cartel imprimé, à ratio A4
 * paysage exact (3508×2480).
 *
 * Optimisations :
 *  - Le canvas généré est converti une seule fois en dataURL PNG, conservé
 *    en cache mémoire (5 dernières entrées), et affiché via <img>. Plus
 *    besoin de manipuler un canvas DOM.
 *  - Les exports PNG/PDF déclenchés depuis l'aperçu réutilisent ce dataURL
 *    au lieu de relancer html2canvas — économise ~500ms par export.
 *  - Cache invalidé implicitement par la clé `${cartelId}|${lang}` : un
 *    changement de langue ou de cartel relance le rendu.
 */

// Cache module-level : on garde les dernières prévisualisations rendues pour
// rendre instantanées les ré-ouvertures (workflow typique : ouvrir/fermer
// plusieurs aperçus successifs). 5 entrées max → ~50 Mo en mémoire au pire,
// bornes raisonnables. PNG sans recompression, donc pas de perte qualité.
const previewCache = new Map();
const PREVIEW_CACHE_MAX = 5;
const setCache = (key, value) => {
    previewCache.set(key, value);
    while (previewCache.size > PREVIEW_CACHE_MAX) {
        const oldest = previewCache.keys().next().value;
        previewCache.delete(oldest);
    }
};

const safeFilename = (cartel, lang) => {
    const isEn = lang && lang.startsWith('en');
    const t = (isEn && cartel.titre_en) ? cartel.titre_en : cartel.titre;
    return (t || 'sans-titre').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
};

const PrintPreview = ({ data }) => {
    const { t, i18n } = useTranslation();
    const [dataUrl, setDataUrl] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (!data) return;
        let cancelled = false;
        const key = `${data.id}|${i18n.language}`;
        const cached = previewCache.get(key);

        if (cached) {
            // Cache hit : on remet dans le bon ordre LRU (re-set au plus
            // récent) puis on affiche directement.
            previewCache.delete(key);
            previewCache.set(key, cached);
            setDataUrl(cached);
            setBusy(false);
            setError('');
            return;
        }

        setBusy(true);
        setError('');
        setDataUrl(null);

        const container = setupContainer();
        (async () => {
            try {
                const canvas = await renderCartelToCanvas(data, container, i18n.language);
                if (cancelled) return;
                // PNG sans recompression : qualité conservée pour les exports
                // qui réutiliseront ce dataURL tel quel.
                const url = canvas.toDataURL('image/png');
                setCache(key, url);
                setDataUrl(url);
            } catch (e) {
                if (!cancelled) setError(e.message || String(e));
            } finally {
                if (container.parentNode) container.parentNode.removeChild(container);
                if (!cancelled) setBusy(false);
            }
        })();

        return () => { cancelled = true; };
    }, [data, i18n.language]);

    const handleExportPng = async () => {
        if (!dataUrl || exporting) return;
        setExporting(true);
        try {
            // dataURL → Blob via fetch, plus rapide que de relancer html2canvas
            const blob = await (await fetch(dataUrl)).blob();
            saveAs(blob, `${safeFilename(data, i18n.language)}.png`);
        } finally { setExporting(false); }
    };

    const handleExportPdf = async () => {
        if (!dataUrl || exporting) return;
        setExporting(true);
        try {
            // jsPDF accepte un dataURL PNG directement. Même mise en page que
            // generatePdf : A4 paysage, image plein cadre.
            const pdf = new jsPDF('l', 'mm', 'a4');
            pdf.addImage(dataUrl, 'PNG', 0, 0, 297, 210);
            pdf.save(`${safeFilename(data, i18n.language)}.pdf`);
        } finally { setExporting(false); }
    };

    const aspect = `${PRINT_CARTEL_DIMS.width} / ${PRINT_CARTEL_DIMS.height}`;

    return (
        <div style={{ position: 'relative', width: '100%', aspectRatio: aspect, background: '#f5f5f5', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e5e5' }}>
            {dataUrl && (
                <img
                    src={dataUrl}
                    alt={data?.titre || ''}
                    style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
                />
            )}

            {busy && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', gap: 10, color: '#666', fontSize: '0.88rem' }}>
                    <Loader2 size={20} style={{ animation: 'paleoSpin 1s linear infinite' }} />
                    {t('preview.rendering', 'Génération de l\'aperçu…')}
                    <style>{`@keyframes paleoSpin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {error && !busy && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d32f2f', fontSize: '0.88rem', padding: 20, textAlign: 'center' }}>
                    {error}
                </div>
            )}

            {/* Boutons d'export en superposition. Réutilisent le dataURL en
                cache → quasi instantanés (~10–50ms) après le rendu initial. */}
            <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6, zIndex: 5 }}>
                <button
                    onClick={handleExportPng}
                    disabled={!dataUrl || exporting}
                    title={t('preview.exportPng', 'Télécharger en PNG')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px', borderRadius: 8, border: 'none', background: 'rgba(20,20,20,0.85)', color: 'white', cursor: !dataUrl || exporting ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', backdropFilter: 'blur(4px)', opacity: !dataUrl || exporting ? 0.6 : 1 }}
                >
                    <ImageIcon size={14} /> PNG
                </button>
                <button
                    onClick={handleExportPdf}
                    disabled={!dataUrl || exporting}
                    title={t('preview.exportPdf', 'Télécharger en PDF')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px', borderRadius: 8, border: 'none', background: 'rgba(20,20,20,0.85)', color: 'white', cursor: !dataUrl || exporting ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', backdropFilter: 'blur(4px)', opacity: !dataUrl || exporting ? 0.6 : 1 }}
                >
                    <FileText size={14} /> PDF
                </button>
            </div>
        </div>
    );
};

export default PrintPreview;
