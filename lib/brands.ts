import type { Category } from "./types";

export type BrandMeta = {
  file: string;
  name: string;
  category: Category;
  color: string;
  aliases: string[];
  amount?: number;
};

export const BRANDS: BrandMeta[] = [
  { file: "netflix", name: "Netflix", category: "ott", color: "#E50914", aliases: ["넷플", "넷플릭스", "netflix"], amount: 17000 },
  { file: "youtube", name: "YouTube Premium", category: "ott", color: "#FF0000", aliases: ["유튜브", "유튜브 프리미엄", "유튜브프리미엄", "유튭", "youtube", "yt"], amount: 14900 },
  { file: "disney", name: "Disney+", category: "ott", color: "#113CCF", aliases: ["디즈니", "disneyplus", "disney+", "디즈니플러스"], amount: 9900 },
  { file: "tving", name: "티빙", category: "ott", color: "#FF153C", aliases: ["tving", "티빙"], amount: 9500 },
  { file: "chatgpt", name: "ChatGPT", category: "ai", color: "#10A37F", aliases: ["챗지피티", "챗gpt", "gpt", "openai"], amount: 29000 },
  { file: "spotify", name: "Spotify", category: "music", color: "#1ED760", aliases: ["스포티", "스포티파이", "spotify"], amount: 11900 },
  { file: "melon", name: "멜론", category: "music", color: "#00CD3C", aliases: ["melon", "멜론"], amount: 10900 },
  { file: "naver", name: "네이버플러스", category: "membership", color: "#03C75A", aliases: ["네이버", "naver", "네이버플러스"], amount: 4900 },
  { file: "coupang", name: "쿠팡와우", category: "shopping", color: "#E47422", aliases: ["쿠팡", "coupang", "와우", "쿠팡와우"], amount: 7890 },
  { file: "baemin", name: "배민클럽", category: "delivery", color: "#2AC1BC", aliases: ["배민", "baemin", "배달의민족"], amount: 3990 },
  { file: "canva", name: "Canva Pro", category: "design", color: "#7C6FEF", aliases: ["캔바", "canva"], amount: 13000 },
  { file: "icloud", name: "iCloud+", category: "cloud", color: "#3693F3", aliases: ["아이클라우드", "icloud"], amount: 4300 },
  { file: "adobe", name: "Adobe", category: "design", color: "#FF0000", aliases: ["어도비", "creative cloud", "adobe"], amount: 89000 },
  { file: "apple", name: "Apple One", category: "membership", color: "#111111", aliases: ["애플", "apple one", "애플원"], amount: 12900 },
  { file: "applearcade", name: "Apple Arcade", category: "game", color: "#FF375F", aliases: ["애플아케이드", "apple arcade"], amount: 6500 },
  { file: "applemusic", name: "Apple Music", category: "music", color: "#FC3C44", aliases: ["애플뮤직", "apple music"], amount: 8900 },
  { file: "appletv", name: "Apple TV+", category: "ott", color: "#111111", aliases: ["애플티비", "apple tv", "appletv"], amount: 6500 },
  { file: "bluehands", name: "블루핸즈", category: "mobility", color: "#0033A0", aliases: ["bluehands"] },
  { file: "bugs", name: "Bugs", category: "music", color: "#E31C79", aliases: ["벅스"] },
  { file: "cakeplus", name: "케이크플러스", category: "edu", color: "#FF6B00", aliases: ["cake", "케이크"] },
  { file: "capcut", name: "CapCut", category: "design", color: "#111111", aliases: ["캡컷"] },
  { file: "chzzk", name: "치지직", category: "ott", color: "#00FFA3", aliases: ["chzzk"] },
  { file: "class101", name: "클래스101", category: "edu", color: "#FF5A00", aliases: ["class101"] },
  { file: "claude", name: "Claude", category: "ai", color: "#D97757", aliases: ["클로드", "anthropic"] },
  { file: "coupangsports", name: "쿠팡플레이 스포츠", category: "sports", color: "#E47422", aliases: ["쿠팡스포츠"] },
  { file: "crunchyroll", name: "Crunchyroll", category: "ott", color: "#F47521", aliases: ["크런치롤"] },
  { file: "cursor", name: "Cursor", category: "productivity", color: "#111111", aliases: [] },
  { file: "discord", name: "Discord", category: "sns", color: "#5865F2", aliases: ["디스코드"] },
  { file: "duolingo", name: "Duolingo", category: "edu", color: "#58CC02", aliases: ["듀오링고"] },
  { file: "eaplay", name: "EA Play", category: "game", color: "#FF4747", aliases: ["ea"] },
  { file: "elevenlabs", name: "ElevenLabs", category: "ai", color: "#111111", aliases: [] },
  { file: "epik", name: "에픽", category: "design", color: "#6C5CE7", aliases: ["epik"] },
  { file: "figma", name: "Figma", category: "design", color: "#111111", aliases: ["피그마"] },
  { file: "filmora", name: "Filmora", category: "design", color: "#4158D0", aliases: ["필모라"] },
  { file: "finalcut", name: "Final Cut Pro", category: "design", color: "#111111", aliases: ["파이널컷"] },
  { file: "gamma", name: "Gamma", category: "productivity", color: "#111111", aliases: [] },
  { file: "gemini", name: "Gemini", category: "ai", color: "#4285F4", aliases: ["제미니"] },
  { file: "genspark", name: "Genspark", category: "ai", color: "#111111", aliases: [] },
  { file: "goodnotes", name: "Goodnotes", category: "productivity", color: "#E5A000", aliases: ["굿노트"] },
  { file: "grok", name: "Grok", category: "ai", color: "#111111", aliases: ["그록"] },
  { file: "gta+", name: "GTA+", category: "game", color: "#FCAF17", aliases: ["gta"] },
  { file: "hancom", name: "한컴독스", category: "productivity", color: "#0078D4", aliases: ["한컴"] },
  { file: "higgsfield", name: "Higgsfield", category: "ai", color: "#111111", aliases: [] },
  { file: "inflearn", name: "인프런", category: "edu", color: "#00C471", aliases: ["inflearn"] },
  { file: "insta", name: "Instagram", category: "sns", color: "#E1306C", aliases: ["인스타", "instagram"] },
  { file: "kakaotalk", name: "카카오톡", category: "sns", color: "#FEE500", aliases: ["카카오", "kakao"] },
  { file: "kakaowebtoon", name: "카카오웹툰", category: "webtoon", color: "#111111", aliases: [] },
  { file: "kiaconnect", name: "Kia Connect", category: "mobility", color: "#05141F", aliases: ["기아"] },
  { file: "klingai", name: "Kling AI", category: "ai", color: "#111111", aliases: ["클링"] },
  { file: "kurly", name: "컬리", category: "shopping", color: "#5F0080", aliases: ["kurly"] },
  { file: "laftel", name: "라프텔", category: "ott", color: "#7B5CFA", aliases: ["laftel"] },
  { file: "linkdin", name: "LinkedIn", category: "sns", color: "#0A66C2", aliases: ["링크드인", "linkedin"] },
  { file: "lovable", name: "Lovable", category: "productivity", color: "#FF6B6B", aliases: [] },
  { file: "manus", name: "Manus", category: "ai", color: "#111111", aliases: [] },
  { file: "meitu", name: "Meitu", category: "design", color: "#FF2D55", aliases: ["메이투"] },
  { file: "millie", name: "밀리의 서재", category: "webtoon", color: "#FF6B00", aliases: ["밀리", "millie"] },
  { file: "miricanvas", name: "미리캔버스", category: "design", color: "#00C3A5", aliases: [] },
  { file: "mlbtv", name: "MLB.TV", category: "sports", color: "#041E42", aliases: ["mlb"] },
  { file: "nintendo", name: "Nintendo Switch Online", category: "game", color: "#E60012", aliases: ["닌텐도"] },
  { file: "nordvpn", name: "NordVPN", category: "cloud", color: "#4687FF", aliases: ["노드"] },
  { file: "notion", name: "Notion", category: "productivity", color: "#111111", aliases: ["노션"] },
  { file: "office365", name: "Microsoft 365", category: "productivity", color: "#D83B01", aliases: ["오피스", "office"] },
  { file: "perplexity", name: "Perplexity", category: "ai", color: "#20808D", aliases: ["퍼플렉시티"] },
  { file: "pixiv", name: "pixiv", category: "webtoon", color: "#0096FA", aliases: ["픽시브"] },
  { file: "plang", name: "플랭", category: "edu", color: "#111111", aliases: ["plang"] },
  { file: "polaris", name: "폴라리스 오피스", category: "productivity", color: "#1A73E8", aliases: ["폴라리스"] },
  { file: "primevideo", name: "Prime Video", category: "ott", color: "#00A8E1", aliases: ["프라임", "아마존"] },
  { file: "psshop", name: "PlayStation Plus", category: "game", color: "#003087", aliases: ["플스", "ps", "플레이스테이션"], amount: 7900 },
  { file: "publy", name: "퍼블리", category: "edu", color: "#111111", aliases: ["publy"] },
  { file: "qanda", name: "콴다", category: "edu", color: "#00D68F", aliases: ["qanda"] },
  { file: "quat", name: "Quat", category: "other", color: "#111111", aliases: [] },
  { file: "qubuz", name: "Qobuz", category: "music", color: "#111111", aliases: ["코buz", "qobuz"] },
  { file: "ridi", name: "리디", category: "webtoon", color: "#1E9EFF", aliases: ["ridibooks"] },
  { file: "samsungaiclub", name: "삼성 AI 클럽", category: "membership", color: "#1428A0", aliases: ["삼성"] },
  { file: "scribd", name: "Scribd", category: "webtoon", color: "#1E7B74", aliases: [] },
  { file: "serieson", name: "시리즈온", category: "ott", color: "#03C75A", aliases: [] },
  { file: "shinsegae", name: "신세계", category: "shopping", color: "#111111", aliases: [] },
  { file: "slack", name: "Slack", category: "sns", color: "#4A154B", aliases: ["슬랙"] },
  { file: "snow", name: "SNOW", category: "sns", color: "#FF2E63", aliases: ["스노우"] },
  { file: "soop", name: "SOOP", category: "ott", color: "#00D46A", aliases: ["숲", "아프리카"] },
  { file: "spotv", name: "SPOTV NOW", category: "sports", color: "#E31C23", aliases: ["스포티비"] },
  { file: "suno", name: "Suno", category: "ai", color: "#111111", aliases: [] },
  { file: "terabox", name: "TeraBox", category: "cloud", color: "#1A73E8", aliases: [] },
  { file: "tesla", name: "Tesla", category: "mobility", color: "#CC0000", aliases: ["테슬라"] },
  { file: "tidal", name: "TIDAL", category: "music", color: "#111111", aliases: ["타이달"] },
  { file: "tinder", name: "Tinder", category: "sns", color: "#FE3C72", aliases: ["틴더"] },
  { file: "toss", name: "토스", category: "membership", color: "#0064FF", aliases: ["toss"] },
  { file: "tuzupass", name: "투쥬패스", category: "membership", color: "#111111", aliases: [] },
  { file: "updf", name: "UPDF", category: "productivity", color: "#E21A23", aliases: [] },
  { file: "watcha", name: "왓챠", category: "ott", color: "#FF0558", aliases: ["watcha", "왓차"], amount: 7900 },
  { file: "wave", name: "웨이브", category: "ott", color: "#0D0D0D", aliases: ["wavve", "wave", "웨이브"], amount: 7900 },
  { file: "welaaa", name: "윌라", category: "webtoon", color: "#FF6A00", aliases: ["welaaa"] },
  { file: "wps", name: "WPS Office", category: "productivity", color: "#C31111", aliases: [] },
  { file: "x", name: "X Premium", category: "sns", color: "#111111", aliases: ["트위터", "twitter"] },
  { file: "xbox", name: "Xbox Game Pass", category: "game", color: "#107C10", aliases: ["엑스박스", "게임패스"], amount: 21900 },
  { file: "yogiyo", name: "요기요", category: "delivery", color: "#FA0050", aliases: ["yogiyo"] },
  { file: "zep", name: "Zep", category: "sns", color: "#5B5FFF", aliases: [] },
  { file: "zwift", name: "Zwift", category: "sports", color: "#F15A29", aliases: [] },
];

