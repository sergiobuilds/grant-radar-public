import { GrantJsonCache } from "../packages/core/src/cache.ts";
import { evaluateEligibility } from "../packages/core/src/eligibility.ts";
const cache = new GrantJsonCache(".cache/grants.json");
const all = await cache.listActive();
const u = { applicantType: "일반기업", businessAgeYears: 3, region: "서울" };
const tally: Record<string, number> = { 가능: 0, 불가: 0, 확인필요: 0 };
const reasons: Record<string, number> = {};
for (const g of all) {
  const r = evaluateEligibility(g, u);
  tally[r.verdict]++;
  for (const x of r.reasons) reasons[x] = (reasons[x] ?? 0) + 1;
}
console.log(`프로필=일반기업/3년/서울, 활성공고 ${all.length}건`);
console.log("판정:", tally);
console.log("사유 분포:", reasons);
