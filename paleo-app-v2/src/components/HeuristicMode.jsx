import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { X } from 'lucide-react';
import CartelDetail from './CartelDetail';
import './HeuristicMode.css';

/**
 * HeuristicMode — Graphe force-directed D3.
 * Visualise les liens cartel ↔ catégorie.
 *
 * Props :
 *   cartels  {Array}   — liste de cartels publiés
 *   isAdmin  {boolean}
 */
const HeuristicMode = ({ cartels = [], isAdmin = false }) => {
  const svgRef = useRef(null);
  const [selectedCartel, setSelectedCartel] = useState(null);

  /* ── Construction du graphe ── */
  const graphData = useMemo(() => {
    const activeCats = new Map();  // id → name, color
    const cartelNodes = [];
    const links = [];

    cartels.forEach(c => {
      const cats = c.categories || [];

      cartelNodes.push({
        id: `cartel-${c.id}`,
        type: 'cartel',
        data: c,
        radius: 8,
        color: 'var(--color-border-light)',
        label: c.titre || 'Sans titre',
      });

      cats.forEach(cat => {
        if (!activeCats.has(cat.id)) {
          activeCats.set(cat.id, { name: cat.name, color: cat.color || 'var(--color-accent)' });
        }
        links.push({ source: `cartel-${c.id}`, target: `cat-${cat.id}` });
      });
    });

    const categoryNodes = Array.from(activeCats.entries()).map(([id, meta]) => ({
      id: `cat-${id}`,
      type: 'category',
      label: meta.name,
      color: meta.color,
      radius: 22,
    }));

    return { nodes: [...categoryNodes, ...cartelNodes], links };
  }, [cartels]);

  /* ── Simulation D3 ── */
  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const el = svgRef.current;
    const width = el.clientWidth || 900;
    const height = el.clientHeight || 600;

    d3.select(el).selectAll('*').remove();

    const svg = d3.select(el).attr('viewBox', [0, 0, width, height]);

    /* Filtre ombre */
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'heuristic-shadow');
    filter.append('feGaussianBlur').attr('in', 'SourceAlpha').attr('stdDeviation', 2).attr('result', 'blur');
    filter.append('feOffset').attr('in', 'blur').attr('dx', 1).attr('dy', 2).attr('result', 'offsetBlur');
    filter.append('feMerge').selectAll('feMergeNode')
      .data(['offsetBlur', 'SourceGraphic']).enter()
      .append('feMergeNode').attr('in', d => d);

    const g = svg.append('g');

    /* Zoom */
    svg.call(d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', event => g.attr('transform', event.transform)));

    /* Simulation */
    const sim = d3.forceSimulation(graphData.nodes)
      .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(d =>
        d.source.type === 'category' || d.target.type === 'category' ? 80 : 40
      ))
      .force('charge', d3.forceManyBody().strength(d => d.type === 'category' ? -600 : -180))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(d => d.radius + 8));

    /* Liens */
    const link = g.append('g')
      .selectAll('line')
      .data(graphData.links)
      .join('line')
      .attr('stroke', 'var(--color-border)')
      .attr('stroke-width', 1.2)
      .attr('stroke-opacity', 0.6);

    /* Noeuds */
    const node = g.append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .join('g')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

    /* Cercles */
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.type === 'category' ? d.color : 'var(--color-surface-3)')
      .attr('stroke', d => d.type === 'category' ? 'rgba(255,255,255,0.15)' : 'var(--color-border-light)')
      .attr('stroke-width', d => d.type === 'category' ? 2 : 1)
      .style('filter', 'url(#heuristic-shadow)')
      .attr('cursor', 'pointer')
      .on('click', (e, d) => {
        if (d.type === 'cartel') { setSelectedCartel(d.data); e.stopPropagation(); }
      })
      .on('mouseover', function (e, d) {
        d3.select(this).transition().duration(150)
          .attr('r', d.radius * 1.35)
          .attr('stroke', d.type === 'category' ? 'white' : 'var(--color-accent)')
          .attr('stroke-width', 2.5);
      })
      .on('mouseout', function (e, d) {
        d3.select(this).transition().duration(150)
          .attr('r', d.radius)
          .attr('stroke', d.type === 'category' ? 'rgba(255,255,255,0.15)' : 'var(--color-border-light)')
          .attr('stroke-width', d.type === 'category' ? 2 : 1);
      });

    /* Labels */
    node.append('text')
      .text(d => {
        const t = d.label;
        return d.type === 'category' ? t : (t.length > 16 ? t.slice(0, 14) + '…' : t);
      })
      .attr('x', d => d.type === 'category' ? d.radius + 8 : d.radius + 5)
      .attr('y', 4)
      .attr('font-size', d => d.type === 'category' ? '11px' : '8px')
      .attr('font-weight', d => d.type === 'category' ? '700' : '500')
      .attr('fill', d => d.type === 'category' ? d.color : 'var(--color-text-muted)')
      .attr('pointer-events', 'none');

    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    /* Cliquer ailleurs ferme le panel */
    svg.on('click', () => setSelectedCartel(null));

    return () => sim.stop();
  }, [graphData]);

  return (
    <div className="heuristic-wrapper">
      {/* Légende */}
      <div className="heuristic-legend">
        <div className="heuristic-legend-item">
          <span className="heuristic-legend-dot cat" />
          Catégorie
        </div>
        <div className="heuristic-legend-item">
          <span className="heuristic-legend-dot cartel" />
          Cartel (cliquer pour détail)
        </div>
        <div className="heuristic-legend-hint">Molette pour zoomer · Drag pour déplacer</div>
      </div>

      <svg ref={svgRef} className="heuristic-svg" />

      {/* Panel de détail */}
      {selectedCartel && (
        <div className="heuristic-detail-panel">
          <button
            className="btn btn-ghost btn-sm heuristic-close"
            onClick={() => setSelectedCartel(null)}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
          <CartelDetail cartel={selectedCartel} compact />
        </div>
      )}
    </div>
  );
};

export default HeuristicMode;
