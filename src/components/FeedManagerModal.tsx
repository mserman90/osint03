import React, { useState } from 'react';
import { X, Plus, Trash2, Rss } from 'lucide-react';

interface Feed {
  name: string;
  url: string;
}

interface FeedManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeds: Feed[];
  onSave: (feeds: Feed[]) => void;
}

export const FeedManagerModal: React.FC<FeedManagerModalProps> = ({ isOpen, onClose, feeds, onSave }) => {
  const [localFeeds, setLocalFeeds] = useState<Feed[]>(feeds);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newName.trim() && newUrl.trim()) {
      setLocalFeeds([...localFeeds, { name: newName.trim(), url: newUrl.trim() }]);
      setNewName('');
      setNewUrl('');
    }
  };

  const handleRemove = (index: number) => {
    setLocalFeeds(localFeeds.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(localFeeds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0c0c0c] border border-white/10 rounded overflow-hidden w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#080808]">
          <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-white/50">
            <Rss className="w-4 h-4 text-orange-400" /> RSS Konfigürasyonu
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors p-1 rounded hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Aktif Kaynaklar ({localFeeds.length})</label>
            <div className="max-h-48 overflow-y-auto pr-1 flex flex-col gap-2">
              {localFeeds.map((feed, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white/[0.03] border border-white/5 p-2 rounded group">
                  <div className="overflow-hidden pr-2">
                    <p className="text-[11px] font-bold text-white/80 uppercase truncate">{feed.name}</p>
                    <p className="text-[9px] text-white/40 font-mono truncate">{feed.url}</p>
                  </div>
                  <button 
                    onClick={() => handleRemove(idx)}
                    className="text-red-400 opacity-50 hover:opacity-100 hover:bg-red-400/10 p-1.5 rounded transition-colors shrink-0"
                    title="Kaynağı Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {localFeeds.length === 0 && (
                <p className="text-[10px] text-white/40 italic px-2 py-4 text-center">Tüm kaynaklar silindi.</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
            <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Yeni Kaynak Ekle</label>
            <input 
              type="text" 
              placeholder="Kaynak Adı (örn: Reuters S.Dakika)" 
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="bg-[#050505] border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-orange-500/50 transition-colors"
            />
            <input 
              type="url" 
              placeholder="RSS URL'si" 
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              className="bg-[#050505] border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-orange-500/50 transition-colors"
            />
            <button 
              onClick={handleAdd}
              disabled={!newName.trim() || !newUrl.trim()}
              className="mt-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 rounded py-2 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" /> Listeye Ekle
            </button>
          </div>
        </div>

        <div className="p-4 bg-[#080808] border-t border-white/10 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white/50 hover:text-white/80 transition-colors rounded hover:bg-white/5">
              İptal
           </button>
           <button onClick={handleSave} className="px-4 py-2 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/40 rounded text-[10px] font-bold uppercase tracking-wider transition-colors hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]">
              Kaydet & Uygula
           </button>
        </div>
      </div>
    </div>
  );
};
