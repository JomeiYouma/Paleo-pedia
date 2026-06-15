import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import CartelPreview from './CartelPreview';
import ConfirmModal from './ConfirmModal';
import { getYearForSort } from '../utils/helpers';
import { ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLocalizedContent } from '../utils/i18nHelpers';
import { rememberReturn } from '../utils/navigation';
import { getHostSubsiteSlug, subsiteBasePath } from '../utils/subsiteHost';

const TimelineMode = ({ cartels, onDelete, targetId, isAdmin }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    // Slug défini soit par la route /site/:slug/*, soit par le host dédié
    // (paleo-h2o.org → h2o). Sinon, on est côté site principal.
    const { slug: routeSlug } = useParams();
    const subsiteSlug = routeSlug || getHostSubsiteSlug() || null;
    const createBasePath = subsiteSlug ? `${subsiteBasePath(subsiteSlug)}/create` : '/app/create';
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    // Store zoom transform to persist across re-renders
    const zoomTransformRef = useRef(d3.zoomIdentity);
    // Store the zoom behavior instance to avoid recreating it on every selection change
    const zoomRef = useRef(null);
    // Store current language in a ref so D3 closures can read it without stale values
    const langRef = useRef(i18n.language);
    useEffect(() => { langRef.current = i18n.language; }, [i18n.language]);

    // Maintain selection state
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [confirmState, setConfirmState] = useState(null);

    // Filter valid cartels with years AND calculate stacking
    const validCartels = useMemo(() => {
        const sorted = cartels
            .map((c, idx) => ({ ...c, originalIndex: idx, year: getYearForSort(c) }))
            .filter(c => c.year !== null)
            .sort((a, b) => a.year - b.year);

        // Stacking logic
        const stacked = [];
        const stackMap = new Map(); // Year -> Count/Level

        sorted.forEach(c => {
            const year = c.year;
            const level = stackMap.get(year) || 0;
            stackMap.set(year, level + 1);

            // Alternating stack from center
            // 0, -8, 8, -16, 16
            let yOffset = 0;
            if (level > 0) {
                const sign = level % 2 === 0 ? 1 : -1;
                const power = Math.ceil(level / 2);
                yOffset = sign * power * 8; // Reduced gap to 8px
            }

            stacked.push({ ...c, yOffset });
        });

        return stacked;
    }, [cartels]);

    // Mémorise l'id du cartel courant pour pouvoir le restaurer après un
    // changement du jeu de cartels (toggle d'un filtre catégorie, refresh...).
    const lastSelectedIdRef = useRef(null);
    useEffect(() => {
        const c = validCartels[selectedIndex];
        if (c) lastSelectedIdRef.current = c.id;
    }, [selectedIndex, validCartels]);

    // Position partageable par URL : ?at=<id>. Capturée une seule fois au montage
    // (on n'y réagit pas ensuite, pour ne pas boucler avec nos propres écritures).
    const initialAtRef = useRef(new URLSearchParams(location.search).get('at'));

    // Résout la sélection : targetId (#cartel-, retour d'édition) > ?at= (lien
    // partagé) > cartel précédent > premier. Le fallback évite un selectedIndex
    // hors bornes après un filtre (sinon plus aucun cartel ne s'affiche).
    useEffect(() => {
        if (!validCartels.length) return;
        const pick = (id) => {
            if (id == null) return false;
            const idx = validCartels.findIndex(c => String(c.id) === String(id));
            if (idx !== -1) { setSelectedIndex(idx); return true; }
            return false;
        };
        if (targetId && pick(targetId)) return;
        if (initialAtRef.current && pick(initialAtRef.current)) { initialAtRef.current = null; return; }
        if (lastSelectedIdRef.current && pick(lastSelectedIdRef.current)) return;
        setSelectedIndex(0);
    }, [targetId, validCartels]);

    // Écrit la position courante dans l'URL (?at=<id>, en replace) à chaque
    // déplacement → le lien partagé rouvre la frise sur CE cartel. On saute la
    // résolution initiale pour ne pas écrire au simple chargement.
    const didInitWriteRef = useRef(false);
    useEffect(() => {
        const c = validCartels[selectedIndex];
        if (!c) return;
        if (!didInitWriteRef.current) { didInitWriteRef.current = true; return; }
        // Debounce : on n'écrit qu'après ~300 ms sans nouveau déplacement, pour
        // ne pas spammer history.replaceState (limité par les navigateurs) quand
        // on scrute la frise rapidement (flèches maintenues).
        const tid = setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            if (params.get('at') === String(c.id)) return;
            params.set('at', String(c.id));
            navigate(`${window.location.pathname}?${params.toString()}`, { replace: true });
        }, 300);
        return () => clearTimeout(tid);
    }, [selectedIndex, validCartels]); // eslint-disable-line react-hooks/exhaustive-deps

    // Initialization Effect (Draws Axis, Zoom, Markers initially)
    useEffect(() => {
        if (!validCartels.length || !svgRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = 200; // Increased height
        const margin = { top: 20, right: 40, bottom: 30, left: 40 };

        // Clear previous SVG to fully reset on data change
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height]);

        // X Scale
        const minYear = d3.min(validCartels, d => d.year) || -1000;
        const maxYear = d3.max(validCartels, d => d.year) || 2050;
        const padding = (maxYear - minYear) * 0.05;

        const x = d3.scaleLinear()
            .domain([minYear - padding, maxYear + padding])
            .range([margin.left, width - margin.right]);


        // Structure
        const g = svg.append("g");

        // Axis Group
        const gX = g.append("g")
            .attr("class", "timeline-axis")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(width / 80).tickFormat(d => d));

        // Center Line
        g.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", height / 2)
            .attr("y2", height / 2)
            .attr("stroke", "#eee") // Lighter
            .attr("stroke-width", 1);


        // Markers
        const markers = g.selectAll(".timeline-marker")
            .data(validCartels)
            .join("circle")
            .attr("class", "timeline-marker")
            .attr("cx", d => x(d.year))
            .attr("cy", d => (height / 2) + d.yOffset) // Use Offset
            .attr("r", 6)
            .attr("fill", "#999") // Darker default
            .attr("stroke", "none")
            .attr("cursor", "pointer")
            .on("click", (event, d) => {
                const globalIndex = validCartels.findIndex(c => c.id === d.id);
                setSelectedIndex(globalIndex);
                event.stopPropagation();
            })
            // Hover Effect: Timeline Title
            .on("mouseover", function (event, d) {
                d3.select(this).attr("r", 8); // Enlarge slightly

                // Remove any existing label first
                g.selectAll(".timeline-hover-label").remove();

                // Titre localisé selon la langue active
                const label = (langRef.current === 'en' && d.titre_en) ? d.titre_en : d.titre;

                // Add Label
                g.append("text")
                    .attr("class", "timeline-hover-label")
                    .attr("x", d3.select(this).attr("cx"))
                    .attr("y", parseFloat(d3.select(this).attr("cy")) - 12) // Above the point
                    .attr("text-anchor", "middle")
                    .text(label)
                    .style("font-size", "10px")
                    .style("font-weight", "bold")
                    .style("fill", "black")
                    .style("pointer-events", "none")
                    .style("paint-order", "stroke fill")
                    .style("stroke", "white")
                    .style("stroke-width", "3px")
                    .style("stroke-linecap", "round")
                    .style("stroke-linejoin", "round");
            })
            .on("mouseout", function (event, d) {
                // Reset size if not selected
                const isSelected = d3.select(this).classed("active-marker");
                if (!isSelected) d3.select(this).attr("r", 6);

                // Remove label
                g.selectAll(".timeline-hover-label").remove();
            });

        // Highlight Ring (Create hidden initially)
        g.append("circle")
            .attr("class", "selection-ring")
            .attr("r", 12)
            .attr("fill", "none")
            .attr("stroke", () => getComputedStyle(document.documentElement).getPropertyValue('--color-pink-darker').trim() || '#C2185B')
            .attr("stroke-width", 2)
            .attr("opacity", 0); // Hidden by default

        // Attach Zoom (store in ref so update effect can reuse it)
        // translateExtent borné sur l'étendue réelle des marqueurs (du plus
        // ancien au plus récent) + une marge de confort, plutôt que sur tout
        // le viewport. Sinon, à fort zoom, le pan bute sur le vide (marges +
        // padding du domaine) et on ne peut pas amener le tout premier / tout
        // dernier cartel jusqu'au bord (« on ne peut plus drag jusqu'au bout »).
        const panPad = 48;
        const xMinData = Math.min(x(minYear), x(maxYear)) - panPad;
        const xMaxData = Math.max(x(minYear), x(maxYear)) + panPad;
        const zoom = d3.zoom()
            .scaleExtent([1, 50])
            .translateExtent([[xMinData, 0], [xMaxData, height]])
            .extent([[0, 0], [width, height]])
            .on("zoom", (event) => {
                zoomTransformRef.current = event.transform;
                updateChart(event.transform);
            });

        zoomRef.current = zoom;
        svg.call(zoom);

        // Restore zoom if exists (or reset)
        svg.call(zoom.transform, zoomTransformRef.current);

        // Helper to update positions
        function updateChart(transform) {
            const xz = transform.rescaleX(x);
            gX.call(d3.axisBottom(xz).ticks(width / 80).tickFormat(d => d));

            g.selectAll(".timeline-marker")
                .attr("cx", d => xz(d.year));

            // We update positions only. Styles are handled by the other effect.
        }

        // Store scale for use in update effect? 
        // No, we re-derive in update effect to be safe.

    }, [validCartels]); // Only run on data change


    // Update Effect (Runs on selection change)
    // Updates styles and selection ring position WITHOUT resetting zoom
    useEffect(() => {
        if (!validCartels.length || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        const g = svg.select("g");
        const transform = zoomTransformRef.current;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = 200; // Match init height
        const margin = { top: 20, right: 40, bottom: 30, left: 40 };

        const minYear = d3.min(validCartels, d => d.year) || -1000;
        const maxYear = d3.max(validCartels, d => d.year) || 2050;
        const padding = (maxYear - minYear) * 0.05;

        const xBase = d3.scaleLinear()
            .domain([minYear - padding, maxYear + padding])
            .range([margin.left, width - margin.right]);

        const xz = transform.rescaleX(xBase);

        // Update Markers Styles
        const activeColor = getComputedStyle(document.documentElement).getPropertyValue('--color-pink-darker').trim() || '#C2185B';
        g.selectAll(".timeline-marker")
            .attr("fill", (d, i) => i === selectedIndex ? activeColor : "#999")
            .attr("stroke", (d, i) => i === selectedIndex ? "white" : "none")
            .attr("stroke-width", 2)
            .attr("r", (d, i) => i === selectedIndex ? 8 : 6)
            .raise(); // Bring selected to front

        // Update Selection Ring Position + couleur (peut avoir changé si sous-site)
        const selectedData = validCartels[selectedIndex];
        if (selectedData) {
            g.select(".selection-ring")
                .attr("opacity", 1)
                .attr("stroke", activeColor)
                .attr("cx", xz(selectedData.year))
                .attr("cy", (height / 2) + selectedData.yOffset)
                .raise();
        } else {
            g.select(".selection-ring").attr("opacity", 0);
        }

        // Tag active marker for dynamic updates in zoom handler
        g.selectAll(".timeline-marker")
            .classed("active-marker", (d, i) => i === selectedIndex);

        // Re-use the zoom behavior stored in ref (do NOT recreate it here to avoid stacking listeners)
        if (zoomRef.current) {
            // Update the zoom handler so it has access to the new xBase + selectedIndex
            zoomRef.current.on("zoom", (event) => {
                zoomTransformRef.current = event.transform;
                const newXz = event.transform.rescaleX(xBase);

                // Update Axis
                g.select(".timeline-axis").call(d3.axisBottom(newXz).ticks(width / 80).tickFormat(d => d));

                // Update Markers
                g.selectAll(".timeline-marker").attr("cx", d => newXz(d.year));

                // Update Ring for ACTIVE marker
                const activeMarker = g.select(".active-marker");
                if (!activeMarker.empty()) {
                    const d = activeMarker.datum();
                    g.select(".selection-ring")
                        .attr("cx", newXz(d.year))
                        .attr("cy", (height / 2) + d.yOffset);
                }
            });
            svg.call(zoomRef.current).call(zoomRef.current.transform, transform);
        }

    }, [validCartels, selectedIndex]); // This runs on selection change


    // Keyboard Navigation (Restored)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
            } else if (e.key === 'ArrowRight') {
                setSelectedIndex(prev => (prev < validCartels.length - 1 ? prev + 1 : prev));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [validCartels.length]);


    if (!validCartels.length) return <div className="container">{t('library.empty')}</div>;

    const currentCartel = validCartels[selectedIndex];

    return (
        <div style={{
            height: 'calc(100vh - 180px)',
            // minHeight abaissé (600→500) et chrome resserré (marges/gap) pour
            // donner plus de hauteur au cartel sur les écrans standards (~768px),
            // où le panneau était trop court et imposait un scroll permanent.
            minHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
            marginTop: '10px',
            gap: '12px',
            padding: '0 4px',
        }}>
            {/* ════════════════════════════════════════════════════════
                ZONE CARTEL — pas de cadre : le cartel sert lui-même
                de "carte" pour éviter les rectangles imbriqués
               ════════════════════════════════════════════════════════ */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Prev Button */}
                <button
                    onClick={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
                    disabled={selectedIndex === 0}
                    aria-label="Cartel précédent"
                    style={{
                        position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                        zIndex: 50, background: 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)', padding: '12px',
                        border: '1px solid var(--color-border)',
                        cursor: selectedIndex === 0 ? 'not-allowed' : 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        opacity: selectedIndex === 0 ? 0.4 : 1,
                        color: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <ChevronLeft size={26} />
                </button>

                {/* Card Display - Constrained Container */}
                {currentCartel && (
                    <div style={{
                        position: 'relative',
                        height: '100%',
                        maxHeight: 'calc(100vh - 240px)',
                        width: '80%',
                        maxWidth: '1200px',
                        display: 'flex',
                        flexDirection: 'column',
                        margin: '12px 0',
                    }}>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <CartelPreview key={currentCartel.id} data={currentCartel} />
                        </div>

                        {/* Admin Actions */}
                        <div style={{
                            position: 'absolute', top: '12px', right: '-56px',
                            display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 40
                        }}>
                            {isAdmin && (
                                <>
                                    <button
                                        onClick={() => {
                                            const returnTo = rememberReturn(location, { scrollId: currentCartel.id });
                                            navigate(`${createBasePath}?edit=${currentCartel.id}`, { state: { returnTo } });
                                        }}
                                        title={t('cartel.edit')}
                                        aria-label={t('cartel.edit')}
                                        style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', padding: '10px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', display: 'flex' }}
                                    >
                                        <Edit size={18} color="var(--color-primary)" />
                                    </button>
                                    <button
                                        onClick={() => setConfirmState({
                                            message: t('messages.deleteConfirm', 'Supprimer ce cartel ?'),
                                            onConfirm: () => { onDelete(currentCartel.id); setConfirmState(null); },
                                        })}
                                        title={t('cartel.delete')}
                                        aria-label={t('cartel.delete')}
                                        style={{ border: '1px solid var(--color-error)', background: 'var(--color-surface)', cursor: 'pointer', padding: '10px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', display: 'flex' }}
                                    >
                                        <Trash2 size={18} color="var(--color-error)" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Next Button */}
                <button
                    onClick={() => setSelectedIndex(prev => Math.min(validCartels.length - 1, prev + 1))}
                    disabled={selectedIndex === validCartels.length - 1}
                    aria-label="Cartel suivant"
                    style={{
                        position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                        zIndex: 50, background: 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)', padding: '12px',
                        border: '1px solid var(--color-border)',
                        cursor: selectedIndex === validCartels.length - 1 ? 'not-allowed' : 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        opacity: selectedIndex === validCartels.length - 1 ? 0.4 : 1,
                        color: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <ChevronRight size={26} />
                </button>
            </div>

            {/* ════════════════════════════════════════════════════════
                FRISE — panel séparé, libellé en haut + zone scrollable
               ════════════════════════════════════════════════════════ */}
            <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                flexShrink: 0,
            }}>
                {/* En-tête de la frise : signe le rôle de cette zone */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 16px',
                    background: 'var(--color-primary)',
                    color: 'var(--color-white)',
                    borderBottom: `3px solid var(--color-accent)`,
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}>
                    <span>Frise chronologique</span>
                    <span style={{ color: 'rgba(255,255,255,0.65)', fontWeight: '400', textTransform: 'none', letterSpacing: 'normal', fontSize: '0.78rem' }}>
                        {t('timeline.scroll_instruction', "Zoomez avec la molette et déplacez-vous pour explorer le temps. (Flèches ← → pour naviguer)")}
                    </span>
                </div>
                <div
                    ref={containerRef}
                    style={{
                        // 180→150 : le SVG a un viewBox fixe (height=200) qui se met
                        // automatiquement à l'échelle, donc on récupère ~30px pour le
                        // cartel sans toucher au rendu D3 (léger tassement vertical).
                        height: '150px',
                        background: 'var(--color-surface)',
                        position: 'relative',
                        width: '100%',
                    }}
                >
                    <svg ref={svgRef} style={{ width: '100%', height: '100%', cursor: 'grab' }}></svg>
                </div>
            </div>

            {/* Modale de confirmation (remplace window.confirm) */}
            {confirmState && (
                <ConfirmModal
                    message={confirmState.message}
                    confirmLabel={t('action.delete', 'Supprimer')}
                    cancelLabel={t('action.cancel', 'Annuler')}
                    onConfirm={confirmState.onConfirm}
                    onCancel={() => setConfirmState(null)}
                />
            )}
        </div>
    );
};

export default TimelineMode;
