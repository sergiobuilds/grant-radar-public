import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFitPrompt, buildDraftPrompt } from "./harness.ts";
import type { Grant } from "./types.ts";

const g = { title: "GPU 지원", summary: "AI모델 고도화", category: "사업화" } as Grant;

test("fit 프롬프트에 역량·의도·할인지시 포함", () => {
  const p = buildFitPrompt({ grant: g, capability: "AI/물류", intent: "수요예측 SaaS" });
  assert.ok(p.includes("AI/물류"));
  assert.ok(p.includes("수요예측 SaaS"));
  assert.ok(p.includes("상/중/하"));
  assert.ok(p.includes("수식어"));
});

test("draft 프롬프트에 근거규칙·[채울 자리] 포함", () => {
  const p = buildDraftPrompt({ grant: g, formText: "1. 사업목적", userProfile: "3년차 법인" });
  assert.ok(p.includes("[채울 자리]"));
  assert.ok(p.includes("공고문"));
  assert.ok(p.includes("지어내지"));
});

test("fit 프롬프트에 값있나·준비물 판정 포함(§2(3) 약속)", () => {
  const p = buildFitPrompt({ grant: { title: "x", category: "c", summary: "s" } as any, capability: "역량", intent: "의도" });
  assert.ok(p.includes("값있나"));
  assert.ok(p.includes("준비물"));
  assert.ok(p.includes("상/중/하"));
});
