import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Signal } from '../types';
import { Map as MapIcon, Layers } from 'lucide-react';

interface SignalMapProps {
  signals: Signal[];
}

export const SignalMap: React.FC<SignalMapProps> = ({ signals }) => {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;

    const { width, height } = wrapperRef.current.getBoundingClientRect();
    const svg = d3.select(svgRef.current);
    
    // Clear previous
    svg.selectAll("*").remove();

    // Map and projection focused on Turkey/Middle East
    const projection = d3.geoMercator()
        .center([35, 39])
        .scale(width * 1.5)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Create a group for zoom/pan
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Draw Graticule
    const graticule = d3.geoGraticule();
    g.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path as any)
      .style("fill", "none")
      .style("stroke", "rgba(255, 255, 255, 0.05)")
      .style("stroke-width", "1px");

    // Load base map (world.geojson)
    fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
      .then(res => res.json())
      .then(data => {
        // Draw map
        g.selectAll("path.country")
          .data(data.features)
          .enter()
          .append("path")
          .attr("class", "country")
          .attr("d", path as any)
          .style("fill", "rgba(255, 255, 255, 0.02)")
          .style("stroke", "rgba(255, 255, 255, 0.1)")
          .style("stroke-width", "0.5px");

        // Extract points from signals
        const places: { lat: number, lon: number, name: string, level: string, title?: string, x?: number, y?: number }[] = [];
        signals.forEach(signal => {
           signal.places.forEach(place => {
               // Add a slight jitter if points overlap later or just plot them
               const [x, y] = projection([place.lon, place.lat]) || [0, 0];
               places.push({ ...place, level: signal.level, title: signal.title, x, y });
           });
        });

        if (showHeatmap && places.length > 0) {
            try {
               const contour = d3.contourDensity<{x: number, y: number, name: string}>()
                   .x(d => d.x)
                   .y(d => d.y)
                   .size([width, height])
                   .bandwidth(15)
                   .thresholds(8);
                   
               const contours = contour(places as any);
               
               const color = d3.scaleSequential(d3.interpolateInferno)
                     .domain([0, d3.max(contours, d => d.value) || 0]);
    
               g.append("g")
                 .attr("class", "heatmap-layer")
                 .selectAll("path")
                 .data(contours)
                 .enter().append("path")
                 .attr("d", d3.geoPath() as any)
                 .style("fill", d => color(d.value))
                 .style("opacity", 0.3)
                 .style("pointer-events", "none");
            } catch (e) {
                console.error("Heatmap rendering error:", e);
            }
        }

        // Add animated pulse for criticals
        const criticals = places.filter(p => p.level === "KRİTİK" || p.level === "YÜKSEK");
        
        function pulse() {
            g.selectAll("circle.pulse")
               .data(criticals)
               .enter()
               .append("circle")
               .attr("class", "pulse")
               .attr("cx", d => projection([d.lon, d.lat])?.[0] || 0)
               .attr("cy", d => projection([d.lon, d.lat])?.[1] || 0)
               .attr("r", 4)
               .style("fill", "none")
               .style("stroke", d => d.level === "KRİTİK" ? "#ef4444" : "#f97316")
               .style("stroke-width", 2)
               .style("opacity", 1)
               .transition()
               .duration(2000)
               .attr("r", 25)
               .style("opacity", 0)
               .remove()
               .on("end", pulse);
        }
        
        if(criticals.length > 0) {
            pulse();
        }

        // Add circles
        const circles = g.selectAll("circle.point")
           .data(places)
           .enter()
           .append("circle")
           .attr("class", "point")
           .attr("cx", d => projection([d.lon, d.lat])?.[0] || 0)
           .attr("cy", d => projection([d.lon, d.lat])?.[1] || 0)
           .attr("r", 4)
           .style("fill", d => {
               switch(d.level) {
                   case "KRİTİK": return "#ef4444";
                   case "YÜKSEK": return "#f97316";
                   case "ORTA": return "#3b82f6";
                   default: return "#ffffff";
               }
           })
           .style("stroke", "rgba(0,0,0,0.5)")
           .style("stroke-width", 1)
           .style("opacity", 0.9)
           .on("mouseover", function(event, d) {
               d3.select(this).style("stroke", "#ffffff").style("stroke-width", 2);
               const tooltip = d3.select(tooltipRef.current);
               tooltip.html(`
                 <div class="font-bold text-[10px] text-white mb-1 tracking-wider uppercase">${d.name} <span class="text-white/40 ml-1 font-mono">(${d.level})</span></div>
                 <div class="text-[9px] text-white/70 leading-tight">${d.title || ''}</div>
               `);
               tooltip.style("opacity", 1);
           })
           .on("mousemove", function(event) {
               const tooltip = d3.select(tooltipRef.current);
               const bounds = wrapperRef.current?.getBoundingClientRect();
               if(bounds) {
                  // Ensure tooltip stays within relative div
                  let x = event.clientX - bounds.left + 15;
                  let y = event.clientY - bounds.top - 15;
                  tooltip.style("left", x + "px").style("top", y + "px");
               }
           })
           .on("mouseout", function() {
               d3.select(this).style("stroke", "rgba(0,0,0,0.5)").style("stroke-width", 1);
               d3.select(tooltipRef.current).style("opacity", 0);
           });
           
        // Add text labels
        g.selectAll("text.label")
          .data(places)
          .enter()
          .append("text")
          .attr("class", "label")
          .attr("x", d => (projection([d.lon, d.lat])?.[0] || 0) + 6)
          .attr("y", d => (projection([d.lon, d.lat])?.[1] || 0) + 3)
          .text(d => d.name)
          .style("font-size", "8px")
          .style("font-family", "monospace")
          .style("fill", "rgba(255,255,255,0.7)")
          .style("pointer-events", "none");

      });

  }, [signals, showHeatmap]);

  return (
    <div className="bg-[#080808] p-5 rounded border border-white/5 mb-6">
       <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-white/60">
             <MapIcon className="w-4 h-4 text-blue-500" /> Coğrafi Sinyal Haritası
          </h3>
          <button 
             onClick={() => setShowHeatmap(!showHeatmap)}
             className={`flex items-center gap-1 px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded border transition-colors ${showHeatmap ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}
          >
             <Layers className="w-3 h-3" /> Heatmap
          </button>
       </div>
       <div ref={wrapperRef} className="h-[300px] w-full bg-[#050505] rounded border border-white/5 overflow-hidden relative cursor-crosshair">
           <svg ref={svgRef} className="w-full h-full"></svg>
           <div ref={tooltipRef} className="absolute pointer-events-none opacity-0 bg-[#080808] border border-white/10 p-2 rounded shadow-lg z-50 max-w-[200px] transition-opacity duration-200"></div>
           <div className="absolute bottom-2 left-2 flex gap-3 text-[9px] font-mono uppercase bg-black/50 p-2 rounded backdrop-blur-sm border border-white/5">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> KRİTİK</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> YÜKSEK</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> ORTA</div>
           </div>
       </div>
    </div>
  );
};