function compact(s: string) {
  return s.toLowerCase().replace(/[\s._+\-]/g, "").replace(/premium|plus|pro|클럽|와우|멤버십|프리미엄|플러스/g, "");
}

export function brandIcon(name: string): string | undefined {
  const raw = name.trim();
  if (!raw) return undefined;
  const n = compact(raw);
  if (!n) return undefined;
  for (const b of BRANDS) {
    const keys = [b.name, b.file, ...b.aliases].map(compact).filter(Boolean);
    if (keys.includes(n)) return `/icons/brands/${b.file}.png`;
  }
  for (const b of BRANDS) {
    const keys = [b.name, b.file, ...b.aliases].map(compact).filter((k) => k.length >= 2);
    if (keys.some((k) => n.includes(k) || k.includes(n))) return `/icons/brands/${b.file}.png`;
  }
  return undefined;
}

export function findBrandExact(name: string): BrandMeta | undefined {
  const n = compact(name);
  if (!n) return undefined;
  return BRANDS.find((b) => {
    const keys = [b.name, b.file, ...b.aliases].map(compact).filter(Boolean);
    return keys.includes(n);
  });
}

export function findBrand(name: string): BrandMeta | undefined {
  const exact = findBrandExact(name);
  if (exact) return exact;
  const n = compact(name);
  if (!n) return undefined;
  return BRANDS.find((b) => {
    const keys = [b.name, b.file, ...b.aliases].map(compact).filter(Boolean);
    return keys.some((k) => k.length >= 2 && (n.includes(k) || k.includes(n)));
  });
}
