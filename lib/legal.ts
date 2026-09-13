import data from "./legal-data.json";

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "quote"; text: string };

export type LegalDoc = {
  title: string;
  badge: string;
  lead: string;
  articles: { title: string; blocks: LegalBlock[] }[];
};

export type LegalKey = "age" | "terms" | "privacy" | "ai" | "share" | "marketing" | "transfer" | "permissions";

export const LEGAL = data as Record<LegalKey, LegalDoc>;

export const LEGAL_INDEX: { key: LegalKey; label: string }[] = [
  { key: "age", label: "만 14세 이상 확인" },
  { key: "terms", label: "틈 서비스 이용약관" },
  { key: "privacy", label: "개인정보 수집·이용 동의서" },
  { key: "ai", label: "AI 음성·이미지 분석 이용 동의서" },
  { key: "share", label: "공동 캘린더 개인정보 제3자 제공 동의서" },
  { key: "marketing", label: "마케팅 정보 수신 동의서" },
  { key: "transfer", label: "개인정보 국외 이전 안내·동의서" },
  { key: "permissions", label: "앱 접근권한 안내문" },
];

export function isLegalKey(v: string | null | undefined): v is LegalKey {
  return Boolean(v && v in LEGAL);
}
