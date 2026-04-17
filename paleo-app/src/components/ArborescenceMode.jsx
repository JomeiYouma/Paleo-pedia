import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import CartelPreview from './CartelPreview';
import { X } from 'lucide-react';

const ArborescenceMode = ({ cartels = [] }) => {
    const { isAdmin } = useApp();
    const svgRef = useRef(null);
    const { i18n } = useTranslation();
    const isEn = i18n.language === 'en';

    const [selectedNode, setSelectedNode] = useState(null);
    const [audioActive, setAudioActive] = useState(false);

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

    // ── Données du graphe ─────────────────────────────────────
    const graphData = useMemo(() => {
        const activeCats = new Set();
        const cartelNodes = [];
        const links = [];

        if (!Array.isArray(cartels)) return { nodes: [], links: [] };

        cartels.forEach(c => {
            if (!isAdmin && c.status !== 'published') return;
            const cats = isEn && c.categories_en ? c.categories_en : (c.categories || []);
            const node = { id: `cartel-${c.id}`, type: 'cartel', data: c, radius: 8, color: '#F48FB1' };
            cartelNodes.push(node);
            cats.forEach(cat => {
                activeCats.add(cat);
                links.push({ source: node.id, target: `cat-${cat}`, value: 1 });
            });
        });

        const categoryNodes = Array.from(activeCats).map(cat => ({
            id: `cat-${cat}`, type: 'category', name: cat, radius: 20, color: '#C2185B',
        }));

        return { nodes: [...categoryNodes, ...cartelNodes], links };
    }, [cartels, isEn, isAdmin]);

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
                    nodeSelRef.current.select('circle')
                        .attr('fill', d => {
                            const base   = d3.hsl(d.color);
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
                    const hue = (tt * 55) % 360;
                    linkSelRef.current
                        .attr('stroke', `hsl(${hue},${55 + vol * 45}%,${40 + vol * 30}%)`)
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
                        position: 'absolute', top: 14, left: 14, zIndex: 30,
                        width: 10, height: 10, borderRadius: '50%',
                        background: '#ff4081',
                        boxShadow: '0 0 8px 3px rgba(255,64,129,0.55)',
                        animation: 'audioPulse 0.9s ease-in-out infinite alternate',
                    }}
                />
            )}

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
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 400, background: 'white', boxShadow: '-2px 0 10px rgba(0,0,0,0.1)', zIndex: 20, overflowY: 'auto', padding: 20 }}>
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
            `}</style>
        </div>
    );
};

export default ArborescenceMode;
