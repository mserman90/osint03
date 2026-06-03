import { MATRIX, SENTIMENT_DICT, ENTITY_WATCHLIST, TR_PLACES } from './constants';
import { Entity, Place, SentimentResult, ReliabilityResult } from './types';

const NORM = (s: string) => s.toLocaleLowerCase("tr").replace(/i̇/g, "i").replace(/[^\\p{L}\\p{N}\\s]/gu, " ");

const INDEX = TR_PLACES.flatMap(p => [
  { key: NORM(p.name), place: p },
  ...(p.aliases || []).map(a => ({ key: NORM(a), place: p }))
]).sort((a, b) => b.key.length - a.key.length);

export function classifyText(text: string, mode: string): string {
  if (!text) return "İZLEME";
  const lower = text.toLocaleLowerCase("tr-TR");
  const matrix = MATRIX[mode as keyof typeof MATRIX];
  
  if (!matrix) return "İZLEME";

  if (matrix.KRİTİK.some((kw: string) => lower.includes(kw))) return "KRİTİK";
  if (matrix.YÜKSEK.some((kw: string) => lower.includes(kw))) return "YÜKSEK";
  if (matrix.ORTA.some((kw: string) => lower.includes(kw))) return "ORTA";
  
  return "İZLEME";
}

export function analyzeSentiment(text: string): SentimentResult {
  const lower = text.toLocaleLowerCase("tr-TR");
  let scores: Record<string, number> = { PANİK: 0, NEGATİF: 0, POZİTİF: 0 };
  
  Object.keys(SENTIMENT_DICT).forEach(cat => {
    (SENTIMENT_DICT as any)[cat].forEach((kw: string) => {
      const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${kw}([^\\p{L}\\p{N}]|$)`, "u");
      if (regex.test(lower)) scores[cat]++;
    });
  });

  if (scores.PANİK > 0) return { label: "PANİK", color: "bg-fuchsia-500/20 text-fuchsia-500 border-fuchsia-500/20" };
  if (scores.NEGATİF > scores.POZİTİF) return { label: "NEGATİF", color: "bg-red-500/20 text-red-500 border-red-500/20" };
  if (scores.POZİTİF > scores.NEGATİF) return { label: "POZİTİF", color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/20" };
  return { label: "NÖTR", color: "bg-white/10 text-white/40 border-white/10" };
}

export function extractEntities(text: string): Entity[] {
  if (!text) return [];
  const lowerText = text.toLocaleLowerCase("tr-TR");
  const found: Entity[] = [];
  
  // 1. Static Watchlist Extraction
  ENTITY_WATCHLIST.forEach(ent => {
    const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${ent.name.toLocaleLowerCase("tr-TR")}([^\\p{L}\\p{N}]|$)`, "u");
    if (regex.test(lowerText)) {
      found.push(ent);
    }
  });

  // 2. Regex-Based Digital Footprint Extraction
  // IPv4 Extraction
  const ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
  const ips = text.match(ipRegex) || [];
  ips.forEach(ip => {
      if (!found.some(e => e.name === ip)) {
          found.push({ name: ip, type: 'IP', riskLevel: 'ORTA' });
      }
  });

  // Email Extraction
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
  const emails = text.match(emailRegex) || [];
  emails.forEach(email => {
      if (!found.some(e => e.name === email)) {
          found.push({ name: email, type: 'EMAIL', riskLevel: 'DÜŞÜK' });
      }
  });

  // Domain Extraction (com, net, org, ru, ir, cn, kp)
  const domainRegex = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|ru|ir|cn|kp)\b/gi;
  const domains = text.match(domainRegex) || [];
  domains.forEach(domain => {
      const isEmailDomain = emails.some(e => e.includes(domain));
      if (!isEmailDomain && !found.some(e => e.name === domain)) {
          found.push({ name: domain, type: 'DOMAIN', riskLevel: 'DÜŞÜK' });
      }
  });

  // Crypto / Onion / Tech Handles
  const onionRegex = /\b[a-z2-7]{16,56}\.onion\b/gi;
  const onions = text.match(onionRegex) || [];
  onions.forEach(onion => {
      if (!found.some(e => e.name === onion)) {
          found.push({ name: onion, type: 'ONION_URL', riskLevel: 'KRİTİK' });
      }
  });

  return found;
}

export function getSourceReliability(source: string): ReliabilityResult {
  if (["TRTHABER", "NTV", "DÜNYA"].includes(source)) {
    return { code: "A", label: "Doğrulanmış (Majör Medya)", color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/20", weight: 1.0 };
  }
  if (source.includes("G-NEWS")) {
    return { code: "B", label: "Genellikle Güvenilir", color: "bg-blue-500/20 text-blue-500 border-blue-500/20", weight: 0.7 };
  }
  return { code: "C", label: "Doğrulanmamış (Açık Ağ)", color: "bg-orange-500/20 text-orange-500 border-orange-500/20", weight: 0.4 };
}

export function extractPlaces(text: string): Place[] {
  if (!text) return [];
  const norm = " " + NORM(text) + " ";
  const hits: Place[] = [];
  const seen = new Set<string>();
  
  for (const { key, place } of INDEX) {
    if (key.length < 3) continue;
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}\\p{N}]|$)`, "u");
    if (re.test(norm) && !seen.has(place.name)) {
      hits.push(place);
      seen.add(place.name);
    }
  }
  return hits;
}

export function calculateZScore(currentValue: number | null, historicalValues: number[]): string | number | null {
  if (currentValue === null || currentValue === undefined || !Array.isArray(historicalValues) || historicalValues.length === 0) return null;
  const n = historicalValues.length;
  const mean = historicalValues.reduce((sum, val) => sum + val, 0) / n;
  const variance = historicalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return currentValue > mean ? Infinity : 0;
  return ((currentValue - mean) / stdDev).toFixed(2);
}
