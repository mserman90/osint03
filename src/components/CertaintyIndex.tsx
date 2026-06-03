import React from 'react';
import { Gauge, ShieldAlert, ShieldCheck, Activity } from 'lucide-react';
import { Signal, AIBrief } from '../types';

interface CertaintyIndexProps {
    signals: Signal[];
    aiBrief: AIBrief | null;
}

export const CertaintyIndex: React.FC<CertaintyIndexProps> = ({ signals, aiBrief }) => {
    
    // Doğruluk endeksini kaynak güvenilirliğine göre hesapla
    const certaintyScore = signals.length > 0 
        ? (signals.reduce((acc, curr) => acc + curr.reliability.weight, 0) / signals.length) * 100
        : 0;

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-500";
        if (score >= 50) return "text-blue-500";
        return "text-orange-500";
    };

    return (
        <div className="bg-[#080808] rounded border border-white/5 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-5 blur-3xl rounded-full"></div>
            
            <div className="p-5 relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-white/60">
                        <Gauge className="w-4 h-4 text-blue-500" /> Veri Doğruluk (VDE)
                    </h3>
                    <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded text-[10px] uppercase font-bold border border-emerald-500/20">
                        <Activity className="w-3 h-3 text-emerald-500" /> 
                        <span className="text-emerald-500">Canlı</span>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-4 mb-4">
                    <div className="relative flex items-center justify-center">
                        <svg className="w-32 h-32 transform -rotate-90">
                            <circle
                                className="text-white/5"
                                strokeWidth="8"
                                stroke="currentColor"
                                fill="transparent"
                                r="58"
                                cx="64"
                                cy="64"
                            />
                            <circle
                                className={`\${getScoreColor(certaintyScore)} drop-shadow-md transition-all duration-1000 ease-out`}
                                strokeWidth="8"
                                strokeDasharray={364}
                                strokeDashoffset={364 - (364 * certaintyScore) / 100}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r="58"
                                cx="64"
                                cy="64"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white">{certaintyScore.toFixed(0)}</span>
                            <span className="text-[10px] text-white/40 font-mono tracking-wider">SKOR</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-[#0c0c0c] p-3 rounded border border-white/5">
                        <div className="text-[10px] text-white/40 uppercase mb-1">Onaylanan Varlık</div>
                        <div className="text-lg font-mono font-bold text-white/80">
                            {signals.filter(s => s.reliability.code === 'A').length}
                        </div>
                    </div>
                    <div className="bg-[#0c0c0c] p-3 rounded border border-white/5">
                        <div className="text-[10px] text-white/40 uppercase mb-1">Açık Ağ (C-Sınıfı)</div>
                        <div className="text-lg font-mono font-bold text-white/80">
                            {signals.filter(s => s.reliability.code === 'C').length}
                        </div>
                    </div>
                </div>

                {aiBrief && (
                    <div className="mt-4 bg-[#0c0c0c] p-4 rounded border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            {aiBrief.threatScore > 50 ? (
                                <ShieldAlert className="w-4 h-4 text-red-500" />
                            ) : (
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            )}
                            <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">Tehdit Seviyesi: <span className={aiBrief.threatScore > 50 ? "text-red-500" : "text-emerald-500"}>{aiBrief.threatLabel}</span></span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-1000 ${aiBrief.threatScore > 50 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                style={{ width: `\${aiBrief.threatScore}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
