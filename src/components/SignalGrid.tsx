import React from 'react';
import { Signal } from '../types';
import { ExternalLink, Hash, MapPin, Tag, Bell } from 'lucide-react';

export const SignalGrid: React.FC<{ signals: Signal[], watchlist?: string[], onEntityClick?: (entity: import('../types').Entity) => void }> = ({ signals, watchlist = [], onEntityClick }) => {
    
    const getLevelColors = (level: string) => {
        switch(level) {
            case "KRİTİK": return "text-red-400";
            case "YÜKSEK": return "text-orange-400";
            case "ORTA": return "text-blue-400";
            default: return "text-white/60";
        }
    };

    return (
        <div className="bg-[#080808] border border-white/5 rounded overflow-x-auto w-full">
            <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[#0c0c0c] border-b border-white/10 uppercase text-[9px] font-bold tracking-widest text-white/40">
                    <tr>
                        <th className="px-4 py-3">Seviye</th>
                        <th className="px-4 py-3">Tarih</th>
                        <th className="px-4 py-3 w-full">Başlık</th>
                        <th className="px-4 py-3">Kaynak</th>
                        <th className="px-4 py-3">Duygu</th>
                        <th className="px-4 py-3 text-right">Aksiyon</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/70">
                    {signals.map((sig, idx) => {
                        const isWatched = watchlist.some(kw => 
                            sig.title.toLowerCase().includes(kw.toLowerCase()) || 
                            (sig.content && sig.content.toLowerCase().includes(kw.toLowerCase()))
                        );
                        return (
                        <tr key={`${sig.id}-${idx}`} className={`transition-colors group ${isWatched ? 'bg-rose-500/10 hover:bg-rose-500/20' : 'hover:bg-white/[0.02]'}`}>
                            <td className="px-4 py-3 flex items-center gap-2">
                                {isWatched && <Bell className="w-3 h-3 text-rose-400 animate-pulse" />}
                                <span className={`text-[10px] font-bold uppercase ${getLevelColors(sig.level)}`}>
                                    {sig.level}
                                </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-[10px] text-white/40">
                                {new Date(sig.pubDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-4 py-3 font-medium text-white/90 truncate max-w-[300px] sm:max-w-md">
                                <a href={sig.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 flex items-center gap-1 group-hover:underline">
                                    {sig.title}
                                </a>
                            </td>
                            <td className="px-4 py-3 text-[10px] font-mono text-white/50 uppercase flex items-center gap-1 mt-0.5">
                                <Tag className="w-3 h-3" /> {sig.source}
                            </td>
                            <td className="px-4 py-3">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${sig.sentiment.color}`}>
                                    {sig.sentiment.label}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <a href={sig.link} target="_blank" rel="noopener noreferrer" className="inline-flex p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white/90 transition-colors">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </td>
                        </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
