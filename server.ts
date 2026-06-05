import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.post("/api/generate-brief", async (req, res) => {
    try {
      const { signals, mode, threatScore, isCritical, threatLabel } = req.body;
      
      let summary = "";
      let recommendations: string[] = [];

      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("Missing AI Key");
        }
        
        const ai = new GoogleGenAI({ 
            apiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        
        const prompt = `Lütfen OSINT verilerine dayanarak Türkçe ve son derece profesyonel/resmi bir siber istihbarat özeti (Brief) oluştur.
Mod: ${mode.toUpperCase()}
Sinyal Sayısı: ${signals.length}
Tehdit Skoru: ${threatScore} (${threatLabel})
Kritik Durum: ${isCritical ? 'Evet' : 'Hayır'}
Sinyaller (Özetler):
${signals.slice(0, 15).map((s: any) => `- [${s.source}] ${s.title}`).join('\n')}

Lütfen yanıtını aşağıdaki formatta JSON olarak ver. Herhangi bir ekstra açıklama ekleme.
{
  "summary": "Kısa, net ve genel tabloyu anlatan bir parağraf.",
  "recommendations": ["Aksiyon 1", "Aksiyon 2"]
}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["summary", "recommendations"]
                }
            }
        });
        
        const aiData = JSON.parse(response.text?.trim() || "{}");
        if (aiData.summary) {
            summary = aiData.summary;
            recommendations = aiData.recommendations || [];
        }
      } catch (err: any) {
        const mockSummaries = [
            `Sistem, ${signals.length} farklı açık kaynak istihbarat kanalından veri topladı. Mevcut ${threatLabel} seviyesi dikkate alınarak, potansiyel zafiyetlere yönelik değerlendirmeler yapılmaktadır.`,
            `Son periyotta tespit edilen ${signals.length} olay, ${threatLabel} risk faktörü kapsamında değerlendirilmiştir. Siber istihbarat filtreleri aktif olarak çalışmaktadır.`,
            `Toplam ${signals.length} sinyal analiz edildi. Sistem genelinde ${threatLabel} seviyesinde hareketlilik gözlenmektedir.`
        ];
        summary = mockSummaries[Math.floor(Math.random() * mockSummaries.length)];
        
        let recs = [];
        if (isCritical) {
             recs = ['Acil Eylem Planı Devreye Alınmalı', 'İlgili Portları Erişime Kapatın', 'Sistem Yöneticilerini Bilgilendirin'];
        } else if (threatScore > 50) {
             recs = ['Güvenlik Duvarı Kurallarını Gözden Geçirin', 'Log İzlemeyi Artırın'];
        } else {
             recs = ['Rutin İzleme Devam Etmeli', 'Standart Sistem Taramalarını Sürdürün'];
        }
        
        if (!process.env.GEMINI_API_KEY) {
             summary += " (Yerel Analiz Modu)";
        }
        recommendations = recs;
      }

      const headline = `${mode.toUpperCase()} Alanında Gelişmeler`;
      const trends = ['Analiz', 'Veri Akışı'];

      res.json({
        dataAvailable: true,
        threatScore,
        threatLabel,
        headline,
        summary,
        trends,
        recommendations
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/enrich-entity", async (req, res) => {
    try {
        const { type, name } = req.body;
        
        let intelData: any = {};
        let isQuotaError = false;

        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error("Missing AI Key");
            
            const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
            
            let extraInstructions = "";
            let requiredFields: any = {
                 status: { type: Type.STRING },
                 tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            };

            if (type === 'IP') {
                extraInstructions = "IP adresleri için lokasyon, organizasyon/ISP tahmini, geçmiş tarama/bot aktivesi gibi sahte ama çok gerçekçi bir analiz oluştur.";
                requiredFields = {
                     status: { type: Type.STRING },
                     location: { type: Type.STRING },
                     isp: { type: Type.STRING },
                     tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                     reputation: { type: Type.STRING }
                };
            } else if (type === 'EMAIL') {
                extraInstructions = "E-postalar için Dark Web veya Pastebin üzerinde veri sızıntısı taraması sonuçlarının çok ciddi ve askeri dille (simüle edilmiş) tasvirini oluştur.";
                requiredFields = {
                     status: { type: Type.STRING },
                     breachCount: { type: Type.INTEGER },
                     breaches: { type: Type.ARRAY, items: { type: Type.STRING } },
                     tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                };
            } else if (type === 'ONION_URL') {
                extraInstructions = "Onion linkleri için yasadışı bir forum mu yoksa market mi olduğu varsayılan, Tor ağı bilgilerini içeren (uptime, sunucu lokasyonu tahmini) gerçekçi bir rapor oluştur.";
                requiredFields = {
                     status: { type: Type.STRING },
                     marketType: { type: Type.STRING },
                     relatedKeys: { type: Type.ARRAY, items: { type: Type.STRING } },
                     tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                };
            } else if (type === 'DOMAIN') {
                extraInstructions = "Domain (Alan Adı) için WHOIS kaydı özetleri, barındırma sağlayıcısı, yaş ve risk skorunu belirten analiz üret.";
                requiredFields = {
                     status: { type: Type.STRING },
                     registrar: { type: Type.STRING },
                     age: { type: Type.STRING },
                     tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                };
            } else {
                extraInstructions = "Bu varlık için genel profil ve OSINT bağlantılarını özetle.";
                requiredFields = {
                     status: { type: Type.STRING },
                     mentions: { type: Type.INTEGER },
                     tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                };
            }

            const prompt = `Sen profesyonel bir OSINT istihbarat sisteminin veritabanı simülasyonüsün. 
Aşağıdaki Varlık (Entity) için gelişmiş bir açık kaynak (veya deep/dark web) istihbarat sonucu oluştur:
Tür: ${type}
Değer: ${name}

Kurallar: ${extraInstructions}
Cevap yalnızca geçerli bir JSON objesi olacaktır. Şema ile birebir uyumlu, profesyonel dille (Türkçe) üretilecek.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: requiredFields,
                        required: Object.keys(requiredFields)
                    }
                }
            });
            
            // Generates dummy mention history (last 24 hours in 2h intervals)
            const mentionHistory = [];
            const now = new Date();
            let currentMentions = Math.floor(Math.random() * 5);
            for (let i = 24; i >= 0; i -= 2) {
                 const t = new Date(now.getTime() - i * 60 * 60 * 1000);
                 const timeStr = t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                 currentMentions = Math.max(0, currentMentions + Math.floor(Math.random() * 5) - 2);
                 mentionHistory.push({ time: timeStr, mentions: currentMentions });
            }

            intelData = JSON.parse(response.text?.trim() || "{}");
            intelData.mentionHistory = mentionHistory;

        } catch (err: any) {
            // Fallbacks as keyless local alternatives
            if (type === 'IP') {
                 intelData = {
                     location: "Kayıtlı Lokasyon (Yerel Tahmin)",
                     isp: "Yerel Ağ Sağlayıcısı",
                     reputation: "Düşük Risk",
                     status: "Aktif Düzenli İzleme",
                     tags: ["Bölgesel Ağ", "Standart Düğüm"]
                 };
            } else if (type === 'EMAIL') {
                 intelData = {
                     breachCount: 2,
                     breaches: ["Pastebin Dump (Geçmiş)", "Bilinmeyen Forum Sızıntısı"],
                     status: "Pasif İzlemede",
                     tags: ["Sızdırılmış Form", "Kimlik Avı Hedefi"]
                 };
            } else if (type === 'ONION_URL') {
                 intelData = {
                     marketType: "Karanlık Web Pazaryeri",
                     relatedKeys: ["PGP-ANON", "BTC-ADDRESS-MOCK"],
                     status: "Aktif (Zaman Zaman Kesinti)",
                     tags: ["Tor", "Dark Web", "Şifreli İletişim"]
                 };
            } else if (type === 'DOMAIN') {
                 intelData = {
                     registrar: "Gizlenmiş Kayıt",
                     age: "1 Yıl 4 Ay",
                     status: "Risk Değerlendirmesi Yapılıyor",
                     tags: ["Şüpheli Alan Adı", "DNS Değişikliği"]
                 };
            } else {
                 intelData = {
                     mentions: Math.floor(Math.random() * 10),
                     status: "Tarama Tamamlandı",
                     tags: ["Gözlem Altında"]
                 };
            }
            
            const mentionHistory = [];
            const now = new Date();
            let currentMentions = Math.floor(Math.random() * 5);
            for (let i = 24; i >= 0; i -= 2) {
                 const t = new Date(now.getTime() - i * 60 * 60 * 1000);
                 const timeStr = t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                 currentMentions = Math.max(0, currentMentions + Math.floor(Math.random() * 5) - 2);
                 mentionHistory.push({ time: timeStr, mentions: currentMentions });
            }
            intelData.mentionHistory = mentionHistory;
            if (!process.env.GEMINI_API_KEY) {
                intelData.status += " (Yerel Mod)";
            }
        }
        res.json(intelData);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/recon/crtsh", async (req, res) => {
    try {
        let domain = req.query.domain as string;
        if (!domain) return res.status(400).json({ error: "Domain required" });
        
        // Remove protocols or paths if user pasted a URL
        domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

        const response = await fetch(`https://crt.sh/?q=%25.${domain}&output=json`, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
            signal: AbortSignal.timeout(15000)
        });
        
        if (!response.ok) {
            return res.status(response.status).json({ error: "crt.sh returned an error" });
        }

        const data = await response.json();
        
        // Data format from crt.sh is an array of entries. We need to extract unique subdomains
        const subdomains = new Set<string>();
        data.forEach((entry: any) => {
            if (entry.name_value) {
                // name_value can contain multiple domains separated by newlines
                const names = entry.name_value.split('\n');
                names.forEach((name: string) => {
                    const cleanName = name.replace('*.', '').toLowerCase();
                    if (cleanName.includes(domain)) {
                        subdomains.add(cleanName);
                    }
                });
            }
        });

        res.json({ target: domain, subdomains: Array.from(subdomains) });
    } catch (err: any) {
         console.error("crt.sh proxy error:", err);
         res.status(500).json({ error: "Sonuç alınamadı veya zaman aşımı." });
    }
  });

  app.get("/api/recon/username", async (req, res) => {
    try {
        const username = req.query.user as string;
        if (!username) return res.status(400).json({ error: "Username required" });

        const platforms = [
            { name: "GitHub", url: `https://github.com/${username}`, type: "Developer/Code" },
            { name: "Reddit", url: `https://www.reddit.com/user/${username}/about.json`, type: "Social/Forum" },
            { name: "HackerNews", url: `https://hacker-news.firebaseio.com/v0/user/${username}.json`, type: "Tech/Forum" },
            { name: "Vimeo", url: `https://vimeo.com/${username}`, type: "Media/Video" },
            { name: "Linktree", url: `https://linktr.ee/${username}`, type: "Social/Links" },
            { name: "GitLab", url: `https://gitlab.com/${username}`, type: "Developer/Code" },
            { name: "Dev.to", url: `https://dev.to/${username}`, type: "Tech/Blog" },
            { name: "Medium", url: `https://medium.com/@${username}`, type: "Blog/Articles" }
        ];

        const results = await Promise.all(platforms.map(async (plat) => {
            try {
                const response = await fetch(plat.url, {
                    method: 'GET',
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
                    signal: AbortSignal.timeout(6000)
                });
                
                let exists = false;
                if (plat.name === "HackerNews") {
                     const data = await response.json();
                     exists = data !== null && data.id !== undefined;
                } else if (plat.name === "Reddit") {
                     const data = await response.json();
                     exists = !data.error && !data.message;
                } else {
                     exists = response.status === 200;
                }
                
                return { name: plat.name, url: plat.url, exists, type: plat.type };
            } catch (err) {
                return { name: plat.name, url: plat.url, exists: false, error: true, type: plat.type };
            }
        }));

        res.json({ target: username, platforms: results });
    } catch (err: any) {
         console.error("username recon error:", err);
         res.status(500).json({ error: "Sonuç alınamadı veya zaman aşımı." });
    }
  });

  app.get("/api/recon/network", async (req, res) => {
    try {
        const target = req.query.target as string;
        if (!target) return res.status(400).json({ error: "Target required" });

        const isIp = /^[0-9\.]+$/.test(target);
        let ips = [target];
        const dnsRecords = {
            A: [] as string[],
            MX: [] as string[],
            TXT: [] as string[]
        };

        if (!isIp) {
            try {
                const aRes = await fetch(`https://dns.google/resolve?name=${target}&type=A`);
                const aData = await aRes.json();
                if (aData.Answer) {
                    dnsRecords.A = aData.Answer.map((a: any) => a.data);
                    ips = aData.Answer.filter((a: any) => a.type === 1).map((a: any) => a.data);
                }
                
                const mxRes = await fetch(`https://dns.google/resolve?name=${target}&type=MX`);
                const mxData = await mxRes.json();
                if (mxData.Answer) {
                    dnsRecords.MX = mxData.Answer.map((a: any) => a.data);
                }

                const txtRes = await fetch(`https://dns.google/resolve?name=${target}&type=TXT`);
                const txtData = await txtRes.json();
                if (txtData.Answer) {
                    dnsRecords.TXT = txtData.Answer.map((a: any) => a.data);
                }
            } catch (e) {
                console.warn("DNS resolution error", e);
            }
        }

        let geo = null;
        if (ips.length > 0 && ips[0]) {
            try {
                const geoRes = await fetch(`http://ip-api.com/json/${ips[0]}`);
                geo = await geoRes.json();
            } catch (e) {
                console.warn("GeoIP resolving error", e);
            }
        }

        res.json({ target, isIp, ips, dnsRecords, geo });
    } catch (err: any) {
         console.error("network recon error:", err);
         res.status(500).json({ error: "Ağ bilgisi analiz edilemedi." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
