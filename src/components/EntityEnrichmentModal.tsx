import React, { useState, useEffect } from 'react';
import { Entity } from '../types';
import { X, Network, Mail, ShieldAlert, Hash, Loader2, MapPin, Search, Globe, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

export const EntityEnrichmentModal: React.FC<{ entity: Entity | null, onClose: () => void }> = ({ entity, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [intelData, setIntelData] = useState<any>(null);

    useEffect(() => {
        if (!entity) return;
        setLoading(true);
        setIntelData(null);
        
        const fetchIntel = async () => {
            try {
                 const req = await fetch("/api/enrich-entity", {
                     method: "POST",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({ type: entity.type, name: entity.name })
                 });
                 if (req.ok) {
                     const aiData = await req.json();
                     setIntelData(aiData);
                 } else {
                     setIntelData({ status: "API Çağrısı Başarısız", tags: ["Hata"] });
                 }
            } catch (err) {
                 setIntelData({ status: "Bağlantı Hatası", tags: ["Hata"] });
            } finally {
                 setLoading(false);
            }
        };

        fetchIntel();
    }, [entity]);

    if (!entity) return null;

    let icon = <Hash className="w-5 h-5 text-white/60" />;
    let headerColor = "bg-white/5 border-white/10";
    if (entity.type === 'IP') {
        icon = <Network className="w-5 h-5 text-orange-400" />;
        headerColor = "bg-orange-500/10 border-orange-500/30";
    } else if (entity.type === 'EMAIL') {
        icon = <Mail className="w-5 h-5 text-blue-400" />;
        headerColor = "bg-blue-500/10 border-blue-500/30";
    } else if (entity.type === 'ONION_URL') {
        icon = <ShieldAlert className="w-5 h-5 text-purple-400" />;
        headerColor = "bg-purple-500/10 border-purple-500/30";
    } else if (entity.type === 'DOMAIN') {
        icon = <Globe className="w-5 h-5 text-cyan-400" />;
        headerColor = "bg-cyan-500/10 border-cyan-500/30";
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-[#000]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#0c0c0c] border border-white/10 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
                >
                    <div className={`p-4 border-b flex justify-between items-center ${headerColor}`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#000]/40 rounded border border-white/5">
                                {icon}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white/90 uppercase tracking-widest">{entity.type} Analizi</h3>
                                <div className="text-xs font-mono text-white/60 mt-0.5">{entity.name}</div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4 bg-[#050505] flex-1">
                        {loading ? (
                            <div className="flex justify-center items-center py-12 flex-col gap-3">
                                <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                                <div className="text-[10px] text-white/40 font-mono tracking-widest uppercase animate-pulse">Açık Kaynaklar Taranıyor...</div>
                                <div className="text-[9px] text-[#00ffcc]/50 font-mono italic">[{entity.name} profili oluşturuluyor]</div>
                            </div>
                        ) : intelData ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                
                                {entity.type === 'IP' && intelData.location && (
                                    <div className="p-3 bg-[#0a0a0a] border border-white/5 rounded grid grid-cols-2 gap-3">
                                        <div>
                                            <div className="text-[9px] text-white/40 uppercase font-bold mb-1">Lokasyon</div>
                                            <div className="text-[11px] text-white/80 font-mono flex items-start gap-1">
                                                <MapPin className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                                                <span>{intelData.location}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] text-white/40 uppercase font-bold mb-1">ISP / Org</div>
                                            <div className="text-[11px] text-white/80 font-mono">{intelData.isp || 'Bilinmiyor'}</div>
                                            
                                            <div className="text-[9px] text-white/40 uppercase font-bold mb-1 mt-2">İtibar (Reputation)</div>
                                            <div className="text-[11px] text-white/80 font-mono">{intelData.reputation || 'N/A'}</div>
                                        </div>
                                    </div>
                                )}

                                {entity.type === 'EMAIL' && intelData.breachCount !== undefined && (
                                    <div className="p-3 bg-[#0a0a0a] border border-rose-500/10 rounded">
                                        <div className="text-[9px] text-rose-400 uppercase font-bold mb-1 flex items-center gap-1.5"><ShieldAlert className="w-3 h-3" /> Veri İhlal Taraması: {intelData.status}</div>
                                        <div className="text-[11px] text-white/80">Sızıntı Sayısı: {intelData.breachCount}</div>
                                        {intelData.breaches && intelData.breaches.length > 0 && (
                                            <div className="mt-2 pl-2 border-l border-rose-500/30">
                                                {intelData.breaches?.map((b: string) => (
                                                    <div key={b} className="text-[10px] text-white/50 font-mono">{b}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {entity.type === 'ONION_URL' && intelData.marketType && (
                                    <div className="font-mono text-[11px] text-white/70 p-3 bg-purple-500/5 border border-purple-500/20 rounded">
                                        <div className="mb-1 text-purple-400">Tor Durumu: <span className="text-white/80">{intelData.status || 'Bilinmiyor'}</span></div>
                                        <div className="mb-1 text-purple-400">Profil: <span className="text-white/80">{intelData.marketType}</span></div>
                                        {intelData.relatedKeys && intelData.relatedKeys.length > 0 && (
                                            <div className="text-purple-400 mt-2">Bağlantılı Key'ler: 
                                                <div className="text-white/50 pl-2 mt-1 whitespace-pre-wrap">{intelData.relatedKeys?.join(', ')}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {entity.type === 'DOMAIN' && intelData.registrar && (
                                    <div className="p-3 bg-[#0a0a0a] border border-cyan-500/10 rounded">
                                        <div className="text-[9px] text-cyan-400 uppercase font-bold mb-2 flex items-center gap-1.5"><Globe className="w-3 h-3" /> Alan Adı İstihbaratı</div>
                                        <div className="grid grid-cols-2 gap-3 text-[11px] text-white/80 font-mono">
                                             <div>
                                                 <span className="text-white/40 block text-[9px] mb-1">Kayıt Firması (Registrar)</span>
                                                 {intelData.registrar}
                                             </div>
                                             <div>
                                                 <span className="text-white/40 block text-[9px] mb-1">Yaş / Kayıt Süresi</span>
                                                 {intelData.age}
                                             </div>
                                        </div>
                                        <div className="mt-2 text-[11px] text-white/60 font-mono border-t border-cyan-500/10 pt-2">
                                            Durum: {intelData.status || 'Bilinmiyor'}
                                        </div>
                                    </div>
                                )}
                                
                                {entity.type !== 'IP' && entity.type !== 'EMAIL' && entity.type !== 'ONION_URL' && entity.type !== 'DOMAIN' && intelData.mentions !== undefined && (
                                    <div className="p-3 bg-[#0a0a0a] border border-white/5 rounded">
                                         <div className="text-[9px] text-white/40 uppercase font-bold mb-1">OSINT Analizi</div>
                                         <div className="text-[11px] text-white/80">Açık Kaynak Bahsedilme Skoru: {intelData.mentions}</div>
                                         <div className="text-[11px] text-white/60 mt-1">Durum: {intelData.status || 'Bilinmiyor'}</div>
                                    </div>
                                )}

                                {intelData.tags && intelData.tags.length > 0 && (
                                    <div>
                                        <div className="text-[9px] text-white/40 uppercase font-bold mb-2">Sistem Etiketleri</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {intelData.tags.map((t: string) => (
                                                <span key={t} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-white/60">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {intelData.mentionHistory && intelData.mentionHistory.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-white/5">
                                        <div className="text-[9px] text-white/40 uppercase font-bold mb-2 flex items-center gap-1.5">
                                            <Activity className="w-3 h-3 text-blue-400" /> Açık Kaynak Görülme Frekansı (24s)
                                        </div>
                                        <div className="h-16 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={intelData.mentionHistory} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorMentions" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: '#080808', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '10px' }}
                                                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                                        labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
                                                    />
                                                    <Area 
                                                        type="monotone" 
                                                        dataKey="mentions" 
                                                        stroke="#3b82f6" 
                                                        fillOpacity={1} 
                                                        fill="url(#colorMentions)" 
                                                        strokeWidth={2}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
                                     <a href={`https://www.google.com/search?q="${entity.name}"`} target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded border border-blue-500/20 text-[10px] font-bold uppercase transition">
                                        <Search className="w-3.5 h-3.5" /> Google Dork İle Derinleştir
                                     </a>
                                </div>
                            </motion.div>
                        ) : null}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
