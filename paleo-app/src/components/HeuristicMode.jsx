import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import CartelPreview from './CartelPreview';
import { X, Search, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

const HeuristicMode = ({ cartels = [] }) => {
    const { isAdmin } = useApp();
    const svgRef = useRef(null);
    const { t, i18n } = useTranslation();
    const isEn = i18n.language === 'en';

    // State for selected node
    const [selectedNode, setSelectedNode] = useState(null);

    // Prepare Graph Data
    // Nodes: Category nodes (big) + Cartel nodes (small)
    // Links: Cartel -> Category
    const graphData = useMemo(() => {
        // Collect active categories
        const activeCats = new Set();
        const cartelNodes = [];
        const links = [];

        if (!Array.isArray(cartels)) return { nodes: [], links: [] };

        cartels.forEach(c => {
            // Public mode: only published. Admin mode: show everything.
            if (!isAdmin && c.status !== 'published') return;

            const cats = isEn && c.categories_en ? c.categories_en : (c.categories || []);

            // Cartel Node
            const node = {
                id: `cartel-${c.id}`,
                type: 'cartel',
                data: c,
                radius: 8,
                color: '#F48FB1' // Light Rose
            };
            cartelNodes.push(node);

            // Links and Cats
            cats.forEach(cat => {
                const catId = `cat-${cat}`;
                activeCats.add(cat);
                links.push({
                    source: node.id,
                    target: catId,
                    value: 1
                });
            });
        });

        const categoryNodes = Array.from(activeCats).map(cat => ({
            id: `cat-${cat}`,
            type: 'category',
            name: cat,
            radius: 20, // Bigger
            color: '#C2185B' // Dark Rose
        }));

        return {
            nodes: [...categoryNodes, ...cartelNodes],
            links: links
        };
    }, [cartels, isEn, isAdmin]);

    // D3 Simulation
    useEffect(() => {
        if (!svgRef.current || graphData.nodes.length === 0) return;

        const width = svgRef.current.clientWidth || 800;
        const height = svgRef.current.clientHeight || 600;

        // Clear previous
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height]);

        // INJECT STYLE FORCED
        svg.append("style").text(`
            .heuristic-category-text { 
                fill: black !important; 
                stroke: none !important;
                font-family: sans-serif !important;
                font-weight: bold !important;
                pointer-events: none !important;
                opacity: 1 !important;
            }
            .heuristic-cartel-text { 
                fill: black !important; 
                stroke: white !important;
                stroke-width: 4px !important; 
                paint-order: stroke fill !important;
                stroke-linejoin: round !important;
                stroke-linecap: round !important;
                font-family: sans-serif !important;
                font-weight: bold !important;
                pointer-events: none !important;
                opacity: 0.6 !important;
            }
        `);

        // Shadows Filter
        const defs = svg.append("defs");
        const filter = defs.append("filter")
            .attr("id", "drop-shadow")
            .attr("height", "130%");
        filter.append("feGaussianBlur")
            .attr("in", "SourceAlpha")
            .attr("stdDeviation", 3)
            .attr("result", "blur");
        filter.append("feOffset")
            .attr("in", "blur")
            .attr("dx", 2)
            .attr("dy", 2)
            .attr("result", "offsetBlur");
        filter.append("feFlood")
            .attr("flood-color", "#000")
            .attr("flood-opacity", 0.2)
            .attr("result", "offsetColor");
        filter.append("feComposite")
            .attr("in", "offsetColor")
            .attr("in2", "offsetBlur")
            .attr("operator", "in")
            .attr("result", "offsetBlur");
        filter.append("feMerge")
            .selectAll("feMergeNode")
            .data(["offsetBlur", "SourceGraphic"])
            .enter().append("feMergeNode")
            .attr("in", d => d);

        // Zoom Group
        const g = svg.append("g");

        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => g.attr("transform", event.transform));

        svg.call(zoom);

        // Simulation
        const simulation = d3.forceSimulation(graphData.nodes)
            .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius(d => d.radius + 5));

        // Draw Links
        const link = g.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(graphData.links)
            .join("line")
            .attr("stroke-width", 1);

        // Draw Nodes
        const node = g.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("g") // Group for circle + label
            .data(graphData.nodes)
            .join("g")
            .call(drag(simulation));

        // Node Circle
        node.append("circle")
            .attr("r", d => d.radius)
            .attr("fill", d => d.color)
            .style("filter", "url(#drop-shadow)") // Apply shadow
            .attr("cursor", "pointer")
            .on("click", (event, d) => {
                if (d.type === 'cartel') {
                    setSelectedNode(d.data);
                    event.stopPropagation();
                }
            })
            // Hover Effects
            .on("mouseover", function (event, d) {
                // Expand Circle
                d3.select(this)
                    .transition().duration(200)
                    .attr("r", d.radius * 1.3)
                    .attr("stroke", "white")
                    .attr("stroke-width", 3);

                // Bring to front
                d3.select(this.parentNode).raise();

                // Unfold Text
                const fullTitle = d.type === 'category' ? d.name : (d.data.titre || 'Sans titre');
                const textNode = d3.select(this.parentNode).select("text");

                textNode.text(fullTitle.toUpperCase()); // Force Uppercase

                // If it's a cartel, we force opacity 1 on hover
                if (d.type === 'cartel') {
                    textNode.style("opacity", "1", "important");
                }
            })
            .on("mouseout", function (event, d) {
                // Reset Circle
                d3.select(this)
                    .transition().duration(200)
                    .attr("r", d.radius)
                    .attr("stroke", "none")
                    .attr("stroke-width", 0);

                // Reset Text
                const rawText = d.type === 'category' ? d.name : (d.data.titre || 'Sans titre');
                const truncated = rawText.substring(0, 15) + (rawText.length > 15 ? '...' : '');
                const textNode = d3.select(this.parentNode).select("text");

                textNode.text(truncated.toUpperCase()); // Force Uppercase

                // Revert opacity for cartels
                if (d.type === 'cartel') {
                    textNode.style("opacity", "0.6", "important");
                }
            });

        // Node Label
        const labels = node.append("text")
            .text(d => {
                const rawText = d.type === 'category' ? d.name : (d.data.titre || 'Sans titre');
                const truncated = rawText.substring(0, 15) + (rawText.length > 15 ? '...' : '');
                return truncated.toUpperCase(); // Force Uppercase
            })
            .attr("x", d => d.type === 'category' ? 25 : 12)
            .attr("y", 4)
            .attr("font-size", d => d.type === 'category' ? "13px" : "9px")
            .attr("class", d => d.type === 'category' ? "heuristic-category-text" : "heuristic-cartel-text"); // Conditional class


        // Update loop
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("transform", d => `translate(${d.x},${d.y})`);
        });

        // Clean up
        return () => simulation.stop();

    }, [graphData]); // Re-run when data changes

    // Drag Helper
    const drag = (simulation) => {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 150px)', position: 'relative', overflow: 'hidden', background: '#f9f9f9' }}>
            {/* Toolbar - Colors updated to Match */}
            <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ background: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9em' }}>
                        <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#C2185B' }}></span> Catégorie
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9em' }}>
                        <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#F48FB1' }}></span> Cartel
                    </div>
                </div>
            </div>

            <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>

            {/* Preview Modal */}
            {selectedNode && (
                <div style={{
                    position: 'absolute', top: 0, right: 0, bottom: 0, width: '400px',
                    background: 'white', boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
                    zIndex: 20, overflowY: 'auto', padding: '20px'
                }}>
                    <button onClick={() => setSelectedNode(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                    <CartelPreview data={selectedNode} />
                </div>
            )}
        </div>
    );
};

export default HeuristicMode;
