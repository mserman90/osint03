import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Signal } from '../types';
import { Gauge } from 'lucide-react';

interface GlobalIntelligenceIndexProps {
  signals: Signal[];
}

export const GlobalIntelligenceIndex: React.FC<GlobalIntelligenceIndexProps> = ({ signals }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const score = useMemo(() => {
     if (!signals || signals.length === 0) return 0;
     let total = 0;
     signals.forEach(s => {
         if (s.level === 'KRİTİK') total += 10;
         else if (s.level === 'YÜKSEK') total += 5;
         else if (s.level === 'ORTA') total += 2;
     });
     
     const avg = total / signals.length;
     // Map 0-10 to 0-100
     const index = Math.min(100, Math.max(0, avg * 10));
     
     // Add a factor of total count (more signals = higher volume = slightly higher threat)
     const volumeBonus = Math.min(30, signals.length * 0.8);
     
     return Math.min(100, Math.round(index + volumeBonus));
  }, [signals]);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 250;
    const height = 150;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const radius = Math.min(width, height * 2) / 2 - margin.top;

    const svg = d3.select(svgRef.current)
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .html('');

    const g = svg.append('g')
        .attr('transform', `translate(${width / 2}, ${height - margin.bottom})`);

    // Define colors for the arc
    const colorScale = d3.scaleLinear<number, string>()
        .domain([0, 40, 70, 90, 100])
        .range(["#3b82f6", "#10b981", "#eab308", "#f97316", "#ef4444"]);

    const arc = d3.arc<any, any>()
        .innerRadius(radius - 15)
        .outerRadius(radius)
        .startAngle(-Math.PI / 2)
        .cornerRadius(4);

    // Background arc
    g.append('path')
        .datum({ endAngle: Math.PI / 2 })
        .style('fill', 'rgba(255,255,255,0.05)')
        .attr('d', arc);

    // Foreground arc
    const angle = (score / 100) * Math.PI - Math.PI / 2;
    
    g.append('path')
        .datum({ endAngle: angle })
        .style('fill', colorScale(score))
        .attr('d', arc)
        .transition()
        .duration(1000)
        .attrTween('d', function(d) {
            const interpolate = d3.interpolate({ endAngle: -Math.PI / 2 }, d);
            return function(t) {
                return arc(interpolate(t)) as string;
            };
        });

    // Score text
    g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -10)
        .style('fill', colorScale(score))
        .style('font-size', '42px')
        .style('font-weight', 'bold')
        .style('font-family', 'monospace')
        .text(0)
        .transition()
        .duration(1000)
        .tween("text", function() {
            const i = d3.interpolateRound(0, score);
            const node = this;
            return function(t) {
                node.textContent = i(t).toString();
            };
        });

    g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 15)
        .style('fill', 'rgba(255,255,255,0.4)')
        .style('font-size', '10px')
        .style('text-transform', 'uppercase')
        .style('font-weight', 'bold')
        .style('letter-spacing', '1px')
        .text('TEHDİT SKORU');

    // Add tick marks
    const ticks = [0, 25, 50, 75, 100];
    const tickArc = d3.arc<any, any>()
        .innerRadius(radius + 5)
        .outerRadius(radius + 8)
        .startAngle(d => (d / 100) * Math.PI - Math.PI / 2 - 0.02)
        .endAngle(d => (d / 100) * Math.PI - Math.PI / 2 + 0.02);

    g.selectAll(".tick")
        .data(ticks)
        .enter()
        .append("path")
        .attr("class", "tick")
        .style("fill", "rgba(255,255,255,0.2)")
        .attr("d", tickArc as any);

  }, [score]);

  return (
      <div className="bg-[#080808] p-5 rounded border border-white/5">
          <h3 className="text-xs font-bold text-white/40 uppercase mb-4 tracking-widest flex items-center gap-2">
              <Gauge className="w-4 h-4 text-purple-500" /> Global Intelligence Index
          </h3>
          <div className="flex flex-col items-center justify-center">
             <div className="w-full h-[150px] relative mt-2">
                 <svg ref={svgRef}></svg>
             </div>
             <p className="text-[10px] text-white/30 text-center mt-2 max-w-[200px] font-mono leading-relaxed">
                 Son sinyal hacmi ve kritiklik seviyelerine göre hesaplanan kümülatif tehdit skoru.
             </p>
          </div>
      </div>
  );
};
