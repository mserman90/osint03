import React, { useState, useEffect } from 'react';
import { X, Search, FileText, Globe, Terminal, Plus, ShieldAlert, Database, Key } from 'lucide-react';

interface DorkBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDorkFeed: (name: string, url: string) => void;
}

const PREDEFINED_DORKS = [
  { id: '1', category: 'Credentials', name: 'Exposed Env Files', dork: 'filetype:env "DB_PASSWORD"' },
  { id: '2', category: 'Vulnerabilities', name: 'Open Directory (Index of)', dork: 'intitle:"index of" "wp-content/uploads"' },
  { id: '3', category: 'Documents', name: 'Confidential PDFs', dork: 'filetype:pdf intitle:"confidential" OR intitle:"gizli"' },
  { id: '4', category: 'Databases', name: 'SQL Dumps', dork: 'filetype:sql "insert into" "password"' },
  { id: '5', category: 'Cameras', name: 'Exposed Webcams', dork: 'inurl:"view.shtml" OR inurl:"view/index.shtml"' }
];

export const DorkBuilderModal: React.FC<DorkBuilderModalProps> = ({ isOpen, onClose, onAddDorkFeed }) => {
  const [operatorSite, setOperatorSite] = useState('');
  const [operatorFiletype, setOperatorFiletype] = useState('');
  const [operatorInurl, setOperatorInurl] = useState('');
  const [operatorIntitle, setOperatorIntitle] = useState('');
  const [exactKeyword, setExactKeyword] = useState('');
  const [excludeKeyword, setExcludeKeyword] = useState('');

  const [generatedDork, setGeneratedDork] = useState('');
  const [feedName, setFeedName] = useState('Custom Dork Feed');
  const [complexity, setComplexity] = useState({ score: 0, label: 'Yok', color: 'text-white/20', alert: false, alertMessage: '' });

  useEffect(() => {
    let score = 0;
    const dork = generatedDork.trim();
    if (dork.length > 0) score += 10;
    
    const operators = ['site:', 'filetype:', 'inurl:', 'intitle:', 'ext:'];
    operators.forEach(op => {
        if (dork.includes(op)) score += 15;
    });

    if (dork.includes('"')) score += 10;
    if (dork.includes('-')) score += 10;
    if (dork.includes('OR')) score += 10;
    if (dork.includes('AND')) score += 10;

    if (dork.length > 30) score += 10;
    if (dork.length > 60) score += 10;

    let label = 'Yok';
    let color = 'text-white/20';
    let alert = false;
    let alertMessage = '';
    
    if (score >= 70) {
        label = 'Yüksek (Odaklı)';
        color = 'text-green-400';
    } else if (score >= 40) {
        label = 'Orta';
        color = 'text-yellow-400';
    } else if (score > 0) {
        label = 'Düşük (Geniş)';
        color = 'text-white/60';
    }

    const monitoredPatterns = ['ext:sql', 'filetype:sql', 'inurl:admin', 'intitle:"index of"', 'filetype:env', 'password', 'db_password'];
    for (const pattern of monitoredPatterns) {
        if (dork.toLowerCase().includes(pattern)) {
            alert = true;
            alertMessage = 'UYARI: Hassas dosya veya panel taraması içeren dork kalıpları arama motorlarında hızlıca Rate Limit (CAPTCHA) tetikleyebilir.';
            break;
        }
    }

    if (!alert && dork.length > 100) {
        alert = true;
        alertMessage = 'UYARI: Çok uzun veya karmaşık sorgular arama motorları tarafından şüpheli aktivite olarak değerlendirilip engellenebilir.';
    }

    setComplexity({ score: Math.min(score, 100), label, color, alert, alertMessage });
  }, [generatedDork]);

  const [savedTemplates, setSavedTemplates] = useState<{id: string, name: string, dork: string}[]>(() => {
    try {
      const saved = localStorage.getItem('osint_saved_dork_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('osint_saved_dork_templates', JSON.stringify(savedTemplates));
  }, [savedTemplates]);

  const handleSaveTemplate = () => {
    if (!generatedDork.trim()) return;
    const name = feedName.trim() || 'Custom Dork';
    const newTemplate = {
      id: Date.now().toString(),
      name,
      dork: generatedDork
    };
    setSavedTemplates(prev => [newTemplate, ...prev]);
  };

  const handleRemoveTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedTemplates(prev => prev.filter(t => t.id !== id));
  };

  const [viewMode, setViewMode] = useState<'single' | 'bulk'>('single');
  const [bulkDomains, setBulkDomains] = useState('');
  const [selectedBulkTemplates, setSelectedBulkTemplates] = useState<string[]>(['b1', 'b2']);
  const [bulkResults, setBulkResults] = useState<{domain: string, template: string, dork: string}[]>([]);

  const BULK_TEMPLATES = [
    { id: 'b1', name: 'Açık Dizinler (Index of)', dorkBase: 'intitle:"index of"' },
    { id: 'b2', name: 'Şifre & Env Dosyaları', dorkBase: 'filetype:env OR filetype:config OR ext:env' },
    { id: 'b3', name: 'Veritabanı Yedekleri', dorkBase: 'filetype:sql OR filetype:bak OR filetype:db' },
    { id: 'b4', name: 'Yönetim Panelleri', dorkBase: 'inurl:admin OR inurl:login OR inurl:dashboard' },
    { id: 'b5', name: 'Hassas Belgeler', dorkBase: 'filetype:pdf OR filetype:docx OR filetype:xls "gizli" OR "confidential"' }
  ];

  const handleGenerateBulk = () => {
      const domains = bulkDomains.split('\n').map(d => d.trim()).filter(d => d.length > 0);
      const results: {domain: string, template: string, dork: string}[] = [];
      
      domains.forEach(domain => {
          selectedBulkTemplates.forEach(tId => {
              const tpl = BULK_TEMPLATES.find(t => t.id === tId);
              if (tpl) {
                  results.push({
                      domain,
                      template: tpl.name,
                      dork: `site:${domain} ${tpl.dorkBase}`
                  });
              }
          });
      });
      setBulkResults(results);
  };

  const handleToggleBulkTemplate = (id: string) => {
      setSelectedBulkTemplates(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  useEffect(() => {
    const parts = [];
    if (operatorSite) parts.push(`site:${operatorSite}`);
    if (operatorFiletype) parts.push(`filetype:${operatorFiletype}`);
    if (operatorInurl) parts.push(`inurl:${operatorInurl}`);
    if (operatorIntitle) parts.push(`intitle:"${operatorIntitle}"`);
    if (exactKeyword) parts.push(`"${exactKeyword}"`);
    if (excludeKeyword) parts.push(`-${excludeKeyword}`);
    
    setGeneratedDork(parts.join(' '));
  }, [operatorSite, operatorFiletype, operatorInurl, operatorIntitle, exactKeyword, excludeKeyword]);

  if (!isOpen) return null;

  const handleAddFeed = () => {
    if (!generatedDork) return;
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(generatedDork)}&hl=tr&gl=TR&ceid=TR:tr`;
    onAddDorkFeed(feedName, url);
    onClose();
  };

  const loadPredefined = (dork: string, name: string) => {
    setGeneratedDork(dork);
    setFeedName(name.endsWith('Dork Feed') ? name : `${name} Dork Feed`);
    // Clear individual fields for simplicity when a predefined dork is loaded
    setOperatorSite(''); setOperatorFiletype(''); setOperatorInurl('');
    setOperatorIntitle(''); setExactKeyword(''); setExcludeKeyword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0c0c0c] border border-white/10 rounded w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#080808] shrink-0">
          <div className="flex items-center gap-4">
              <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-white/50 border-r border-white/10 pr-4">
                <Terminal className="w-4 h-4 text-green-500" /> Advanced Dork Engine
              </h3>
              <div className="flex gap-2">
                  <button 
                      onClick={() => setViewMode('single')}
                      className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded transition-colors ${viewMode === 'single' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}
                  >
                      Tekli Üretici
                  </button>
                  <button 
                      onClick={() => setViewMode('bulk')}
                      className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded transition-colors ${viewMode === 'bulk' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}
                  >
                      Toplu Üretici
                  </button>
              </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors p-1 rounded hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {viewMode === 'single' && (
            <>
              {/* Sidebar: Predefined Dorks */}
              <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-white/10 p-4 bg-[#050505] flex flex-col overflow-y-auto">
                  <h4 className="text-[10px] uppercase font-bold text-white/40 mb-4 tracking-wider flex-shrink-0">Profesyonel Şablonlar</h4>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                      {PREDEFINED_DORKS.map(d => (
                          <div key={d.id} className="bg-white/5 border border-white/5 p-3 rounded cursor-pointer hover:bg-white/10 transition-colors group" onClick={() => loadPredefined(d.dork, d.name)}>
                              <div className="flex items-center gap-2 mb-1">
                                  {d.category === 'Credentials' ? <Key className="w-3 h-3 text-red-400" /> : 
                                   d.category === 'Databases' ? <Database className="w-3 h-3 text-blue-400" /> :
                                   <FileText className="w-3 h-3 text-white/50" />}
                                  <span className="text-[10px] uppercase font-bold text-white/70">{d.name}</span>
                              </div>
                              <p className="text-[9px] font-mono text-green-400/80 line-clamp-2">{d.dork}</p>
                          </div>
                      ))}
                  </div>

                  <div className="mt-6 flex-1 flex flex-col min-h-[150px]">
                      <h4 className="text-[10px] uppercase font-bold text-white/40 mb-4 tracking-wider flex-shrink-0">Kaydedilen Şablonlar</h4>
                      <div className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar">
                           {savedTemplates.length === 0 ? (
                               <div className="text-[10px] text-white/30 font-mono italic p-2 bg-[#080808] border border-white/5 rounded text-center">Kayıtlı şablon bulunamadı.</div>
                           ) : (
                               savedTemplates.map(t => (
                                  <div key={t.id} className="bg-white/5 border border-white/5 p-3 rounded cursor-pointer hover:bg-white/10 transition-colors group relative" onClick={() => loadPredefined(t.dork, t.name)}>
                                      <button onClick={(e) => handleRemoveTemplate(t.id, e)} className="absolute top-2 right-2 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <X className="w-3 h-3" />
                                      </button>
                                      <div className="flex items-center gap-2 mb-1 pr-6">
                                          <Terminal className="w-3 h-3 text-white/50" />
                                          <span className="text-[10px] uppercase font-bold text-white/70">{t.name}</span>
                                      </div>
                                      <p className="text-[9px] font-mono text-green-400/80 line-clamp-2">{t.dork}</p>
                                  </div>
                               ))
                           )}
                      </div>
                  </div>
              </div>

              {/* Main Area: Dork Builder */}
              <div className="md:w-2/3 p-4 flex flex-col gap-5 overflow-y-auto bg-[#080808]">
                 <div className="flex flex-col gap-3">
                     <h4 className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Manuel Dork İnşası</h4>
                     <div className="grid grid-cols-2 gap-3">
                         <div>
                             <label className="text-[9px] text-white/50 uppercase font-bold">Hedef Domain (site:)</label>
                             <input type="text" value={operatorSite} onChange={e => setOperatorSite(e.target.value)} placeholder="örn: gov.tr" className="w-full bg-[#050505] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-green-500/50 mt-1" />
                         </div>
                         <div>
                             <label className="text-[9px] text-white/50 uppercase font-bold">Dosya Türü (filetype:)</label>
                             <input type="text" value={operatorFiletype} onChange={e => setOperatorFiletype(e.target.value)} placeholder="örn: pdf, env, sql" className="w-full bg-[#050505] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-green-500/50 mt-1" />
                         </div>
                         <div>
                             <label className="text-[9px] text-white/50 uppercase font-bold">URL İçinde (inurl:)</label>
                             <input type="text" value={operatorInurl} onChange={e => setOperatorInurl(e.target.value)} placeholder="örn: admin, login" className="w-full bg-[#050505] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-green-500/50 mt-1" />
                         </div>
                         <div>
                             <label className="text-[9px] text-white/50 uppercase font-bold">Başlık İçinde (intitle:)</label>
                             <input type="text" value={operatorIntitle} onChange={e => setOperatorIntitle(e.target.value)} placeholder="örn: index of" className="w-full bg-[#050505] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-green-500/50 mt-1" />
                         </div>
                         <div>
                             <label className="text-[9px] text-white/50 uppercase font-bold">Tam Eşleşme ("")</label>
                             <input type="text" value={exactKeyword} onChange={e => setExactKeyword(e.target.value)} placeholder="örn: gizli belge" className="w-full bg-[#050505] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-green-500/50 mt-1" />
                         </div>
                         <div>
                             <label className="text-[9px] text-white/50 uppercase font-bold">Hariç Tut (-)</label>
                             <input type="text" value={excludeKeyword} onChange={e => setExcludeKeyword(e.target.value)} placeholder="örn: test" className="w-full bg-[#050505] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-green-500/50 mt-1" />
                         </div>
                     </div>
                 </div>

                 <div className="bg-[#050505] border border-green-500/20 p-3 rounded flex flex-col gap-2 mt-auto">
                     <div className="flex justify-between items-center">
                         <label className="text-[10px] uppercase font-bold text-green-500/80 tracking-wider flex items-center gap-1.5">
                             <Terminal className="w-3 h-3" /> Üretilen Dork
                         </label>
                         {complexity.score > 0 && (
                             <div className={`text-[9px] font-mono flex items-center gap-1.5 ${complexity.color}`} title="Dork Karmaşıklık & Odak Skoru">
                                 Karmaşıklık: {complexity.score}/100 <span className="opacity-75">({complexity.label})</span>
                             </div>
                         )}
                     </div>
                     <input 
                         type="text" 
                         value={generatedDork}
                         onChange={e => setGeneratedDork(e.target.value)}
                         className="w-full bg-black border border-white/10 rounded px-3 py-2 text-xs font-mono text-green-400 outline-none focus:border-green-500/50"
                     />
                     {complexity.alert && (
                         <div className="mt-1 flex items-start gap-1.5 text-orange-400 bg-orange-500/10 border border-orange-500/20 p-2 rounded">
                             <ShieldAlert className="w-3 h-3 flex-shrink-0" />
                             <p className="text-[9px] font-bold uppercase tracking-wide">{complexity.alertMessage}</p>
                         </div>
                     )}
                 </div>

                 <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-bold text-white/50">Kaynak Adı</label>
                          <button 
                              onClick={handleSaveTemplate}
                              disabled={!generatedDork.trim()}
                              className="text-[9px] font-bold uppercase tracking-wider text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors"
                          >
                              Şablon Olarak Kaydet
                          </button>
                      </div>
                      <input 
                         type="text" 
                         value={feedName}
                         onChange={e => setFeedName(e.target.value)}
                         className="w-full bg-[#050505] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-white/30"
                      />
                 </div>
              </div>
            </>
          )}

          {viewMode === 'bulk' && (
            <div className="w-full p-4 flex gap-4 overflow-hidden bg-[#080808]">
                <div className="w-1/3 flex flex-col gap-4">
                    <div className="flex flex-col flex-1">
                        <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider mb-2">Hedef Domainler (Her Satıra Bir Tane)</label>
                        <textarea 
                            value={bulkDomains}
                            onChange={(e) => setBulkDomains(e.target.value)}
                            className="w-full flex-1 bg-[#050505] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-green-500/50 font-mono resize-none custom-scrollbar"
                            placeholder={"test1.com\ntest2.com\n..."}
                        ></textarea>
                    </div>
                </div>

                <div className="w-1/3 flex flex-col gap-4">
                    <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Profesyonel Şablonlar</label>
                    <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {BULK_TEMPLATES.map(tpl => (
                            <label key={tpl.id} className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${selectedBulkTemplates.includes(tpl.id) ? 'bg-green-500/10 border-green-500/30' : 'bg-[#050505] border-white/5 hover:border-white/20'}`}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedBulkTemplates.includes(tpl.id)}
                                    onChange={() => handleToggleBulkTemplate(tpl.id)}
                                    className="mt-0.5 accent-green-500"
                                />
                                <div>
                                    <div className={`text-[11px] font-bold ${selectedBulkTemplates.includes(tpl.id) ? 'text-green-400' : 'text-white/70'}`}>{tpl.name}</div>
                                    <div className="text-[9px] font-mono text-white/40 mt-1">{tpl.dorkBase}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                    <button 
                        onClick={handleGenerateBulk}
                        disabled={!bulkDomains.trim() || selectedBulkTemplates.length === 0}
                        className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 px-4 py-2.5 rounded font-bold uppercase tracking-widest text-[10px] transition-colors disabled:opacity-50"
                    >
                        Dork Kombinasyonlarını Üret
                    </button>
                </div>

                <div className="w-1/3 flex flex-col gap-4">
                    <label className="text-[10px] uppercase font-bold text-green-500/80 tracking-wider">Üretilen Listesi</label>
                    <div className="bg-[#050505] border border-white/10 rounded flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {bulkResults.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-[10px] font-mono text-white/30 italic text-center px-4">
                                Domain listesi ve şablon seçtikten sonra üret diyerek kombinasyonları oluşturun.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {bulkResults.map((r, i) => (
                                    <div key={i} className="bg-white/5 border border-white/5 rounded p-2 relative group hover:border-white/20">
                                        <div className="text-[9px] uppercase text-white/40 font-bold mb-1">{r.domain} - {r.template}</div>
                                        <div className="text-[10px] font-mono text-green-400 pr-6">{r.dork}</div>
                                        <button 
                                            onClick={() => navigator.clipboard.writeText(r.dork)}
                                            className="absolute top-2 right-2 text-white/30 hover:text-white group-hover:opacity-100 opacity-0 transition-opacity"
                                            title="Kopyala"
                                        >
                                            <FileText className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-[#080808] border-t border-white/10 flex justify-between items-center shrink-0">
           <div className="text-[9px] text-white/30 uppercase font-mono max-w-xs">
               Dork motoru Google News RSS endpoint'i üzerinden proxy aracılığıyla işletilecektir.
           </div>
           <div className="flex gap-3">
               <button onClick={onClose} className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white/50 hover:text-white/80 transition-colors rounded hover:bg-white/5">
                  Kapat
               </button>
               {viewMode === 'single' && (
                 <button 
                    onClick={handleAddFeed}
                    disabled={!generatedDork.trim()}
                    className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/40 rounded text-[10px] font-bold uppercase tracking-wider transition-colors hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                 >
                    <Plus className="w-3.5 h-3.5" /> Entegre Et
                 </button>
               )}
           </div>
        </div>
      </div>
    </div>
  );
};
