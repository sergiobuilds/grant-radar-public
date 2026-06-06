import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateEligibility, type UserState } from "./eligibility.ts";
import type { Grant } from "./types.ts";

const base = (p: Partial<Grant>): Grant => ({
  id: "x",
  source: "kstartup",
  sourceId: "1",
  title: "t",
  agency: "a",
  category: "사업화",
  applicantTypes: [],
  businessAge: [],
  region: "전국",
  applyStart: "",
  applyEnd: "",
  summary: "",
  detailUrl: "",
  attachments: [],
  raw: {},
  ...p,
});

const u: UserState = { applicantType: "일반기업", businessAgeYears: 3, region: "서울" };

test("대상 불일치는 불가", () => {
  const r = evaluateEligibility(base({ applicantTypes: ["예비창업자", "일반인"] }), u);
  assert.equal(r.verdict, "불가");
});

test("예비전용 공고는 기창업 3년차 불가", () => {
  const r = evaluateEligibility(
    base({ applicantTypes: ["일반기업"], businessAge: ["예비창업자", "1년미만"] }),
    u,
  );
  assert.equal(r.verdict, "불가");
});

test("타지역+소재지문구 있으면 불가", () => {
  const r = evaluateEligibility(
    base({ applicantTypes: ["일반기업"], region: "경기", raw: { aply_trgt_ctnt: "성남시 소재 기업" } }),
    u,
  );
  assert.equal(r.verdict, "불가");
});

test("타지역+소재지문구 없으면 확인필요(안 자름)", () => {
  const r = evaluateEligibility(
    base({ applicantTypes: ["일반기업"], region: "경기", raw: { aply_trgt_ctnt: "AI 기업" } }),
    u,
  );
  assert.equal(r.verdict, "확인필요");
});

test("전국+대상일치+업력OK는 가능", () => {
  const r = evaluateEligibility(
    base({ applicantTypes: ["일반기업", "1인 창조기업"], businessAge: ["5년미만", "7년미만"], region: "전국" }),
    u,
  );
  assert.equal(r.verdict, "가능");
});

test("대상 같은 기업가족 비일치는 불가 아닌 확인필요(거짓 불가 방지)", () => {
  const r = evaluateEligibility(base({ applicantTypes: ["일반기업"], region: "전국" }), { applicantType: "중소기업" });
  assert.equal(r.verdict, "확인필요");
});

test("대상 동의어 정규화: 스타트업→창업벤처 일치는 가능", () => {
  const r = evaluateEligibility(base({ applicantTypes: ["창업벤처"], region: "전국" }), { applicantType: "스타트업" });
  assert.equal(r.verdict, "가능");
});

test("대상 가족이 명확히 다르면 불가: 일반인 vs 기업공고", () => {
  const r = evaluateEligibility(base({ applicantTypes: ["일반기업"], region: "전국" }), { applicantType: "일반인" });
  assert.equal(r.verdict, "불가");
});
