import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import {
    renderCartelToCanvas,
    setupContainer,
    generateImage,
    generatePdf,
    PRINT_CARTEL_DIMS,
} from '../utils/zipGenerator';

/**
 * Aperçu fidèle du rendu imprimé d'un cartel.
 *
 * Utilise `renderCartelToCanvas` (la même fonction qui produit les exports
 * PNG/PDF) pour garantir des dimensions strictement égales au cartel
 * imprimé (ratio A4 paysage = 3508×2480 px). Le canvas est encapsulé dans
 * un conteneur à ratio fixe ; on s'en fiche de l'échelle d'affichage à
 * l'écran, seuls les rapports comptent.
 *
 * Boutons d'export en superposition (PNG / PDF) pour ne pas fausser l'aperçu.
 */
const PrintPreview = ({ data }) => {
    const { t, i18n } = useTranslation();
    const canvasHostRef = useRef(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [exportBusy, setExportBusy] = useState(false);

    // Régénère le canvas chaque fois que le cartel cible ou la langue changent.
    // L'effet déplace le canvas généré dans `canvasHostRef`. On nettoie aussi
    // le container offscreen utilisé par `renderCartelToCanvas`.
    useEffect(() => {
        if (!data) return;
        let cancelled = false;
        setBusy(true);
        setError('');

        const container = setupContainer();
        (async () => {
            try {
                const canvas = await renderCartelToCanvas(data, container, i18n.language);
                if (cancelled || !canvasHostRef.current) return;
                // Le canvas garde ses dimensions natives ; on le force en
                // largeur 100% pour qu'il occupe la box parente, le ratio
                // CSS se charge du reste.
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.display = 'block';
                canvasHostRef.current.innerHTML = '';
                canvasHostRef.current.appendChild(canvas);
            } catch (e) {
                if (!cancelled) setError(e.message || String(e));
            } finally {
                // setupContainer crée un node dans body, on doit le retirer
                if (container.parentNode) container.parentNode.removeChild(container);
                if (!cancelled) setBusy(false);
            }
        })();

        return () => { cancelled = true; };
    }, [data, i18n.language]);

    const handleExportPng = async () => {
        if (exportBusy) return;
        setExportBusy(true);
        try { await generateImage(data, i18n.language); }
        finally { setExportBusy(false); }
    };

    const handleExportPdf = async () => {
        if (exportBusy) return;
        setExportBusy(true);
        try { await generatePdf([data], i18n.language); }
        finally { setExportBusy(false); }
    };

    // Ratio A4 paysage (largeur / hauteur). aspect-ratio CSS garantit que le
    // conteneur garde toujours ces proportions, quelle que soit la largeur
    // dispo dans la modal.
    const aspect = `${PRINT_CARTEL_DIMS.width} / ${PRINT_CARTEL_DIMS.height}`;

    return (
        <div style={{ position: 'relative', width: '100%', aspectRatio: aspect, background: '#f5f5f5', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e5e5' }}>
            {/* Canvas hôte : on injecte ici le canvas généré par html2canvas. */}
            <div ref={canvasHostRef} style={{ width: '100%', height: '100%' }} />

            {/* Loader pendant le rendu (compositer html2canvas peut prendre
                quelques centaines de ms sur un gros cartel). */}
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

            {/* Boutons d'export en overlay (haut-droit) — ne font pas partie
                du rendu imprimé, donc ne faussent pas l'aperçu. */}
            <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6, zIndex: 5 }}>
                <button
                    onClick={handleExportPng}
                    disabled={busy || exportBusy}
                    title={t('preview.exportPng', 'Télécharger en PNG')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px', borderRadius: 8, border: 'none', background: 'rgba(20,20,20,0.85)', color: 'white', cursor: busy || exportBusy ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', backdropFilter: 'blur(4px)' }}
                >
                    <ImageIcon size={14} /> PNG
                </button>
                <button
                    onClick={handleExportPdf}
                    disabled={busy || exportBusy}
                    title={t('preview.exportPdf', 'Télécharger en PDF')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px', borderRadius: 8, border: 'none', background: 'rgba(20,20,20,0.85)', color: 'white', cursor: busy || exportBusy ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', backdropFilter: 'blur(4px)' }}
                >
                    <FileText size={14} /> PDF
                </button>
            </div>
        </div>
    );
};

export default PrintPreview;
