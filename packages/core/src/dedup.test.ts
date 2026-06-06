import { test } from "node:test";
import assert from "node:assert/strict";
import { dedupeGrants, contentKey } from "./dedup.ts";
import type { CachedGrant } from "./types.ts";

function cg(p: Partial<CachedGrant>): CachedGrant {
  return {
    id: "x", source: "bizinfo", sourceId: "x", title: "", agency: "", category: "",
    applicantTypes: [], businessAge: [], region: "", applyStart: "", applyEnd: "",
    summary: "", detailUrl: "", attachments: [], raw: {}, isExpired: false, cachedAt: "", ...p,
  };
}

test("contentKey: 공백·문장부호 무시하고 같은 공고면 같은 키", () => {
  const a = cg({ title: "2026년 청년창업 지원사업", agency: "중기부", applyEnd: "20260630" });
  const b = cg({ title: "2026년  청년창업 지원사업!", agency: "중기부", applyEnd: "20260630" });
  assert.equal(contentKey(a), contentKey(b));
});

test("dedupeGrants: 중복 2건 → 첨부 많은 쪽 1건으로 병합", () => {
  const poor = cg({ id: "bizinfo:1", title: "청년창업", agency: "중기부", applyEnd: "20260630", attachments: [] });
  const rich = cg({ id: "msit:9", title: "청년창업", agency: "중기부", applyEnd: "20260630", attachments: [{ name: "공고문", url: "u" }] });
  const out = dedupeGrants([poor, rich]);
  assert.equal(out.length, 1);
  assert.equal(out[0].id, "msit:9");
});

test("dedupeGrants: 다른 공고는 보존", () => {
  const a = cg({ id: "a", title: "A", agency: "x", applyEnd: "20260101" });
  const b = cg({ id: "b", title: "B", agency: "y", applyEnd: "20260101" });
  assert.equal(dedupeGrants([a, b]).length, 2);
});
