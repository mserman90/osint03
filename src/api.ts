import { FEEDS, CORS_PROXIES } from './constants';
import { analyzeSentiment, extractEntities, getSourceReliability, classifyText, extractPlaces } from './utils';
import { Signal, AIBrief } from './types';

async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
  let retries = 0;
  while (retries <= maxRetries) {
    try {
      const res = await fetch(url, { ...options, headers: { "User-Agent": "Mozilla/5.0 OSINT-System/6.0", ...options.headers } });
      if (res.ok) return res;
      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        let waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, retries) * 1000;
        await new Promise(r => setTimeout(r, waitTime));
        retries++;
        continue;
      }
      throw new Error(`HTTP Hata: \${res.status}`);
    } catch (error) {
      if (retries === maxRetries) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, retries) * 1000));
      retries++;
    }
  }
  throw new Error("Maksimum istek deneme sayısına ulaşıldı.");
}

export async function fetchOsintData(mode: string, customFeeds?: { name: string, url: string }[]): Promise<{ dataAvailable: boolean; items?: Signal[] }> {
  try {
    const feedsToUse = customFeeds || FEEDS;
    const results = await Promise.all(feedsToUse.map(async (feed) => {
        for(const proxy of CORS_PROXIES) {
            try {
                const res = await fetchWithRetry(proxy(feed.url), {}, 1);
                const isAllOrigins = proxy(feed.url).includes('allorigins.win');
                
                if (isAllOrigins) {
                    const data = await res.json();
                    if (data.contents) {
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(data.contents, "text/xml");
                        const itemsObj = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 20).map(item => ({
                            title: item.querySelector("title")?.textContent || "",
                            link: item.querySelector("link")?.textContent || "",
                            pubDate: item.querySelector("pubDate")?.textContent || new Date().toISOString(),
                            description: item.querySelector("description")?.textContent || ""
                        }));
                        if (itemsObj.length > 0) {
                            return { source: feed.name, items: itemsObj, success: true };
                        }
                    }
                } else {
                    const data = await res.json();
                    if (data.status === "ok" && Array.isArray(data.items)) {
                        return { source: feed.name, items: data.items.slice(0, 20), success: true };
                    }
                }
            } catch(e) {
                console.warn(`Feed fetch failed for \${feed.name}`, e);
            }
        }
        return { source: feed.name, items: [], success: false };
    }));
    
    const items: Signal[] = results
      .filter(r => r.success)
      .flatMap(r => (r.items as any[]).map(it => {
        const titleAndDesc = `\${it.title || ''} \${it.description || ''}`;
        return {
          id: `\${r.source}-\${it.link}`.slice(0, 100),
          source: r.source,
          title: it.title,
          link: it.link,
          pubDate: it.pubDate,
          content: it.description || '',
          level: classifyText(titleAndDesc, mode),
          entities: extractEntities(titleAndDesc),
          sentiment: analyzeSentiment(titleAndDesc),
          reliability: getSourceReliability(r.source),
          places: extractPlaces(titleAndDesc)
        };
      }));
    
    // Sinyalleri risk seviyesi ve tarihlerine göre azalan şekilde sırala
    items.sort((a, b) => {
      const levelWeight = { "KRİTİK": 4, "YÜKSEK": 3, "ORTA": 2, "İZLEME": 1 } as Record<string, number>;
      if (levelWeight[a.level] !== levelWeight[b.level]) {
          return levelWeight[b.level] - levelWeight[a.level];
      }
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });

    return { dataAvailable: true, items };
  } catch (err) {
    console.error("OSINT Veri Çekme Hatası:", err);
    return { dataAvailable: false };
  }
}

export async function generateAIBrief(items: Signal[], mode: string): Promise<AIBrief> {
    const totalSignals = items.length;
    let threatScore = 0;
    
    if (totalSignals > 0) {
        const criticalCount = items.filter(item => item.level === "KRİTİK").length;
        const highCount = items.filter(item => item.level === "YÜKSEK").length;
        const mediumCount = items.filter(item => item.level === "ORTA").length;
        
        let sum = 0;
        sum += criticalCount * 15;
        sum += highCount * 10;
        sum += mediumCount * 5;
        sum += items.filter(item => item.sentiment.label === "PANİK").length * 20;
        
        const avg = sum / totalSignals;
        const baseScore = Math.min(100, Math.floor(avg * 10));
        
        threatScore = baseScore + (totalSignals > 50 ? 5 : 0);
        threatScore = Math.min(100, Math.max(10, threatScore));
    }
    
    const isCritical = items.some(item => item.level === "KRİTİK" || item.sentiment.label === "PANİK");
    const threatLabel = threatScore > 85 ? 'KRİTİK' : threatScore > 65 ? 'YÜKSEK' : threatScore > 40 ? 'ORTA' : 'DÜŞÜK';
    
    try {
        const response = await fetch("/api/generate-brief", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                signals: items,
                mode,
                threatScore,
                isCritical,
                threatLabel
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data && data.headline) {
               return data as AIBrief;
            }
        }
    } catch (e) {
        console.error("AI Brief Proxy Hatası:", e);
    }
    
    return { 
        dataAvailable: true, 
        threatScore, 
        threatLabel, 
        headline: `${mode.toUpperCase()} Alanında Gelişmeler`, 
        summary: `Açıklama: Toplam ${items.length} sinyal analiz edildi. Gözlenen hareketlilik: ${threatLabel}.`, 
        trends: ['Analiz', 'Veri Akışı'], 
        recommendations: [isCritical ? 'Acil Eylem Planı Devreye Alınmalı' : 'Rutin İzleme Devam Etmeli'] 
    };
}
