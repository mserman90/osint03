import React, { useState } from 'react';
import { Target, Search, Loader2, Globe, ShieldAlert, Cpu, Network, UserSearch, AlertCircle, CheckCircle2, XCircle, Server, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ReconDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'subdomain' | 'username' | 'network'>('subdomain');
    
    // Subdomain state
    const [targetDomain, setTargetDomain] = useState('');
    const [loadingSub, setLoadingSub] = useState(false);
    const [resultsSub, setResultsSub] = useState<{ target: string, subdomains: string[] } | null>(null);
    const [errorSub, setErrorSub] = useState<string | null>(null);

    // Username state
    const [targetUsername, setTargetUsername] = useState('');
    const [loadingUser, setLoadingUser] = useState(false);
    const [resultsUser, setResultsUser] = useState<{ target: string, platforms: any[] } | null>(null);
    const [errorUser, setErrorUser] = useState<string | null>(null);

    // Network state
    const [targetNetwork, setTargetNetwork] = useState('');
    const [loadingNet, setLoadingNet] = useState(false);
    const [resultsNet, setResultsNet] = useState<any>(null);
    const [errorNet, setErrorNet] = useState<string | null>(null);

    const handleReconSub = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetDomain.trim()) return;

        setLoadingSub(true);
        setErrorSub(null);
        setResultsSub(null);

        try {
            const res = await fetch(`/api/recon/crtsh?domain=${encodeURIComponent(targetDomain)}`);
            if (!res.ok) throw new Error('Hedef veri çekilemedi.');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setResultsSub(data);
        } catch (err: any) {
            setErrorSub(err.message || "Bilinmeyen bir hata oluştu.");
        } finally {
            setLoadingSub(false);
        }
    };

    const handleReconUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetUsername.trim()) return;

        setLoadingUser(true);
        setErrorUser(null);
        setResultsUser(null);

        try {
            const res = await fetch(`/api/recon/username?user=${encodeURIComponent(targetUsername)}`);
            if (!res.ok) throw new Error('Bağlantı hatası.');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setResultsUser(data);
        } catch (err: any) {
            setErrorUser(err.message || "Bilinmeyen bir hata oluştu.");
        } finally {
            setLoadingUser(false);
        }
    };

    const handleReconNet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetNetwork.trim()) return;

        setLoadingNet(true);
        setErrorNet(null);
        setResultsNet(null);

        try {
            const res = await fetch(`/api/recon/network?target=${encodeURIComponent(targetNetwork)}`);
            if (!res.ok) throw new Error('Ağ bilgileri alınamadı.');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setResultsNet(data);
        } catch (err: any) {
            setErrorNet(err.message || "Bilinmeyen bir hata oluştu.");
        } finally {
            setLoadingNet(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 h-full">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <button 
                    onClick={() => setActiveTab('subdomain')}
                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded ${activeTab === 'subdomain' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}
                >
                    Subdomain Keşfi (crt.sh)
                </button>
                <button 
                    onClick={() => setActiveTab('username')}
                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded ${activeTab === 'username' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}
                >
                    Kullanıcı Adı Tarama
                </button>
                <button 
                    onClick={() => setActiveTab('network')}
                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded ${activeTab === 'network' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}
                >
                    Ağ & IP Analizi
                </button>
            </div>

            {activeTab === 'subdomain' && (
                <>
                    <div className="bg-[#080808] border border-white/10 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-500/10 rounded">
                                <Target className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white tracking-widest uppercase">Derin Varlık Keşfi (CT Logs)</h2>
                                <p className="text-[10px] text-white/50 font-mono">Certificate Transparency (crt.sh) üzerinden alt alan adı (subdomain) dökümü.</p>
                            </div>
                        </div>

                        <form onSubmit={handleReconSub} className="flex gap-3">
                            <div className="flex-1 relative">
                                <Globe className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="text" 
                                    className="w-full bg-[#050505] border border-white/10 rounded px-9 py-2.5 text-xs text-white focus:outline-none focus:border-green-500/50 transition-colors font-mono"
                                    placeholder="Hedef alan adını girin (Örn: tesla.com)"
                                    value={targetDomain}
                                    onChange={(e) => setTargetDomain(e.target.value)}
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={loadingSub || !targetDomain}
                                className="bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 hover:border-green-500/40 disabled:opacity-50 px-6 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                            >
                                {loadingSub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                Taramayı Başlat
                            </button>
                        </form>
                    </div>

                    {errorSub && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" />
                            {errorSub}
                        </motion.div>
                    )}

                    {resultsSub && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-[#080808] border border-white/10 rounded-lg p-6 flex flex-col min-h-0">
                            <div className="flex justify-between items-center mb-6 shrink-0">
                                <h3 className="text-xs font-bold text-white/80 uppercase tracking-widest flex items-center gap-2">
                                    <Network className="w-4 h-4 text-blue-500" /> Profil: {resultsSub.target}
                                </h3>
                                <div className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-3 py-1 rounded border border-blue-500/20">
                                    {resultsSub.subdomains.length} Varlık Bulundu
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {resultsSub.subdomains.map((sub, idx) => (
                                        <div key={idx} className="bg-[#050505] border border-white/5 p-3 rounded hover:border-blue-500/30 transition-colors group flex items-start justify-between">
                                            <div className="overflow-hidden">
                                                <div className="text-[11px] font-mono text-white/80 truncate" title={sub}>{sub}</div>
                                                <div className="text-[9px] text-white/30 uppercase mt-1">Subdomain</div>
                                            </div>
                                            <a href={`http://${sub}`} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Search className="w-3 h-3 text-blue-400 hover:text-blue-300" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                                {resultsSub.subdomains.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-32 text-white/30 text-xs">
                                        <Cpu className="w-8 h-8 mb-3 opacity-20" />
                                        CT Logları üzerinde bu alana ait bir varlık tespit edilemedi.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </>
            )}

            {activeTab === 'username' && (
                <>
                    <div className="bg-[#080808] border border-white/10 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-500/10 rounded">
                                <UserSearch className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white tracking-widest uppercase">Kullanıcı Adı Enumerasyonu</h2>
                                <p className="text-[10px] text-white/50 font-mono">Hedef kullanıcının farklı dijital platformlardaki varlığını sorgular.</p>
                            </div>
                        </div>

                        <form onSubmit={handleReconUser} className="flex gap-3">
                            <div className="flex-1 relative">
                                <UserSearch className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="text" 
                                    className="w-full bg-[#050505] border border-white/10 rounded px-9 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 transition-colors font-mono"
                                    placeholder="Hedef kullanıcı adını girin (Örn: john_doe)"
                                    value={targetUsername}
                                    onChange={(e) => setTargetUsername(e.target.value)}
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={loadingUser || !targetUsername}
                                className="bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 disabled:opacity-50 px-6 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                            >
                                {loadingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                Platform Tara
                            </button>
                        </form>
                    </div>

                    {errorUser && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" />
                            {errorUser}
                        </motion.div>
                    )}

                    {resultsUser && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-[#080808] border border-white/10 rounded-lg p-6 flex flex-col min-h-0">
                            <div className="flex justify-between items-center mb-6 shrink-0">
                                <h3 className="text-xs font-bold text-white/80 uppercase tracking-widest flex items-center gap-2">
                                    <Target className="w-4 h-4 text-purple-500" /> Profil: {resultsUser.target}
                                </h3>
                                <div className="text-[10px] font-mono bg-purple-500/10 text-purple-400 px-3 py-1 rounded border border-purple-500/20">
                                    {resultsUser.platforms.filter((p: any) => p.exists).length} Eşleşme
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {resultsUser.platforms.map((plat: any, idx: number) => (
                                        <div key={idx} className={`p-3 rounded border transition-colors flex items-center justify-between ${
                                            plat.exists ? 'bg-green-500/5 border-green-500/20' : 
                                            plat.error ? 'bg-orange-500/5 border-orange-500/20' : 
                                            'bg-[#050505] border-white/5 opacity-50'
                                        }`}>
                                            <div>
                                                <div className="text-[11px] font-bold text-white/80 flex items-center gap-1.5">
                                                    {plat.exists ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : 
                                                     plat.error ? <AlertCircle className="w-3.5 h-3.5 text-orange-400" /> :
                                                     <XCircle className="w-3.5 h-3.5 text-white/30" />
                                                    }
                                                    {plat.name}
                                                </div>
                                                <div className="text-[9px] text-white/40 mt-1">{plat.type}</div>
                                            </div>
                                            {plat.exists && (
                                                <a href={plat.url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-green-500/10 rounded text-green-400 hover:bg-green-500/20 transition-colors">
                                                    <Search className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </>
            )}

            {activeTab === 'network' && (
                <>
                    <div className="bg-[#080808] border border-white/10 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-yellow-500/10 rounded">
                                <Server className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white tracking-widest uppercase">Ağ & IP İstihbaratı</h2>
                                <p className="text-[10px] text-white/50 font-mono">Hedef Domain veya IP adresi hakkında DNS çözünümleme, lokasyon ve servis sağlayıcı verisi toplar.</p>
                            </div>
                        </div>

                        <form onSubmit={handleReconNet} className="flex gap-3">
                            <div className="flex-1 relative">
                                <Server className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="text" 
                                    className="w-full bg-[#050505] border border-white/10 rounded px-9 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500/50 transition-colors font-mono"
                                    placeholder="IP adresi veya Alan Adı (Örn: 8.8.8.8 veya tesla.com)"
                                    value={targetNetwork}
                                    onChange={(e) => setTargetNetwork(e.target.value)}
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={loadingNet || !targetNetwork}
                                className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 hover:border-yellow-500/40 disabled:opacity-50 px-6 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                            >
                                {loadingNet ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                Ağ Analizi Yap
                            </button>
                        </form>
                    </div>

                    {errorNet && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" />
                            {errorNet}
                        </motion.div>
                    )}

                    {resultsNet && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-[#080808] border border-white/10 rounded-lg p-6 flex flex-col min-h-0 gap-4 overflow-y-auto">
                            <div className="flex justify-between items-center shrink-0 border-b border-white/5 pb-4">
                                <h3 className="text-xs font-bold text-white/80 uppercase tracking-widest flex items-center gap-2">
                                    <Network className="w-4 h-4 text-yellow-500" /> Profil: {resultsNet.target}
                                </h3>
                                <div className="text-[10px] font-mono bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded border border-yellow-500/20">
                                    {resultsNet.isIp ? "IP Hedefi" : "Domain Hedefi"}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Geo & ISP Info */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] text-white/40 uppercase font-bold tracking-widest border-b border-white/5 pb-2">Lokasyon & İzleme</h4>
                                    {resultsNet.geo && resultsNet.geo.status === 'success' ? (
                                        <div className="bg-[#050505] border border-white/5 rounded-lg p-4 font-mono text-[11px] text-white/80 space-y-3">
                                            <div className="flex items-center gap-2 text-yellow-400">
                                                <MapPin className="w-4 h-4" /> 
                                                <span className="font-bold">{resultsNet.geo.city}, {resultsNet.geo.country}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                                                <div className="text-white/40">IP</div>
                                                <div>{resultsNet.geo.query}</div>
                                                <div className="text-white/40">ISP</div>
                                                <div className="truncate" title={resultsNet.geo.isp}>{resultsNet.geo.isp}</div>
                                                <div className="text-white/40">Organizasyon</div>
                                                <div className="truncate" title={resultsNet.geo.org}>{resultsNet.geo.org}</div>
                                                <div className="text-white/40">ASN</div>
                                                <div>{resultsNet.geo.as}</div>
                                                <div className="text-white/40">Kordinatlar</div>
                                                <div>{resultsNet.geo.lat}, {resultsNet.geo.lon}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-[#050505] border border-white/5 rounded-lg p-4 text-[10px] text-white/30 font-mono text-center">
                                            GeoIP verisi alınamadı.
                                        </div>
                                    )}
                                </div>

                                {/* DNS Info */}
                                {!resultsNet.isIp && resultsNet.dnsRecords && (
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] text-white/40 uppercase font-bold tracking-widest border-b border-white/5 pb-2">DNS Kayıtları (A, MX, TXT)</h4>
                                        <div className="bg-[#050505] border border-white/5 rounded-lg overflow-hidden font-mono text-[10px]">
                                            {/* A Records */}
                                            {resultsNet.dnsRecords.A && resultsNet.dnsRecords.A.length > 0 && (
                                                <div className="p-3 border-b border-white/5">
                                                    <div className="text-blue-400 font-bold mb-2 uppercase">A Kayıtları (IPv4)</div>
                                                    <ul className="space-y-1 text-white/70">
                                                        {resultsNet.dnsRecords.A.map((r: string, i: number) => <li key={i}>• {r}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                            {/* MX Records */}
                                            {resultsNet.dnsRecords.MX && resultsNet.dnsRecords.MX.length > 0 && (
                                                <div className="p-3 border-b border-white/5">
                                                    <div className="text-purple-400 font-bold mb-2 uppercase">MX Kayıtları (Mail)</div>
                                                    <ul className="space-y-1 text-white/70">
                                                        {resultsNet.dnsRecords.MX.map((r: string, i: number) => <li key={i}>• {r}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                            {/* TXT Records */}
                                            {resultsNet.dnsRecords.TXT && resultsNet.dnsRecords.TXT.length > 0 && (
                                                <div className="p-3">
                                                    <div className="text-green-400 font-bold mb-2 uppercase">TXT Kayıtları (SPF/DMARC)</div>
                                                    <ul className="space-y-2 text-white/50 break-words">
                                                        {resultsNet.dnsRecords.TXT.map((r: string, i: number) => <li key={i} className="line-clamp-2" title={r}>• {r}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                            {Object.values(resultsNet.dnsRecords).every((arr: any) => arr.length === 0) && (
                                                 <div className="p-4 text-white/30 text-center">DNS Kaydı bulunamadı.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </>
            )}
        </div>
    );
};
