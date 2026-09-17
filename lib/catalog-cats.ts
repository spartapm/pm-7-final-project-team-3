export type CatalogCatKind = "service" | "benefit";

export type CatalogCategory = {
  id: number;
  kind: CatalogCatKind;
  name: string;
  sortOrder: number;
  appVisible: boolean;
  linkedCount?: number;
};

export type CatalogCategoryRow = {
  category_id: number;
  kind: CatalogCatKind;
  name: string;
  sort_order: number;
  app_visible: boolean;
};

export function rowToCategory(row: CatalogCategoryRow, linkedCount = 0): CatalogCategory {
  return {
    id: Number(row.category_id),
    kind: row.kind === "benefit" ? "benefit" : "service",
    name: String(row.name || ""),
    sortOrder: Number(row.sort_order) || 0,
    appVisible: row.app_visible !== false,
    linkedCount,
  };
}

export function numIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  const seen = new Set<number>();
  for (const item of raw) {
    const n = Number(item);
    if (!Number.isInteger(n) || n <= 0 || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

export const DEFAULT_BENEFIT_FILTERS = [
  "전체",
  "통신사 결합",
  "일상·생활",
  "엔터",
  "생성형 AI",
  "일·학습",
  "카드 혜택",
] as const;

export const DEFAULT_SERVICE_CATS = [
  "OTT·영상",
  "음악·오디오",
  "생성형 AI",
  "디자인·콘텐츠 제작",
  "업무·생산성",
  "콘텐츠·웹툰·전자책",
  "교육·학습",
  "쇼핑·멤버십",
  "배달·생활",
  "게임",
  "SNS·커뮤니케이션",
  "스포츠·운동",
  "자동차·모빌리티",
  "클라우드·보안",
  "기타",
] as const;

export const DEFAULT_BENEFIT_CATS = [
  "통신사 결합",
  "일상·생활",
  "엔터",
  "생성형 AI",
  "일·학습",
  "카드 혜택",
] as const;
