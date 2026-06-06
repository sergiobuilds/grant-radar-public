import type { CachedGrant } from "./types.ts";

// 소스-중립 콘텐츠 키: 제목+기관+마감을 공백·문장부호 제거 후 소문자화.
export function contentKey(g: CachedGrant): string {
  const norm = (s: string) => s.replace(/[\s\p{P}]/gu, "").toLowerCase();
  return `${norm(g.title)}|${norm(g.agency)}|${g.applyEnd}`;
}

// 같은 콘텐츠 키면 "더 풍부한" 1건만 남긴다(첨부 수 → 본문 길이 → id 사전순).
function richer(a: CachedGrant, b: CachedGrant): CachedGrant {
  if (a.attachments.length !== b.attachments.length)
    return a.attachments.length > b.attachments.length ? a : b;
  if (a.summary.length !== b.summary.length)
    return a.summary.length > b.summary.length ? a : b;
  return a.id <= b.id ? a : b;
}

export function dedupeGrants(grants: CachedGrant[]): CachedGrant[] {
  const best = new Map<string, CachedGrant>();
  for (const g of grants) {
    const k = contentKey(g);
    const cur = best.get(k);
    best.set(k, cur ? richer(cur, g) : g);
  }
  return [...best.values()];
}
