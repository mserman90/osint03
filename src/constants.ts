export const DORKS = {
  guvenlik: `("saldırı" OR "operasyon" OR "patlama" OR "şehit") (twitter OR telegram OR sondakika)`,
  ekonomik: `("enflasyon" OR "kriz" OR "iflas" OR "zam") (ekonomi OR borsa OR bloomberg)`,
  finansal: `("döviz" OR "devalüasyon" OR "faiz" OR "çakıldı") (finans OR investing OR tcmb)`,
  politik: `("istifa" OR "erken seçim" OR "yaptırım" OR "kriz") (siyaset OR meclis OR t24)`,
  sosyal: `("protesto" OR "eylem" OR "isyan" OR "grev") (gundem OR eksisozluk OR twitter)`
};

export const SEARX_INSTANCES = ["https://searx.be", "https://searx.work", "https://search.mdosch.de", "https://paulgo.io"];

export const FEEDS = [
  { name: "TRTHABER", url: "https://www.trthaber.com/sondakika.rss" },
  { name: "NTV", url: "https://www.ntv.com.tr/son-dakika.rss" },
  { name: "DÜNYA", url: "https://www.dunya.com/rss?dunya" }
];

export const MATRIX = {
  guvenlik: {
    KRİTİK: ["saldırı", "patlama", "bombalı", "şehit", "terör", "suikast", "rehine", "katliam", "savaş", "hava harekatı"],
    YÜKSEK: ["operasyon", "pkk", "deaş", "fetö", "tutuklama", "gözaltı", "silahlı", "çatışma", "istihbarat", "mit", "tsk", "sınır ötesi"],
    ORTA: ["soruşturma", "kaçakçılık", "uyuşturucu", "organize suç", "infaz", "cinayet", "mafya", "siber"],
    İZLEME: ["polis", "jandarma", "asayiş", "güvenlik", "mahkeme", "sınır", "göçmen"],
  },
  ekonomik: {
    KRİTİK: ["tedarik kriz", "kıtlık", "ambargo", "karaborsa", "hiperenflasyon", "ekonomik çöküş", "iflas dalgası"],
    YÜKSEK: ["enflasyon", "zam", "işsizlik", "üretim durdu", "asgari ücret", "büyüme", "daralma", "resesyon", "kriz"],
    ORTA: ["vergi", "bütçe", "ihracat", "ithalat", "ticaret açığı", "teşvik", "sanayi", "tarım"],
    İZLEME: ["ekonomi", "piyasa", "şirket", "kâr", "zarar", "ticaret", "üretim"],
  },
  finansal: {
    KRİTİK: ["devalüasyon", "moratoryum", "bankrupt", "panik satış", "döviz krizi", "sermaye kontrolü", "banka iflası", "kara liste"],
    YÜKSEK: ["faiz", "dolar", "euro", "tcmb", "merkez bankası", "rezerv", "dış borç", "kur", "altın", "borsa çakıldı", "cds"],
    ORTA: ["tahvil", "kredi", "not indirimi", "rating", "hisse", "endeks", "bist", "spk", "bddk"],
    İZLEME: ["finans", "yatırım", "fon", "halka arz", "portföy", "mevduat"],
  },
  politik: {
    KRİTİK: ["darbe", "muhtıra", "hükümet düştü", "istifa", "diplomatik kriz", "büyükelçi", "yaptırım", "siyasi kriz"],
    YÜKSEK: ["erken seçim", "anayasa", "meclis", "parlamento", "veto", "gensoru", "boykot", "kabine revizyonu", "siyasi yasak"],
    ORTA: ["seçim", "parti", "milletvekili", "yasa tasarısı", "diplomasi", "müzakere", "zirve", "ikili ilişki"],
    İZLEME: ["politika", "bakan", "kurultay", "toplantı", "demeç", "açıklama", "ziyaret"],
  },
  sosyal: {
    KRİTİK: ["isyan", "ayaklanma", "salgın", "karantina", "göç dalgası", "yağma", "iç savaş", "kaos", "sıkıyönetim"],
    YÜKSEK: ["protesto", "grev", "eylem", "mülteci", "sığınmacı", "hastalık", "afet", "deprem", "toplumsal olay"],
    ORTA: ["yürüyüş", "sendika", "iş bırakma", "hak arama", "demografi", "kutlama", "gerginlik", "kaza"],
    İZLEME: ["toplum", "halk", "sosyal medya", "eğitim", "sağlık", "kültür", "etkinlik"],
  }
};

