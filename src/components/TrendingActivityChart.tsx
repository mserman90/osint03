import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Signal } from '../types';
import { BarChart3 } from 'lucide-react';

interface TrendingActivityChartProps {
  signals: Signal[];
}

export const TrendingActivityChart: React.FC<TrendingActivityChartProps> = ({ signals }) => {
  const chartData = useMemo(() => {
    // Top 3 entities
    const entityCounts: Record<string, number> = {};
    signals.forEach(s => {
      s.entities.forEach(e => {
        entityCounts[e.name] = (entityCounts[e.name] || 0) + 1;
      });
    });

    const topEntities = Object.entries(entityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    if (topEntities.length === 0) return [];

    // Map real data to 24h buckets ending now
    const now = new Date();
    const buckets: Record<number, Record<string, number>> = {};
    
    // Initialize 24 discrete hour buckets
    for (let i = 0; i <= 24; i++) {
        buckets[i] = {};
        topEntities.forEach(e => buckets[i][e] = 0);
    }
    
    signals.forEach(s => {
        const d = new Date(s.pubDate);
        const hoursDiff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
        if (hoursDiff >= 0 && hoursDiff <= 24) {
            s.entities.forEach(e => {
                if (topEntities.includes(e.name)) {
                    buckets[hoursDiff][e.name]++;
                }
            });
        }
    });

    const data = [];
    for (let i = 24; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        const timeStr = time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        
        const point: any = { time: timeStr };
        topEntities.forEach(entity => {
            point[entity] = buckets[i][entity];
        });
        
        data.push(point);
    }
    
    return { data, entities: topEntities };
  }, [signals]);

  if (!chartData || 'length' in chartData || chartData.entities.length === 0) {
     return (
        <div className="bg-[#080808] p-5 rounded border border-white/5">
             <h3 className="text-xs font-bold text-white/40 uppercase mb-4 tracking-widest flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" /> Sinyal Aktivite Trendi (24s)
             </h3>
             <div className="flex items-center justify-center h-48 text-white/40 text-xs">
                 Yeterli veri bulunamadı.
             </div>
        </div>
     );
  }

  const colors = ['#3b82f6', '#ef4444', '#10b981'];

  return (
    <div className="bg-[#080808] p-5 rounded border border-white/5">
        <h3 className="text-xs font-bold text-white/40 uppercase mb-4 tracking-widest flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" /> Sinyal Aktivite Trendi (24s)
        </h3>
        
        <div className="flex flex-wrap gap-3 mb-4">
            {chartData.entities.map((entity, idx) => (
                <div key={entity} className="flex items-center gap-1.5">
                   <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                   <span className="text-[10px] text-white/70 font-bold uppercase">{entity}</span>
                </div>
            ))}
        </div>

        <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                        dataKey="time" 
                        stroke="rgba(255,255,255,0.2)" 
                        fontSize={8} 
                        tickMargin={8}
                        minTickGap={30}
                    />
                    <YAxis 
                        stroke="rgba(255,255,255,0.2)" 
                        fontSize={8} 
                        tickFormatter={(val) => Math.floor(val).toString()}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#080808', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '10px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
                    />
                    {chartData.entities.map((entity, idx) => (
                        <Line 
                            key={entity}
                            type="monotone" 
                            dataKey={entity} 
                            stroke={colors[idx % colors.length]} 
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};
