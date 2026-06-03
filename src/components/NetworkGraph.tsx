import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GitBranch, Maximize2 } from 'lucide-react';
import { Signal } from '../types';

interface NetworkGraphProps {
  signals: Signal[];
  mode: string;
  onEntityClick?: (entity: import('../types').Entity) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ signals, mode, onEntityClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current || signals.length === 0) return;

    const { width, height } = wrapperRef.current.getBoundingClientRect();
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Prepare node and link data
    const nodesMap = new Map<string, any>();
    const links: any[] = [];

    // Add root node
    nodesMap.set('ROOT', { id: 'ROOT', group: 'root', name: mode, radius: 12 });

    signals.forEach(signal => {
        const sigId = `sig-${signal.id}`;
        if (!nodesMap.has(sigId)) {
            nodesMap.set(sigId, { 
                id: sigId, 
                group: 'signal', 
                name: signal.title.substring(0, 15) + '...', 
                level: signal.level,
                radius: 6 
            });
            links.push({ source: 'ROOT', target: sigId, value: 1 });
        }

        signal.entities.forEach(entity => {
            const entId = `ent-${entity.type}-${entity.name}`;
            if (!nodesMap.has(entId)) {
                nodesMap.set(entId, { 
                    id: entId, 
                    group: 'entity', 
                    type: entity.type, 
                    name: entity.name,
                    radius: entity.type === 'IP' ? 8 : 5
                });
            }
            // Link signal to entity
            links.push({ source: sigId, target: entId, value: 1 });
        });
    });

    const nodes = Array.from(nodesMap.values());

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(40))
        .force("charge", d3.forceManyBody().strength(-80))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius((d: any) => d.radius + 10).iterations(2));

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    // Draw links
    const link = g.append("g")
        .attr("stroke", "rgba(255, 255, 255, 0.1)")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

    // Colors
    const getColor = (node: any) => {
        if(node.group === 'root') return '#a855f7'; // purple 500
        if(node.group === 'signal') {
            switch(node.level) {
                case 'KRİTİK': return '#ef4444';
                case 'YÜKSEK': return '#f97316';
                case 'ORTA': return '#3b82f6';
                default: return '#ffffff';
            }
        }
        if(node.group === 'entity') {
            if(node.type === 'IP') return '#f97316'; // orange
            if(node.type === 'EMAIL') return '#3b82f6'; // blue
            if(node.type === 'ONION_URL') return '#a855f7'; // purple
            return '#64748b'; // slate
        }
        return '#fff';
    };

    // Draw nodes
    const node = g.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(d3.drag<any, any>()
            .on("start", (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x; d.fy = d.y;
            })
            .on("drag", (event, d) => {
                d.fx = event.x; d.fy = event.y;
            })
            .on("end", (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null; d.fy = null;
            }));

    node.append("circle")
        .attr("r", d => d.radius)
        .attr("fill", d => getColor(d))
        .attr("stroke", "#000")
        .attr("stroke-width", 1.5)
        .style("cursor", d => d.group === 'entity' ? 'pointer' : 'default')
        .on("click", (event, d) => {
             if (d.group === 'entity' && onEntityClick) {
                 onEntityClick({ name: d.name, type: d.type, riskLevel: 'BİLİNMİYOR' });
             }
        });

    // Text labels for important nodes
    node.filter(d => d.group === 'entity' || d.group === 'root')
        .append("text")
        .attr("x", 8)
        .attr("y", "0.31em")
        .text(d => d.name)
        .style("font-size", "7px")
        .style("font-family", "monospace")
        .style("fill", "rgba(255,255,255,0.7)")
        .style("pointer-events", "none")
        .clone(true).lower()
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

    simulation.on("tick", () => {
        link
            .attr("x1", d => (d.source as any).x)
            .attr("y1", d => (d.source as any).y)
            .attr("x2", d => (d.target as any).x)
            .attr("y2", d => (d.target as any).y);

        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    });

  }, [signals, mode]);

  return (
    <div className="bg-[#080808] p-5 rounded border border-white/5 flex flex-col h-[400px]">
        <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-500" /> İlişkisel Ağ Haritası
            </h3>
            <button className="text-white/40 hover:text-white/80 p-1" title="Tam Ekran">
                <Maximize2 className="w-3.5 h-3.5" />
            </button>
        </div>
        
        {signals.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white/30 text-xs gap-3">
                <GitBranch className="w-8 h-8 opacity-20" />
                Düğüm (Node) oluşturulacak sinyal bulunamadı.
            </div>
        ) : (
            <div ref={wrapperRef} className="flex-1 w-full bg-[#050505] rounded border border-white/5 overflow-hidden relative cursor-move">
                <svg ref={svgRef} className="w-full h-full"></svg>
                <div className="absolute bottom-2 right-2 flex flex-col gap-1 text-[8px] font-mono text-white/40 uppercase bg-black/60 p-2 rounded backdrop-blur">
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Merkez</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Hedef IP</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> E-Posta</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Kritik Sinyal</div>
                </div>
            </div>
        )}
    </div>
  );
};
