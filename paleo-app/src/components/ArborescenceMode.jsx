import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import CartelPreview from './CartelPreview';
import { X, Settings } from 'lucide-react';

const ArborescenceMode = ({ cartels = [] }) => {
    const { isAdmin, categories = [] } = useApp();
    const svgRef = useRef(null);
    const { i18n } = useTranslation();
    const isEn = i18n.language === 'en';

    const [selectedNode, setSelectedNode] = useState(null);
    const [audioActive, setAudioActive] = useState(false);

    // ── Paramètres d'affichage ───────────────────────────────
    const [panelOpen,        setPanelOpen]        = useState(false);
    const [sizeByCount,      setSizeByCount]      = useState(false);
    const [sizeSpread,       setSizeSpread]       = useState(50);
    const [linkDistance,     setLinkDistance]     = useState(100);
    const [hideCartelLabels, setHideCartelLabels] = useState(false);
    const [colorMode,        setColorMode]        = useState(0); // 0: off, 1: nodes, 2: nodes + links

    // ── Easter egg : audio réactif ────────────────────────────
    const nodeSelRef     = useRef(null); // sélection D3 des groupes nœuds
    const linkSelRef     = useRef(null); // sélection D3 des liens
    const simRef         = useRef(null); // simulation D3
    const audioCtxRef    = useRef(null);
    const analyserRef    = useRef(null);
    const streamRef      = useRef(null);
    const rafRef         = useRef(null);
    const audioActiveRef = useRef(false);
    const keysRef        = useRef({ alt: false, a: false });
    const colorModeRef   = useRef(0); // lu depuis la boucle rAF audio

    // ── Données du graphe ─────────────────────────────────────
    const graphData = useMemo(() => {
        const activeCats = new Set();
        const cartelNodes = [];
        const links = [];
        const cartelCountByCat = {};

        if (!Array.isArray(cartels)) return { nodes: [], links: [] };

        // Map nom de catégorie (FR ou EN) → couleur définie en admin
        const colorByCat = {};
        (Array.isArray(categories) ? categories : []).forEach(c => {
            if (c?.name    && c?.color) colorByCat[c.name]    = c.color;
            if (c?.name_en && c?.color) colorByCat[c.name_en] = c.color;
        });

        cartels.forEach(c => {
            if (!isAdmin && c.status !== 'published') return;
            const cats = isEn && c.categories_en ? c.categories_en : (c.categories || []);
            const catColors = cats.map(cat => colorByCat[cat] || '#F48FB1');
            const node = {
                id: `cartel-${c.id}`, type: 'cartel', data: c,
                radius: 8, color: '#F48FB1',
                categoryColors: catColors,
            };
            cartelNodes.push(node);
            cats.forEach(cat => {
                activeCats.add(cat);
                cartelCountByCat[cat] = (cartelCountByCat[cat] || 0) + 1;
                links.push({ source: node.id, target: `cat-${cat}`, value: 1 });
            });
        });

        const categoryNodes = Array.from(activeCats).map(cat => ({
            id: `cat-${cat}`, type: 'category', name: cat,
            radius: 20, color: '#C2185B',
            cartelCount: cartelCountByCat[cat] || 0,
            categoryColor: colorByCat[cat] || '#C2185B',
        }));

        return { nodes: [...categoryNodes, ...cartelNodes], links };
    }, [cartels, isEn, isAdmin, categories]);

    // ── Simulation D3 ─────────────────────────────────────────
    useEffect(() => {
        if (!svgRef.current || graphData.nodes.length === 0) return;

        const width  = svgRef.current.clientWidth  || 800;
        const height = svgRef.current.clientHeight || 600;

        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current).attr('viewBox', [0, 0, width, height]);

        svg.append('style').text(`
            .arb-cat-text {
                fill: black !important; stroke: none !important;
                font-family: sans-serif !important; font-weight: bold !important;
                pointer-events: none !important; opacity: 1 !important;
            }
            .arb-cartel-text {
                fill: black !important; stroke: white !important; stroke-width: 4px !important;
                paint-order: stroke fill !important; stroke-linejoin: round !important;
                font-family: sans-serif !important; font-weight: bold !important;
                pointer-events: none !important; opacity: 0.6 !important;
            }
        `);

        const defs   = svg.append('defs');
        const filter = defs.append('filter').attr('id', 'drop-shadow').attr('height', '130%');
        filter.append('feGaussianBlur').attr('in', 'SourceAlpha').attr('stdDeviation', 3).attr('result', 'blur');
        filter.append('feOffset').attr('in', 'blur').attr('dx', 2).attr('dy', 2).attr('result', 'offsetBlur');
        filter.append('feFlood').attr('flood-color', '#000').attr('flood-opacity', 0.2).attr('result', 'offsetColor');
        filter.append('feComposite').attr('in', 'offsetColor').attr('in2', 'offsetBlur').attr('operator', 'in').attr('result', 'offsetBlur');
        filter.append('feMerge').selectAll('feMergeNode').data(['offsetBlur', 'SourceGraphic']).enter().append('feMergeNode').attr('in', d => d);

        // Gradients pour cartels multi-catégories (utilisés par le mode couleurs)
        const cartelsMulti = graphData.nodes.filter(n => n.type === 'cartel' && (n.categoryColors?.length || 0) > 1);
        defs.selectAll('linearGradient.cartel-gradient')
            .data(cartelsMulti, d => d.id)
            .enter()
            .append('linearGradient')
                .attr('class', 'cartel-gradient')
                .attr('id', d => `grad-${d.id}`)
                .attr('x1', '0%').attr('y1', '0%')
                .attr('x2', '100%').attr('y2', '100%')
                .each(function (d) {
                    const sel = d3.select(this);
                    const n = d.categoryColors.length;
                    d.categoryColors.forEach((c, i) => {
                        sel.append('stop')
                            .attr('offset', `${Math.round((i / (n - 1)) * 100)}%`)
                            .attr('stop-color', c);
                    });
                });

        const g    = svg.append('g');
        const zoom = d3.zoom().scaleExtent([0.1, 4]).on('zoom', ev => g.attr('transform', ev.transform));
        svg.call(zoom);

        const simulation = d3.forceSimulation(graphData.nodes)
            .force('link',    d3.forceLink(graphData.links).id(d => d.id).distance(100))
            .force('charge',  d3.forceManyBody().strength(-300))
            .force('center',  d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide().radius(d => d.radius + 5));

        simRef.current = simulation;

        const link = g.append('g')
            .attr('stroke', '#999').attr('stroke-opacity', 0.6)
            .selectAll('line').data(graphData.links).join('line').attr('stroke-width', 1);

        linkSelRef.current = link;

        const node = g.append('g')
            .attr('stroke', '#fff').attr('stroke-width', 1.5)
            .selectAll('g').data(graphData.nodes).join('g')
            .call(drag(simulation));

        node.append('circle')
            .attr('r', d => d.radius)
            .attr('fill', d => d.color)
            .style('filter', 'url(#drop-shadow)')
            .attr('cursor', 'pointer')
            .on('click', (event, d) => { if (d.type === 'cartel') { setSelectedNode(d.data); event.stopPropagation(); } })
            .on('mouseover', function (_, d) {
                d3.select(this).transition().duration(200).attr('r', d.radius * 1.3).attr('stroke', 'white').attr('stroke-width', 3);
                d3.select(this.parentNode).raise();
                const full = d.type === 'category' ? d.name : (d.data.titre || 'Sans titre');
                const txt  = d3.select(this.parentNode).select('text').text(full.toUpperCase());
                if (d.type === 'cartel') txt.style('opacity', '1', 'important');
            })
            .on('mouseout', function (_, d) {
                d3.select(this).transition().duration(200).attr('r', d.radius).attr('stroke', 'none').attr('stroke-width', 0);
                const raw  = d.type === 'category' ? d.name : (d.data.titre || 'Sans titre');
                const trunc = raw.substring(0, 15) + (raw.length > 15 ? '…' : '');
                const txt  = d3.select(this.parentNode).select('text').text(trunc.toUpperCase());
                if (d.type === 'cartel') txt.style('opacity', '0.6', 'important');
            });

        node.append('text')
            .text(d => { const r = d.type === 'category' ? d.name : (d.data.titre || 'Sans titre'); return (r.substring(0, 15) + (r.length > 15 ? '…' : '')).toUpperCase(); })
            .attr('x', d => d.type === 'category' ? 25 : 12)
            .attr('y', 4)
            .attr('font-size', d => d.type === 'category' ? '13px' : '9px')
            .attr('class', d => d.type === 'category' ? 'arb-cat-text' : 'arb-cartel-text');

        nodeSelRef.current = node;

        simulation.on('tick', () => {
            link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
            // Si l'audio est actif le rAF gère les transforms, sinon D3 le fait
            if (!audioActiveRef.current) {
                node.attr('transform', d => `translate(${d.x},${d.y})`);
            }
        });

        return () => {
            simulation.stop();
            simRef.current   = null;
            nodeSelRef.current = null;
            linkSelRef.current = null;
        };
    }, [graphData]);

    // ── Refs pour éviter de relancer la simulation au montage ─
    const didMountSizeRef  = useRef(false);
    const didMountDistRef  = useRef(false);

    // ── Taille des catégories selon le nombre de cartels ─────
    useEffect(() => {
        if (!nodeSelRef.current || !simRef.current) return;
        if (!didMountSizeRef.current) { didMountSizeRef.current = true; return; }
        const cats = graphData.nodes.filter(n => n.type === 'category');
        const maxCount = d3.max(cats, n => n.cartelCount || 0) || 1;
        const rScale = d3.scaleSqrt().domain([1, Math.max(1, maxCount)]).range([14, sizeSpread]);
        graphData.nodes.forEach(n => {
            if (n.type === 'category') {
                n.radius = sizeByCount ? rScale(Math.max(1, n.cartelCount || 0)) : 20;
            }
        });
        nodeSelRef.current.select('circle').transition().duration(300).attr('r', d => d.radius);
        nodeSelRef.current.select('text').attr('x', d => d.type === 'category' ? (d.radius + 5) : 12);
        simRef.current.force('collide').radius(d => d.radius + 5);
        simRef.current.alpha(0.3).restart();
    }, [sizeByCount, sizeSpread, graphData]);

    // ── Distance des liens ───────────────────────────────────
    useEffect(() => {
        if (!simRef.current) return;
        if (!didMountDistRef.current) { didMountDistRef.current = true; return; }
        const linkForce = simRef.current.force('link');
        if (linkForce) linkForce.distance(linkDistance);
        simRef.current.alpha(0.3).restart();
    }, [linkDistance, graphData]);

    // ── Masquage des titres de cartels ───────────────────────
    useEffect(() => {
        if (!nodeSelRef.current) return;
        nodeSelRef.current.select('text')
            .filter(d => d.type === 'cartel')
            .style('display', hideCartelLabels ? 'none' : null);
    }, [hideCartelLabels, graphData]);

    // ── Mode couleurs (0: off, 1: nœuds, 2: nœuds + liens) ───
    useEffect(() => { colorModeRef.current = colorMode; }, [colorMode]);

    useEffect(() => {
        if (!nodeSelRef.current || !linkSelRef.current) return;
        if (audioActiveRef.current) return; // l'audio reprend la main
        nodeSelRef.current.select('circle')
            .transition().duration(400)
            .attr('fill', d => {
                if (colorMode === 0) return d.color;
                if (d.type === 'category') return d.categoryColor || d.color;
                const colors = d.categoryColors || [];
                if (colors.length === 0) return d.color;
                if (colors.length === 1) return colors[0];
                return `url(#grad-${d.id})`;
            });
        linkSelRef.current
            .transition().duration(400)
            .attr('stroke', d => {
                if (colorMode !== 2) return '#999';
                const tn = d.target;
                return (tn && typeof tn === 'object') ? (tn.categoryColor || '#999') : '#999';
            })
            .attr('stroke-opacity', colorMode === 2 ? 0.75 : 0.6)
            .attr('stroke-width', colorMode === 2 ? 1.5 : 1);
    }, [colorMode, graphData, audioActive]);

    // ── Drag helper ───────────────────────────────────────────
    const drag = (simulation) => {
        const started = (ev) => { if (!ev.active) simulation.alphaTarget(0.3).restart(); ev.subject.fx = ev.subject.x; ev.subject.fy = ev.subject.y; };
        const dragged = (ev) => { ev.subject.fx = ev.x; ev.subject.fy = ev.y; };
        const ended   = (ev) => { if (!ev.active) simulation.alphaTarget(0); ev.subject.fx = null; ev.subject.fy = null; };
        return d3.drag().on('start', started).on('drag', dragged).on('end', ended);
    };

    // ── Audio helpers ─────────────────────────────────────────
    const stopAudio = () => {
        cancelAnimationFrame(rafRef.current);
        streamRef.current?.getTracks().forEach(t => t.stop());
        audioCtxRef.current?.close().catch(() => {});
        streamRef.current = audioCtxRef.current = analyserRef.current = null;
        audioActiveRef.current = false;
        setAudioActive(false);
        // Réinitialisation visuelle
        if (nodeSelRef.current) {
            nodeSelRef.current.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
            nodeSelRef.current.select('circle').attr('fill', d => d.color).attr('r', d => d.radius);
        }
        if (linkSelRef.current) linkSelRef.current.attr('stroke', '#999').attr('stroke-opacity', 0.6).attr('stroke-width', 1);
        if (svgRef.current)     d3.select(svgRef.current).style('filter', null);
    };

    const startAudio = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            const ctx    = new (window.AudioContext || window.webkitAudioContext)();
            const src    = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.75;
            src.connect(analyser);

            streamRef.current    = stream;
            audioCtxRef.current  = ctx;
            analyserRef.current  = analyser;
            audioActiveRef.current = true;
            setAudioActive(true);

            // Geler la simulation pour éviter le conflit de transforms
            simRef.current?.alpha(0).stop();

            const data = new Uint8Array(analyser.frequencyBinCount);
            let tt = 0;

            const animate = () => {
                analyser.getByteFrequencyData(data);
                const avg = data.reduce((s, v) => s + v, 0) / (data.length * 255);
                const vol = Math.min(1, avg * 4.5); // sensibilité boostée
                tt += 0.038;

                if (nodeSelRef.current) {
                    // Ondulation : chaque nœud suit plusieurs ondes sinusoïdales déphasées
                    nodeSelRef.current.attr('transform', d => {
                        const amp = vol * 20;
                        const vx  = Math.sin(tt * 3.7 + (d.x ?? 0) * 0.018) * amp
                                  + Math.sin(tt * 7.1 + (d.y ?? 0) * 0.012) * amp * 0.35;
                        const vy  = Math.cos(tt * 2.9 + (d.y ?? 0) * 0.016) * amp
                                  + Math.cos(tt * 5.3 + (d.x ?? 0) * 0.020) * amp * 0.25;
                        return `translate(${(d.x ?? 0) + vx},${(d.y ?? 0) + vy})`;
                    });

                    // Couleur : rotation de teinte + saturation/luminosité selon le volume
                    const cm = colorModeRef.current;
                    nodeSelRef.current.select('circle')
                        .attr('fill', d => {
                            let baseCol = d.color;
                            if (cm >= 1) {
                                if (d.type === 'category') {
                                    baseCol = d.categoryColor || d.color;
                                } else {
                                    const colors = d.categoryColors || [];
                                    baseCol = colors[0] || d.color;
                                }
                            }
                            const base   = d3.hsl(baseCol);
                            const hShift = vol * 210 + Math.sin(tt * 1.8 + (d.x ?? 0) * 0.01) * vol * 90;
                            return d3.hsl(
                                (base.h + hShift) % 360,
                                Math.min(1, base.s + vol * 0.45),
                                Math.min(0.88, base.l + vol * 0.28),
                            ).toString();
                        })
                        // Pulse de taille
                        .attr('r', d => d.radius * (1 + vol * 0.65 * Math.abs(Math.sin(tt * 4.8 + (d.x ?? 0) * 0.01))));
                }

                if (linkSelRef.current) {
                    const cm  = colorModeRef.current;
                    const hue = (tt * 55) % 360;
                    linkSelRef.current
                        .attr('stroke', d => {
                            if (cm !== 2) {
                                return `hsl(${hue},${55 + vol * 45}%,${40 + vol * 30}%)`;
                            }
                            const tn = d.target;
                            const baseCol = (tn && typeof tn === 'object' && tn.categoryColor) || '#999';
                            const base = d3.hsl(baseCol);
                            return d3.hsl(
                                (base.h + hue) % 360,
                                Math.min(1, base.s + vol * 0.45),
                                Math.min(0.75, base.l + vol * 0.2),
                            ).toString();
                        })
                        .attr('stroke-opacity', 0.25 + vol * 0.75)
                        .attr('stroke-width', 1 + vol * 4.5);
                }

                // Halo lumineux sur tout le SVG
                if (svgRef.current) {
                    d3.select(svgRef.current).style(
                        'filter',
                        vol > 0.05
                            ? `drop-shadow(0 0 ${vol * 28}px hsl(${(tt * 65) % 360},90%,65%))`
                            : null,
                    );
                }

                rafRef.current = requestAnimationFrame(animate);
            };
            animate();
        } catch (err) {
            audioActiveRef.current = false;
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                alert('🎙️ Accès au microphone refusé.');
            }
        }
    };

    // ── Écouteur de touches : Alt + A + Volume↑ ──────────────
    useEffect(() => {
        const onDown = (e) => {
            if (e.key === 'Alt') keysRef.current.alt = true;
            if (e.key === 'a' || e.key === 'A') keysRef.current.a = true;
            if (
                keysRef.current.alt && keysRef.current.a &&
                (e.key === 'AudioVolumeUp' || e.key === 'VolumeUp')
            ) {
                e.preventDefault();
                audioActiveRef.current ? stopAudio() : startAudio();
            }
        };
        const onUp = (e) => {
            if (e.key === 'Alt')                keysRef.current.alt = false;
            if (e.key === 'a' || e.key === 'A') keysRef.current.a   = false;
        };
        window.addEventListener('keydown', onDown);
        window.addEventListener('keyup',   onUp);
        return () => {
            window.removeEventListener('keydown', onDown);
            window.removeEventListener('keyup',   onUp);
        };
    }, []); // refs only → pas de stale closure

    // Nettoyage au démontage
    useEffect(() => () => { stopAudio(); }, []);

    // ── Rendu ─────────────────────────────────────────────────
    return (
        <div style={{ width: '100%', height: 'calc(100vh - 150px)', position: 'relative', overflow: 'hidden', background: '#f9f9f9' }}>

            {/* Indicateur discret mode audio */}
            {audioActive && (
                <div
                    title="Mode son actif — Alt + A + Vol↑ pour désactiver"
                    style={{
                        position: 'absolute', top: 14, right: 14, zIndex: 30,
                        width: 10, height: 10, borderRadius: '50%',
                        background: '#ff4081',
                        boxShadow: '0 0 8px 3px rgba(255,64,129,0.55)',
                        animation: 'audioPulse 0.9s ease-in-out infinite alternate',
                    }}
                />
            )}

            {/* Paramètres d'affichage */}
            <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 20 }}>
                <button
                    onClick={() => setPanelOpen(!panelOpen)}
                    title={isEn ? 'Display settings' : 'Paramètres d\'affichage'}
                    style={{
                        background: 'white', border: 'none', borderRadius: 8,
                        padding: '8px 12px', cursor: 'pointer',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85em',
                    }}
                >
                    <Settings size={14} /> {isEn ? 'Settings' : 'Paramètres'}
                </button>
                {panelOpen && (
                    <div style={{
                        marginTop: 8, background: 'white', padding: 12, borderRadius: 8,
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)', fontSize: '0.85em',
                        minWidth: 240,
                    }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={sizeByCount}
                                onChange={e => setSizeByCount(e.target.checked)}
                            />
                            {isEn ? 'Size by cartel count' : 'Taille selon le nombre de cartels'}
                        </label>
                        {sizeByCount && (
                            <div style={{ marginBottom: 10, paddingLeft: 22 }}>
                                <div style={{ marginBottom: 4 }}>
                                    {isEn ? 'Size amplitude' : 'Amplitude des tailles'} : {sizeSpread}
                                </div>
                                <input
                                    type="range" min={20} max={100} step={5}
                                    value={sizeSpread}
                                    onChange={e => setSizeSpread(Number(e.target.value))}
                                    className="arb-slider"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        )}
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={hideCartelLabels}
                                onChange={e => setHideCartelLabels(e.target.checked)}
                            />
                            {isEn ? 'Hide cartel titles' : 'Masquer les titres des cartels'}
                        </label>
                        <div style={{ marginBottom: 10 }}>
                            <div style={{ marginBottom: 4 }}>
                                {isEn ? 'Color mode' : 'Mode couleurs'} : {
                                    [
                                        isEn ? 'Off' : 'Désactivé',
                                        isEn ? 'Nodes' : 'Nœuds',
                                        isEn ? 'Nodes + links' : 'Nœuds + liens',
                                    ][colorMode]
                                }
                            </div>
                            <input
                                type="range" min={0} max={2} step={1}
                                value={colorMode}
                                onChange={e => setColorMode(Number(e.target.value))}
                                className="arb-slider"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ marginBottom: 4 }}>
                            <div style={{ marginBottom: 4 }}>
                                {isEn ? 'Link distance' : 'Distance des liens'} : {linkDistance}
                            </div>
                            <input
                                type="range" min={5} max={250} step={5}
                                value={linkDistance}
                                onChange={e => setLinkDistance(Number(e.target.value))}
                                className="arb-slider"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Légende */}
            <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10 }}>
                <div style={{ background: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9em' }}>
                        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#C2185B' }} /> Catégorie
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9em' }}>
                        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#F48FB1' }} /> Cartel
                    </div>
                </div>
            </div>

            <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />

            {/* Modale prévisualisation */}
            {selectedNode && (
                <div className="arb-cartel-preview" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 400, background: 'white', boxShadow: '-2px 0 10px rgba(0,0,0,0.1)', zIndex: 20, overflowY: 'auto', padding: 20 }}>
                    <button onClick={() => setSelectedNode(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                    <CartelPreview data={selectedNode} />
                </div>
            )}

            <style>{`
                @keyframes audioPulse {
                    from { transform: scale(1);   opacity: 1;   }
                    to   { transform: scale(1.7); opacity: 0.4; }
                }
                .arb-slider {
                    -webkit-appearance: none;
                    appearance: none;
                    height: 4px;
                    border-radius: 2px;
                    background: #e5e5e5;
                    outline: none;
                    cursor: pointer;
                    margin: 6px 0;
                }
                .arb-slider::-webkit-slider-runnable-track {
                    height: 4px;
                    border-radius: 2px;
                    background: #e5e5e5;
                }
                .arb-slider::-moz-range-track {
                    height: 4px;
                    border-radius: 2px;
                    background: #e5e5e5;
                }
                .arb-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--color-accent);
                    border: 2px solid var(--color-primary);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.25);
                    margin-top: -6px;
                    transition: transform 0.1s, background 0.15s;
                }
                .arb-slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--color-accent);
                    border: 2px solid var(--color-primary);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.25);
                    transition: transform 0.1s, background 0.15s;
                }
                .arb-slider:hover::-webkit-slider-thumb { transform: scale(1.15); background: var(--color-accent-hover); }
                .arb-slider:hover::-moz-range-thumb     { transform: scale(1.15); background: var(--color-accent-hover); }
                .arb-slider:active::-webkit-slider-thumb { transform: scale(1.25); }
                .arb-slider:active::-moz-range-thumb     { transform: scale(1.25); }
                .arb-slider:focus-visible { outline: var(--focus-ring-width) solid var(--focus-ring-color); outline-offset: 4px; }

                /* Image en bannière dans le panneau latéral de l'arborescence */
                .arb-cartel-preview .cartel-container {
                    flex-direction: column;
                    height: auto;
                    overflow: visible;
                    gap: 10px;
                }
                .arb-cartel-preview .cartel-image-column {
                    flex: 0 0 auto;
                    height: auto;
                }
                .arb-cartel-preview .cartel-image-wrapper {
                    width: 100%;
                    height: 160px;
                    flex: 0 0 auto;
                }
                .arb-cartel-preview .cartel-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                }
                .arb-cartel-preview .cartel-no-image {
                    height: 100px;
                }
                .arb-cartel-preview .cartel-content-column {
                    flex: 1 1 auto;
                    width: 100%;
                }
                .arb-cartel-preview .cartel-card {
                    min-height: 0;
                }
            `}</style>
        </div>
    );
};

export default ArborescenceMode;
