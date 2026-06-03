import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Signal } from '../types';
import { HeartPulse } from 'lucide-react';

interface SentimentShiftChartProps {
  signals: Signal[];
}

export const SentimentShiftChart: React.FC<SentimentShiftChartProps> = ({ signals }) => {
  const data = useMemo(() => {
    const now = new Date();
    // Create 6 buckets for the last 60 minutes (10 mins each)
    const buckets: { time: string; score: number; count: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
        const bucketTime = new Date(now.getTime() - i * 10 * 60 * 1000);
        buckets.push({
            time: bucketTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            score: 0,
            count: 0
        });
    }

    signals.forEach(s => {
        const d = new Date(s.pubDate);
        const minsDiff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60));
        
        if (minsDiff >= 0 && minsDiff < 60) {
            const bucketIndex = 5 - Math.floor(minsDiff / 10);
            if (bucketIndex >= 0 && bucketIndex < 6) {
                let sScore = 0;
                switch (s.sentiment.label) {
                    case 'PANİK': sScore = -100; break;
                    case 'NEGATİF': sScore = -50; break;
                    case 'NÖTR': sScore = 0; break;
                    case 'POZİTİF': sScore = 50; break;
                    default: sScore = 0;
                }
                buckets[bucketIndex].score += sScore;
                buckets[bucketIndex].count += 1;
            }
        }
    });

    return buckets.map(b => ({
       time: b.time,
       mood: b.count > 0 ? b.score / b.count : 0
    }));
  }, [signals]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = Math.round(payload[0].value);
      const moodLabel = val <= -50 ? 'Kritik/Panik' : val < 0 ? 'Negatif' : val === 0 ? 'Nötr' : 'Pozitif';
      const color = val <= -50 ? '#ef4444' : val < 0 ? '#f97316' : val === 0 ? '#3b82f6' : '#10b981';
      
      return (
        <div className="bg-[#0c0c0c] border border-white/10 p-2 rounded shadow-xl">
          <p className="text-[10px] text-white/50 mb-1">{label}</p>
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold" style={{ color }}>{moodLabel}</span>
             <span className="text-[10px] text-white/80 font-mono">({val > 0 ? '+' : ''}{val})</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
      <div className="bg-[#080808] p-5 rounded border border-white/5">
          <h3 className="text-xs font-bold text-white/40 uppercase mb-4 tracking-widest flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-emerald-500" /> Sentiment Shift (60 Dk)
          </h3>
          <div className="flex flex-col">
             <div className="h-40 w-full -ml-4">
                 <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                         <defs>
                             <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                 <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                 <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3}/>
                             </linearGradient>
                         </defs>
                         <XAxis 
                             dataKey="time" 
                             stroke="rgba(255,255,255,0.2)" 
                             fontSize={9} 
                             tickMargin={10}
                             tickLine={false}
                             axisLine={false}
                         />
                         <YAxis 
                             stroke="rgba(255,255,255,0.2)" 
                             fontSize={9} 
                             tickLine={false}
                             axisLine={false}
                             domain={[-100, 100]}
                             ticks={[-100, -50, 0, 50, 100]}
                         />
                         <Tooltip content={<CustomTooltip />} />
                         <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                         <Area 
                             type="monotone" 
                             dataKey="mood" 
                             stroke="#3b82f6" 
                             fillOpacity={1} 
                             fill="url(#colorMood)" 
                             strokeWidth={2}
                             animationDuration={1500}
                         />
                     </AreaChart>
                 </ResponsiveContainer>
             </div>
             <p className="text-[9px] text-white/30 text-center uppercase font-mono mt-2 flex justify-center gap-4">
                 <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Pozitif</span>
                 <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Negatif / Panik</span>
             </p>
          </div>
      </div>
  );
};
