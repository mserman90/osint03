export interface Entity {
  name: string;
  type: string;
  riskLevel: string;
}

export interface Place {
  name: string;
  lat: number;
  lon: number;
  aliases?: string[];
}

export interface SentimentResult {
  label: string;
  color: string;
}

export interface ReliabilityResult {
  code: string;
  label: string;
  color: string;
  weight: number;
}

export interface Signal {
  id: string;
  source: string;
  title: string;
  link: string;
  pubDate: string;
  content: string;
  level: string;
  entities: Entity[];
  sentiment: SentimentResult;
  reliability: ReliabilityResult;
  places: Place[];
}

export interface AIBrief {
  dataAvailable: boolean;
  threatScore: number;
  threatLabel: string;
  headline: string;
  summary: string;
  trends: string[];
  recommendations: string[];
}