export const ENTITY_WATCHLIST = [
  { name: "PKK", type: "Örgüt", riskLevel: "HIGH" },
  { name: "DEAŞ", type: "Örgüt", riskLevel: "HIGH" },
  { name: "FETÖ", type: "Örgüt", riskLevel: "HIGH" },
  { name: "YPG", type: "Örgüt", riskLevel: "HIGH" },
  { name: "Hizbullah", type: "Örgüt", riskLevel: "HIGH" },
  { name: "MİT", type: "Kurum", riskLevel: "MODERATE" },
  { name: "TSK", type: "Kurum", riskLevel: "MODERATE" },
  { name: "Emniyet", type: "Kurum", riskLevel: "MODERATE" },
  { name: "TCMB", type: "Kurum", riskLevel: "MODERATE" },
  { name: "Merkez Bankası", type: "Kurum", riskLevel: "MODERATE" },
  { name: "BİST", type: "Kurum", riskLevel: "MODERATE" },
  { name: "BDDK", type: "Kurum", riskLevel: "MODERATE" },
  { name: "SPK", type: "Kurum", riskLevel: "MODERATE" },
  { name: "Pentagon", type: "Kurum", riskLevel: "MODERATE" },
  { name: "CIA", type: "Kurum", riskLevel: "MODERATE" },
  { name: "NATO", type: "Kurum", riskLevel: "MODERATE" }
];

export const SENTIMENT_DICT = {
  PANİK: ["çöküş", "katliam", "kan gölü", "mahvoldu", "tükendi", "felaket", "kıyamet", "panik", "şok", "korkunç", "kabus"],
  NEGATİF: ["kriz", "düştü", "zarar", "saldırı", "ölüm", "tehlike", "uyarı", "risk", "endişe", "kaza", "gerginlik", "zam", "enflasyon", "kötü", "geriledi"],
  POZİTİF: ["büyüme", "kâr", "başarı", "kurtarıldı", "çözüm", "anlaşma", "yükseliş", "olumlu", "destek", "yardım", "kazanç", "iyi", "arttı"]
};

export const TR_PLACES = [
  { name: "Adana", lat: 37.0, lon: 35.32 }, { name: "Ankara", lat: 39.93, lon: 32.86 },
  { name: "Antalya", lat: 36.9, lon: 30.71 }, { name: "Bursa", lat: 40.18, lon: 29.07 },
  { name: "Diyarbakır", lat: 37.91, lon: 40.24, aliases: ["Diyarbakir"] }, { name: "Erzurum", lat: 39.9, lon: 41.27 },
  { name: "Eskişehir", lat: 39.78, lon: 30.52 }, { name: "Gaziantep", lat: 37.07, lon: 37.38, aliases: ["Antep"] },
  { name: "Hatay", lat: 36.4, lon: 36.34, aliases: ["Antakya", "İskenderun"] }, { name: "İstanbul", lat: 41.01, lon: 28.98, aliases: ["Istanbul"] },
  { name: "İzmir", lat: 38.42, lon: 27.14, aliases: ["Izmir"] }, { name: "Kayseri", lat: 38.73, lon: 35.48 },
  { name: "Kahramanmaraş", lat: 37.58, lon: 36.93, aliases: ["Maraş"] }, { name: "Trabzon", lat: 41.0, lon: 39.72 },
  { name: "Van", lat: 38.49, lon: 43.41 },
  { name: "Suriye", lat: 35.0, lon: 38.0, aliases: ["Syria", "Halep", "Şam", "İdlib"] },
  { name: "Irak", lat: 33.3, lon: 44.4, aliases: ["Iraq", "Bağdat", "Musul", "Erbil", "Kandil"] },
  { name: "İran", lat: 32.0, lon: 53.0, aliases: ["Tahran"] }, { name: "ABD", lat: 38.9, lon: -77.0, aliases: ["Amerika", "Washington"] },
  { name: "Rusya", lat: 55.7, lon: 37.6, aliases: ["Moskova"] }, { name: "İsrail", lat: 31.0, lon: 35.0, aliases: ["Tel Aviv", "Gazze", "Filistin"] }
];

export const CORS_PROXIES = [
  (url: string) => `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
];
