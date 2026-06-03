import React, { useState } from 'react';
import { Target, Plus, X, Bell } from 'lucide-react';
import { Signal } from '../types';

interface WatchlistWidgetProps {
  signals: Signal[];
  watchlist: string[];
  onAdd: (keyword: string) => void;
  onRemove: (keyword: string) => void;
}

export const WatchlistWidget: React.FC<WatchlistWidgetProps> = ({ signals, watchlist, onAdd, onRemove }) => {
  const [newKeyword, setNewKeyword] = useState('');

  const getHits = (keyword: string) => {
    return signals.filter(s => 
      s.title.toLowerCase().includes(keyword.toLowerCase()) || 
      (s.content && s.content.toLowerCase().includes(keyword.toLowerCase()))
    ).length;
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim() && !watchlist.includes(newKeyword.trim())) {
      onAdd(newKeyword.trim());
      setNewKeyword('');
    }
  };

  return (
    <div className="bg-[#080808] p-5 rounded border border-white/5">
        <h3 className="text-xs font-bold text-white/40 uppercase mb-4 tracking-widest flex items-center gap-2">
            <Target className="w-4 h-4 text-rose-500" /> Watchlist (Aktif Hedef Takibi)
        </h3>
        
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
            <input 
                type="text" 
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                placeholder="Takip edilecek kurum, kişi veya proje..."
                className="flex-1 bg-black border border-white/10 rounded px-2 py-1.5 text-[10px] uppercase font-bold text-white outline-none focus:border-rose-500/50 transition-colors"
            />
            <button type="submit" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 px-2 py-1.5 rounded transition-colors" disabled={!newKeyword.trim()}>
                <Plus className="w-3.5 h-3.5" />
            </button>
        </form>

        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {watchlist.length === 0 ? (
                <p className="text-[10px] text-white/30 font-mono text-center py-4 border border-dashed border-white/10 rounded">Takip listesi boş. Hemen hedef ekleyin.</p>
            ) : (
                watchlist.map(keyword => {
                    const hits = getHits(keyword);
                    return (
                        <div key={keyword} className="flex items-center justify-between bg-white/5 border border-white/5 p-2 rounded group">
                            <div className="flex items-center gap-2">
                                <Bell className={`w-3 h-3 ${hits > 0 ? 'text-rose-400 animate-pulse' : 'text-white/20'}`} />
                                <span className="text-[10px] uppercase font-bold text-white/80">{keyword}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {hits > 0 && (
                                    <span className="text-[9px] font-mono bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/30">
                                        {hits} TESPİT
                                    </span>
                                )}
                                <button onClick={() => onRemove(keyword)} className="text-white/20 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
};
