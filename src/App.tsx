import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, Activity, RefreshCw, Network, 
  Map as MapIcon, Hash, BarChart3, Clock, Loader2, Radar, Target, Filter, ChevronRight,
  BellRing, X, Settings, Search, LayoutList, LayoutGrid, Download, Terminal
} from 'lucide-react';
import { fetchOsintData, generateAIBrief } from './api';
import { Signal, AIBrief } from './types';
import { NetworkGraph } from './components/NetworkGraph';
import { CertaintyIndex } from './components/CertaintyIndex';
import { SignalCard } from './components/SignalCard';
import { SignalGrid } from './components/SignalGrid';
import { SignalMap } from './components/SignalMap';
import { TrendingActivityChart } from './components/TrendingActivityChart';
import { GlobalIntelligenceIndex } from './components/GlobalIntelligenceIndex';
import { SentimentShiftChart } from './components/SentimentShiftChart';
import { WatchlistWidget } from './components/WatchlistWidget';
import { ActiveFeedsStatus } from './components/ActiveFeedsStatus';
import { FeedManagerModal } from './components/FeedManagerModal';
import { FEEDS } from './constants';

import { DorkBuilderModal } from './components/DorkBuilderModal';
import { EntityEnrichmentModal } from './components/EntityEnrichmentModal';
import { ReconDashboard } from './components/ReconDashboard';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const MODES = [
  { id: 'guvenlik', label: 'Güvenlik & Operasyon' },
  { id: 'ekonomik', label: 'Ekonomik Analiz' },
  { id: 'finansal', label: 'Finansal Hareketler' },
  { id: 'politik', label: 'Politik Kriz Takibi' },
  { id: 'sosyal', label: 'Sosyal Olaylar' },
  { id: 'hedef_kesif', label: 'Hedef Keşfi (Recon)' }
];

