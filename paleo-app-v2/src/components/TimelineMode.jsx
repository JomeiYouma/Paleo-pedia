import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { getYearForSort, formatYear } from '../utils/helpers';
import { ChevronLeft, ChevronRight, Edit, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CartelDetail from './CartelDetail';
import './TimelineMode.css';

/**
 * TimelineMode — Frise chronologique interactive D3.
 * Portage depuis paleo-app v1, adapté v2 (sans i18n, sans AppContext).
 *
 * Props :
 *   cartels  {Array}    — liste de cartels à afficher
 *   isAdmin  {boolean}  — affiche les actions d'édition/suppression
 *   onDelete {Function} — callback(cartelId) pour supprimer
 *   targetId {string}   — sélectionne un cartel par son id au montage
 */
const TimelineMode = ({ cartels = [], isAdmin = false, onDelete, targetId }) => {
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const zoomTransformRef = useRef(d3.zoomIdentity);
  const [selectedIndex, setSelectedIndex] = useState(0);

  /* ── Calcul des positions avec stacking des années identiques ── */
  const validCartels = useMemo(() => {
    const sorted = cartels
      .map((c, idx) => ({ ...c, originalIndex: idx, year: getYearForSort(c) }))
      .filter(c => c.year !== null && c.year !== 9999)
      .sort((a, b) => a.year - b.year);

    const stacked = [];
    const stackMap = new Map();
    sorted.forEach(c => {
      const year = c.year;
      const level = stackMap.get(year) || 0;
      stackMap.set(year, level + 1);
      let yOffset = 0;
      if (level > 0) {
        const sign = level % 2 === 0 ? 1 : -1;
        const power = Math.ceil(level / 2);
        yOffset = sign * power * 9;
      }
      stacked.push({ ...c, yOffset });
    });
    return stacked;
  }, [cartels]);

  /* ── Sync targetId → sélection ── */
  useEffect(() => {
    if (targetId && validCartels.length > 0) {
      const idx = validCartels.findIndex(c => c.id === targetId);
      if (idx !== -1) setSelectedIndex(idx);
    }
  }, [targetId, validCartels]);

  /* ── Init D3 (axe, cercles, zoom) ── */
  useEffect(() => {
    if (!validCartels.length || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 180;
    const margin = { top: 24, right: 48, bottom: 36, left: 48 };

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    const minYear = d3.min(validCartels, d => d.year);
    const maxYear = d3.max(validCartels, d => d.year);
    const padding = (maxYear - minYear) * 0.06 || 50;

    const x = d3.scaleLinear()
      .domain([minYear - padding, maxYear + padding])
      .range([margin.left, width - margin.right]);

    const g = svg.append('g');

    /* Axe */
    const gX = g.append('g')
      .attr('class', 'timeline-axis')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(Math.floor(width / 90)).tickFormat(d => d));

    /* Ligne centrale */
    g.append('line')
      .attr('x1', margin.left).attr('x2', width - margin.right)
      .attr('y1', height / 2).attr('y2', height / 2)
      .attr('stroke', 'var(--color-border-light)')
      .attr('stroke-width', 1);

    /* Marqueurs */
    g.selectAll('.timeline-marker')
      .data(validCartels)
      .join('circle')
      .attr('class', 'timeline-marker')
      .attr('cx', d => x(d.year))
      .attr('cy', d => (height / 2) + d.yOffset)
      .attr('r', 7)
      .attr('fill', 'var(--color-border-light)')
      .attr('stroke', 'none')
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        const idx = validCartels.findIndex(c => c.id === d.id);
        setSelectedIndex(idx);
        event.stopPropagation();
      })
      .on('mouseover', function (event, d) {
        d3.select(this).attr('r', 9);
        g.selectAll('.tl-hover-label').remove();
        g.append('text')
          .attr('class', 'tl-hover-label')
          .attr('x', d3.select(this).attr('cx'))
          .attr('y', parseFloat(d3.select(this).attr('cy')) - 14)
          .attr('text-anchor', 'middle')
          .text(d.titre)
          .style('font-size', '10px')
          .style('font-weight', '600')
          .style('fill', 'var(--color-text)')
          .style('paint-order', 'stroke fill')
          .style('stroke', 'var(--color-bg)')
          .style('stroke-width', '3px')
          .style('pointer-events', 'none');
      })
      .on('mouseout', function (event, d) {
        const isSelected = d3.select(this).classed('tl-active');
        if (!isSelected) d3.select(this).attr('r', 7);
        g.selectAll('.tl-hover-label').remove();
      });

    /* Anneau de sélection */
    g.append('circle')
      .attr('class', 'tl-selection-ring')
      .attr('r', 14)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-accent)')
      .attr('stroke-width', 2)
      .attr('opacity', 0);

    /* Zoom */
    const zoom = d3.zoom()
      .scaleExtent([1, 60])
      .translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]])
      .on('zoom', (event) => {
        zoomTransformRef.current = event.transform;
        const xz = event.transform.rescaleX(x);
        gX.call(d3.axisBottom(xz).ticks(Math.floor(width / 90)).tickFormat(d => d));
        g.selectAll('.timeline-marker').attr('cx', d => xz(d.year));
        const active = g.select('.tl-active');
        if (!active.empty()) {
          const dat = active.datum();
          g.select('.tl-selection-ring')
            .attr('cx', xz(dat.year))
            .attr('cy', (height / 2) + dat.yOffset);
        }
      });

    svg.call(zoom);
    svg.call(zoom.transform, zoomTransformRef.current);

    /* Stocker pour l'effet de sélection */
    svgRef.current.__zoom_behavior__ = zoom;
    svgRef.current.__x_scale__ = x;
    svgRef.current.__height__ = height;
  }, [validCartels]);

  /* ── Mise à jour sélection (sans reset du zoom) ── */
  useEffect(() => {
    if (!validCartels.length || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select('g');
    const height = svgRef.current.__height__ || 180;
    const x = svgRef.current.__x_scale__;
    if (!x) return;
    const xz = zoomTransformRef.current.rescaleX(x);

    g.selectAll('.timeline-marker')
      .attr('fill', (d, i) => i === selectedIndex ? 'var(--color-accent)' : 'var(--color-border-light)')
      .attr('r', (d, i) => i === selectedIndex ? 9 : 7)
      .attr('stroke', (d, i) => i === selectedIndex ? 'rgba(45,158,107,0.3)' : 'none')
      .attr('stroke-width', 6)
      .classed('tl-active', (d, i) => i === selectedIndex);

    const sel = validCartels[selectedIndex];
    if (sel) {
      g.select('.tl-selection-ring')
        .attr('opacity', 1)
        .attr('cx', xz(sel.year))
        .attr('cy', (height / 2) + sel.yOffset)
        .raise();
    }
  }, [validCartels, selectedIndex]);

  /* ── Navigation clavier ── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') setSelectedIndex(p => Math.max(0, p - 1));
      if (e.key === 'ArrowRight') setSelectedIndex(p => Math.min(validCartels.length - 1, p + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [validCartels.length]);

  if (!validCartels.length) {
    return (
      <div className="loading-center">
        <p>Aucun cartel avec une date valide à afficher.</p>
      </div>
    );
  }

  const currentCartel = validCartels[selectedIndex];

  return (
    <div className="timeline-wrapper">
      {/* ── Zone cartel ── */}
      <div className="timeline-content">
        {/* Bouton Précédent */}
        <button
          className="timeline-nav-btn timeline-nav-prev"
          onClick={() => setSelectedIndex(p => Math.max(0, p - 1))}
          disabled={selectedIndex === 0}
          aria-label="Cartel précédent"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Cartel affiché */}
        {currentCartel && (
          <div className="timeline-cartel-area">
            <CartelDetail cartel={currentCartel} />

            {/* Actions admin */}
            {isAdmin && (
              <div className="timeline-admin-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/create?edit=${currentCartel.id}`)}
                  title="Modifier"
                >
                  <Edit size={14} /> Modifier
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    if (confirm(`Supprimer "${currentCartel.titre}" ?`)) {
                      onDelete?.(currentCartel.id);
                      setSelectedIndex(p => Math.max(0, p - 1));
                    }
                  }}
                  title="Supprimer"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bouton Suivant */}
        <button
          className="timeline-nav-btn timeline-nav-next"
          onClick={() => setSelectedIndex(p => Math.min(validCartels.length - 1, p + 1))}
          disabled={selectedIndex === validCartels.length - 1}
          aria-label="Cartel suivant"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* ── Axe D3 (navigateur temporel) ── */}
      <div className="timeline-axis-container" ref={containerRef}>
        <div className="timeline-axis-hint">
          <kbd>←</kbd> <kbd>→</kbd> naviguer &nbsp;·&nbsp; molette pour zoomer
        </div>
        <div className="timeline-counter">
          {selectedIndex + 1} / {validCartels.length}
        </div>
        <svg ref={svgRef} className="timeline-svg" />
      </div>
    </div>
  );
};

export default TimelineMode;
