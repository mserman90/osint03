import React, { useState } from 'react';
import { Signal } from '../types';
import { ExternalLink, Hash, MapPin, Tag, ChevronDown, ChevronUp, AlignLeft, Bell, Mail, Network, ShieldAlert, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SignalCard: React.FC<{ signal: Signal, watchlist?: string[], onEntityClick?: (entity: import('../types').Entity) => void }> = ({ signal, watchlist = [], onEntityClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const isWatched = watchlist.some(kw => 
      signal.title.toLowerCase().includes(kw.toLowerCase()) || 
      (signal.content && signal.content.toLowerCase().includes(kw.toLowerCase()))
    );

    const getLevelColors = (level: string) => {
        switch(level) {
            case "KRİTİK": return "bg-red-500/10 border-l-2 border-red-500 text-red-300";
            case "YÜKSEK": return "bg-orange-500/10 border-l-2 border-orange-500 text-orange-300";
            case "ORTA": return "bg-blue-500/10 border-l-2 border-blue-500 text-blue-300";
            default: return "bg-white/5 border-l-2 border-white/20 text-white/50";
        }
    };

    return (
        <div className={`bg-[#0c0c0c] rounded border transition-colors relative group ${isWatched ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'border-white/5 hover:bg-white/5'}`}>
            <div className={`absolute top-0 left-0 bottom-0 w-1 ${getLevelColors(signal.level).split(' ')[1]}`} />
            
            <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex justify-between items-start mb-2 ml-2">
                    <div className="flex flex-wrap gap-2 items-center">
                        {isWatched && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider bg-rose-500/20 text-rose-400 border-rose-500/50 flex items-center gap-1 animate-pulse">
                                <Bell className="w-2.5 h-2.5" /> TAKİPTE
                            </span>
                        )}
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getLevelColors(signal.level)}`}>
                            {signal.level}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${signal.sentiment.color}`}>
                            {signal.sentiment.label}
                        </span>
                        <span className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${signal.reliability.color}`}>
                            {signal.reliability.label}
                        </span>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">
                        {new Date(signal.pubDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                <h4 className="text-xs font-semibold text-white/90 mt-2 mb-3 leading-snug ml-2">
                    <a href={signal.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="hover:text-blue-400 flex items-start gap-1 group-hover:underline">
                        {signal.title}
                        <ExternalLink className="w-3 h-3 inline mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </a>
                </h4>

                {(signal.entities.length > 0 || signal.places.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 ml-2 pt-3 border-t border-white/5">
                        {signal.entities.map((e, i) => {
                            let icon = <Hash className="w-2.5 h-2.5" />;
                            let colorCls = "bg-white/5 text-white/60 border-white/10";
                            if (e.type === 'IP') {
                                icon = <Network className="w-2.5 h-2.5" />;
                                colorCls = "bg-orange-500/10 text-orange-400 border-orange-500/20";
                            } else if (e.type === 'EMAIL') {
                                icon = <Mail className="w-2.5 h-2.5" />;
                                colorCls = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                            } else if (e.type === 'ONION_URL') {
                                icon = <ShieldAlert className="w-2.5 h-2.5" />;
                                colorCls = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                            } else if (e.type === 'DOMAIN') {
                                icon = <Globe className="w-2.5 h-2.5" />;
                                colorCls = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
                            }

                            return (
                                <button key={`ent-${i}`} 
                                    onClick={(event) => { event.stopPropagation(); onEntityClick && onEntityClick(e); }} 
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] border uppercase font-bold hover:brightness-125 transition-all cursor-pointer ${colorCls}`} 
                                    title={`${e.type} - İstihbarat Profili Görüntüle`}
                                >
                                    {icon}
                                    {e.name}
                                </button>
                            );
                        })}
                        {signal.places.map((p, i) => (
                            <span key={`pl-${i}`} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] border border-emerald-500/20 uppercase font-bold">
                                <MapPin className="w-2.5 h-2.5" />
                                {p.name}
                            </span>
                        ))}
                    </div>
                )}
                
                <div className="ml-2 mt-3 flex justify-between items-center text-[9px] text-white/30 uppercase tracking-wide font-mono">
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {signal.source}</span>
                    <div className="flex items-center gap-2">
                        <span>ID: {signal.id.replace(/[^A-Z0-9]/ig, '').substring(0, 8)}</span>
                        <div className="text-white/40 p-1 hover:bg-white/10 rounded transition">
                             {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 ml-2 border-t border-white/5 mt-1">
                             <div className="bg-[#050505] p-3 rounded mt-3 border border-white/5">
                                 <h5 className="text-[10px] uppercase font-bold text-white/40 mb-2 flex items-center gap-1.5">
                                    <AlignLeft className="w-3 h-3" />
                                    Ham İçerik / Özet
                                 </h5>
                                 <p className="text-xs text-white/70 leading-relaxed font-mono whitespace-pre-wrap break-words">
                                    {signal.content || "Ek içerik metni bulunmuyor veya parse edilemedi."}
                                 </p>
                             </div>
                             
                             <div className="mt-4 flex flex-col gap-2">
                                <h5 className="text-[10px] uppercase font-bold text-white/40">Duygu Analizi Kırılımı</h5>
                                <div className="flex items-center gap-2">
                                     <div className={`h-2 flex-grow rounded overflow-hidden flex bg-white/5`}>
                                         <div className="h-full bg-red-500/50" style={{width: signal.sentiment.label === 'PANİK' ? '80%' : signal.sentiment.label === 'NEGATİF' ? '60%' : '10%'}}></div>
                                         <div className="h-full bg-blue-500/50" style={{width: signal.sentiment.label === 'NÖTR' ? '50%' : '10%'}}></div>
                                         <div className="h-full bg-green-500/50" style={{width: signal.sentiment.label === 'POZİTİF' ? '60%' : '10%'}}></div>
                                     </div>
                                     <span className="text-[10px] font-mono text-white/50 w-12 text-right">
                                         {signal.sentiment.label === 'PANİK' ? '80%' : signal.sentiment.label === 'NEGATİF' ? '60%' : signal.sentiment.label === 'NÖTR' ? '50%' : '80%'}
                                     </span>
                                </div>
                             </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