export default function App() {
  const [mode, setMode] = useState<string>('guvenlik');
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [aiBrief, setAiBrief] = useState<AIBrief | null>(null);
  const [customFeeds, setCustomFeeds] = useState<{name: string, url: string}[]>(FEEDS);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  
  // Advanced Features State
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("TÜMÜ");
  const [viewMode, setViewMode] = useState<"card" | "grid">("card");
  const [isDorkModalOpen, setIsDorkModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const seenSignals = useRef(new Set<string>());
  const isFirstLoad = useRef(true);
  const [toast, setToast] = useState<{ title: string, message: string } | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
      try {
          if ('Notification' in window && Notification.permission === 'granted') {
              setNotificationsEnabled(true);
          }
      } catch(e) {}
  }, []);

  const requestNotifications = async () => {
      try {
          if (!('Notification' in window)) return;
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
              setNotificationsEnabled(true);
          }
      } catch(e) {}
  };

  useEffect(() => {
      if (toast) {
          const timer = setTimeout(() => setToast(null), 5000);
          return () => clearTimeout(timer);
      }
  }, [toast]);

  useEffect(() => {
      if (signals.length === 0) return;
      
      let newCriticals = 0;
      let latestCriticalTitle = "";

      signals.forEach(sig => {
          if (!seenSignals.current.has(sig.id)) {
              seenSignals.current.add(sig.id);
              if (!isFirstLoad.current && sig.level === "KRİTİK") {
                  newCriticals++;
                  latestCriticalTitle = sig.title;
              }
          }
      });

      if (newCriticals > 0) {
          setToast({
              title: "KRİTİK ALARM AKTİF",
              message: newCriticals > 1 ? `${newCriticals} yeni kritik sinyal tespit edildi.` : latestCriticalTitle
          });

          try {
              if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('KRİTİK ALARM', {
                      body: newCriticals > 1 ? `${newCriticals} yeni kritik sinyal tespit edildi.` : latestCriticalTitle,
                  });
              }
          } catch(e) {}
      }

      isFirstLoad.current = false;
  }, [signals]);

  const loadData = async () => {
    setLoading(true);
    const result = await fetchOsintData(mode, customFeeds);
    if (result.dataAvailable && result.items) {
      setSignals(result.items);
      const brief = await generateAIBrief(result.items, mode);
      setAiBrief(brief);
    } else {
        setSignals([]);
    }
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // 5 dakikada bir otomatik yenile (API kotasını korumak için süre uzatıldı)
    const interval = setInterval(loadData, 300000);
    return () => clearInterval(interval);
  }, [mode, customFeeds]);

  const filteredSignals = signals.filter(sig => {
      const matchSearch = sig.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sig.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (sig.content && sig.content.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchLevel = levelFilter === "TÜMÜ" || sig.level === levelFilter;
      return matchSearch && matchLevel;
  });

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#050505',
        useCORS: true,
        height: element.scrollHeight,
        windowHeight: element.scrollHeight,
        y: 0
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // If the pdfHeight is larger than the page height, it will be a long single page
      // but jsPDF 'a4' sets a fixed page. But that's okay, addImage can overflow to multiple pages or we can adjust it.
      // Easiest is to change jsPDF to format based on aspect ratio or just let it scale.
      // Let's create a custom page size if we want it continuously:
      const pdfDocs = new jsPDF({
         orientation: pdfWidth > pdfHeight ? 'l' : 'p',
         unit: 'mm',
         format: [pdfWidth, pdfHeight]
      });
      
      pdfDocs.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdfDocs.save('OSINT_Report.pdf');
    } catch (err) {
      console.error('PDF generation error', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportCSV = () => {
     if (filteredSignals.length === 0) return;
     const headers = ["ID", "Tarih", "Seviye", "Başlık", "Kaynak", "Duygu", "Güvenilirlik", "Link"];
     const csvContent = [
        headers.join(","),
        ...filteredSignals.map(s => [
           s.id, 
           new Date(s.pubDate).toISOString(), 
           s.level, 
           `"${s.title.replace(/"/g, '""')}"`, 
           `"${s.source}"`, 
           s.sentiment.label, 
           s.reliability.label,
           `"${s.link}"`
        ].join(","))
     ].join("\n");
     
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const link = document.createElement("a");
     link.href = URL.createObjectURL(blob);
     link.setAttribute("download", `osint_export_${mode}_${new Date().toISOString().slice(0,10)}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-[#e0e0e0] select-none flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a]">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
            <Radar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-[0.2em] uppercase text-white">OSINT SİSTEMİ v6.0</h1>
            <p className="text-[10px] text-emerald-500 font-mono tracking-wider uppercase">Sistem Durumu: Aktif / Veri Akışı Stabil</p>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="h-8 w-px bg-white/10 hidden md:block"></div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-white/40 uppercase font-mono">Son Güncelleme</p>
            <p className="text-xs font-mono text-white/80">{lastUpdate.toLocaleTimeString('tr-TR')} UTC</p>
          </div>
          <button 
            onClick={requestNotifications} 
            className={`hidden sm:flex items-center justify-center w-8 h-8 rounded border transition ${notificationsEnabled ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/80'}`}
            title={notificationsEnabled ? "Bildirimler Açık" : "Bildirimleri Aç"}
          >
              <BellRing className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main id="report-content" className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-px bg-white/5 overflow-y-auto">
        
        {/* Left Sidebar: Modes */}
        <aside className="col-span-1 md:col-span-2 bg-[#080808] flex flex-col">
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-[10px] font-bold text-white/40 uppercase mb-3 tracking-widest">İzleme Modları</h2>
            <div className="space-y-1 text-xs">
              {MODES.map(m => (
                  <button 
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={`w-full text-left px-3 py-2 rounded font-medium transition-colors ${mode === m.id ? 'border border-red-500/50 bg-red-500/10 text-red-400' : 'text-white/60 hover:bg-white/5'}`}
                  >
                      {m.label}
                  </button>
              ))}
            </div>
            
            <button 
                onClick={loadData} 
                disabled={loading}
                className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/80 text-xs rounded border border-white/10 transition disabled:opacity-50"
              >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Senkronize Et</span>
            </button>
          </div>

          <div className="p-4 flex-1">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Aktif Kaynaklar</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsDorkModalOpen(true)}
                  className="text-green-400/70 hover:text-green-400 transition-colors p-1"
                  title="Dork Engine (Gelişmiş Arama)"
                >
                  <Terminal className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setIsFeedModalOpen(true)}
                  className="text-white/40 hover:text-white/80 transition-colors p-1"
                  title="Kaynakları Yönet"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <ActiveFeedsStatus />
          </div>

          <div className="p-4 bg-red-950/20 border-t border-white/5">
             <div className="flex items-center gap-2 mb-2">
               <div className="w-1.5 h-1.5 bg-red-500 animate-pulse rounded-full"></div>
               <span className="text-[10px] text-red-400 font-bold uppercase tracking-tighter">KRİTİK ALARM AKTİF</span>
             </div>
             <p className="text-[10px] text-red-200/60 leading-tight italic">Olası olağandışı hareketlilik sensörlerde tespit edildi.</p>
          </div>
        </aside>

        {/* Main Content Area */}
        {mode === 'hedef_kesif' ? (
            <section className="col-span-1 md:col-span-10 bg-[#050505] flex flex-col border-x border-white/5 overflow-y-auto">
                <ReconDashboard />
            </section>
        ) : (
            <>
                <section className="col-span-1 md:col-span-7 bg-[#050505] flex flex-col border-x border-white/5 overflow-y-auto">
                  <div className="flex-1 p-6 relative">
                    
                    {/* AI Brief Box */}
                    {aiBrief && (
                        <div className="bg-[#080808] rounded border border-white/5 flex items-start gap-4 p-4 mb-6 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent"></div>
                            <div className="bg-blue-500/10 p-3 rounded-full shrink-0 border border-blue-500/20 z-10">
                                <Target className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="z-10">
                                <h2 className="text-[10px] font-bold text-white/40 uppercase mb-2 tracking-widest">{aiBrief.headline}</h2>
                                <p className="text-sm text-white/80 mb-3 leading-relaxed">
                                    {aiBrief.summary}
                                </p>
                                <div className="flex gap-2 text-xs">
                                    {aiBrief.trends.map(t => (
                                        <span key={t} className="px-2 py-1 bg-white/5 text-white/50 rounded border border-white/5 text-[10px] uppercase font-bold tracking-wider">
                                            Trend: {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Map */}
                    {signals.length > 0 && (
                        <SignalMap signals={signals} />
                    )}

                    {/* Signals Feed */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between pb-3 border-b border-white/10 gap-4">
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                                <Activity className="w-4 h-4 text-blue-500" /> Sinyal Akışı
                            </h3>
                            
                            <div className="flex flex-wrap items-center gap-2">
                                 {/* Search */}
                                 <div className="relative">
                                     <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                     <input 
                                         type="text" 
                                         placeholder="Sinyal veya kaynak ara..." 
                                         value={searchTerm}
                                         onChange={(e) => setSearchTerm(e.target.value)}
                                         className="bg-white/5 border border-white/10 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-blue-500/50 outline-none w-48 transition-colors"
                                     />
                                 </div>
                                 
                                 {/* Level Filter */}
                                 <select 
                                     value={levelFilter} 
                                     onChange={(e) => setLevelFilter(e.target.value)}
                                     className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[10px] uppercase font-bold text-white/80 outline-none cursor-pointer hover:bg-white/10 transition-colors"
                                 >
                                     <option value="TÜMÜ">Tüm Seviyeler</option>
                                     <option value="KRİTİK">Kritik</option>
                                     <option value="YÜKSEK">Yüksek</option>
                                     <option value="ORTA">Orta</option>
                                 </select>

                                 {/* View Toggles */}
                                 <div className="flex items-center bg-white/5 border border-white/10 rounded overflow-hidden">
                                     <button 
                                         onClick={() => setViewMode('card')}
                                         className={`p-1.5 transition-colors ${viewMode === 'card' ? 'bg-blue-500/20 text-blue-400' : 'text-white/40 hover:bg-white/10 hover:text-white/80'}`}
                                         title="Kart Görünümü"
                                     >
                                         <LayoutGrid className="w-3.5 h-3.5" />
                                     </button>
                                     <button 
                                         onClick={() => setViewMode('grid')}
                                         className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-blue-500/20 text-blue-400' : 'text-white/40 hover:bg-white/10 hover:text-white/80'}`}
                                         title="Liste Görünümü"
                                     >
                                         <LayoutList className="w-3.5 h-3.5" />
                                     </button>
                                 </div>

                                 {/* Export */}
                                 <button 
                                     onClick={handleExportCSV}
                                     disabled={filteredSignals.length === 0}
                                     className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 rounded text-[10px] font-bold uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto xl:ml-0"
                                     title="CSV Olarak Dışa Aktar"
                                 >
                                     <Download className="w-3.5 h-3.5" /> Dışa Aktar
                                 </button>
                                 <button 
                                     onClick={handleDownloadPDF}
                                     disabled={filteredSignals.length === 0 || isDownloading}
                                     className={`flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[10px] font-bold uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2 mr-auto xl:ml-0 xl:mr-0`}
                                     title="Görünümü PDF Olarak İndir"
                                 >
                                     {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} 
                                     PDF Rapor
                                 </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 text-white/40 gap-4 bg-[#080808] rounded border border-white/5">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Veri kaynakları taranıyor...</p>
                            </div>
                        ) : filteredSignals.length > 0 ? (
                            viewMode === 'grid' ? (
                                <SignalGrid signals={filteredSignals} watchlist={watchlist} onEntityClick={setSelectedEntity} />
                            ) : (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                     {filteredSignals.map((signal, idx) => (
                                         <SignalCard key={`${signal.id}-${idx}`} signal={signal} watchlist={watchlist} onEntityClick={setSelectedEntity} />
                                     ))}
                                </div>
                            )
                        ) : (
                             <div className="flex flex-col items-center justify-center h-64 text-white/40 border border-white/5 rounded bg-white/[0.02]">
                                <ShieldAlert className="w-8 h-8 mb-3 text-white/20" />
                                <p className="text-[10px] font-bold tracking-widest uppercase">Kriterlere uygun sinyal bulunamadı.</p>
                            </div>
                        )}
                    </div>
                  </div>
                </section>

                {/* Right Sidebar */}
                <aside className="col-span-1 md:col-span-3 bg-[#080808] flex flex-col p-5 gap-6 overflow-y-auto">
                    <WatchlistWidget 
                        signals={signals} 
                        watchlist={watchlist} 
                        onAdd={(kw) => setWatchlist(prev => [...prev, kw])}
                        onRemove={(kw) => setWatchlist(prev => prev.filter(w => w !== kw))}
                    />
                    <GlobalIntelligenceIndex signals={signals} />
                    <SentimentShiftChart signals={signals} />
                    <CertaintyIndex signals={signals} aiBrief={aiBrief} />
                    <NetworkGraph signals={signals} mode={mode} onEntityClick={setSelectedEntity} />
                    <TrendingActivityChart signals={signals} />
                </aside>
            </>
        )}

      </main>

      {/* Footer Ticker */}
      <footer className="h-10 bg-[#0a0a0a] border-t border-white/10 flex items-center overflow-hidden shrink-0">
        <div className="bg-red-600 h-full px-4 flex items-center shrink-0">
          <span className="text-[10px] font-black uppercase text-white tracking-widest">SON DAKİKA</span>
        </div>
        <div className="px-4 flex gap-8 animate-none whitespace-nowrap overflow-hidden text-xs">
          {signals.length > 0 ? signals.slice(0, 5).map((sig, idx) => (
              <React.Fragment key={idx}>
                <span className="text-white/80 font-medium whitespace-nowrap"><span className="text-red-500 mr-2">[{new Date(sig.pubDate).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}]</span> {sig.title}</span>
                <span className="text-white/40">|</span>
              </React.Fragment>
          )) : (
             <span className="text-white/40">Sinyal bekleniyor...</span>
          )}
        </div>
      </footer>

      {/* Feed Manager Modal */}
      {isFeedModalOpen && (
         <FeedManagerModal
             isOpen={isFeedModalOpen}
             onClose={() => setIsFeedModalOpen(false)}
             feeds={customFeeds}
             onSave={setCustomFeeds}
         />
      )}

      {/* Dork Builder Modal */}
      {isDorkModalOpen && (
          <DorkBuilderModal
              isOpen={isDorkModalOpen}
              onClose={() => setIsDorkModalOpen(false)}
              onAddDorkFeed={(name, url) => {
                  setCustomFeeds(prev => [...prev, { name, url }]);
              }}
          />
      )}

      {/* Entity Enrichment Modal */}
      {selectedEntity && (
         <EntityEnrichmentModal 
            entity={selectedEntity} 
            onClose={() => setSelectedEntity(null)} 
         />
      )}

      {/* Toast Notification */}
      {toast && (
          <div className="fixed bottom-14 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
              <div className="bg-red-950/90 border border-red-500/50 p-4 rounded shadow-[0_0_20px_rgba(239,68,68,0.3)] max-w-sm flex gap-3 items-start backdrop-blur-md">
                 <div className="bg-red-500/20 p-2 rounded-full shrink-0">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                 </div>
                 <div>
                    <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest leading-none mb-1.5">{toast.title}</h4>
                    <p className="text-xs text-white/90 leading-tight">{toast.message}</p>
                 </div>
                 <button onClick={() => setToast(null)} className="text-white/40 hover:text-white/80 ml-2">
                     <X className="w-4 h-4" />
                 </button>
              </div>
          </div>
      )}
    </div>
  );
}
