import { test } from "node:test";
import assert from "node:assert/strict";
import { matchGrants, getGrant, draftApplication } from "./server.ts";

test("match_grants는 자격+fitPrompt를 가진 목록을 반환", async () => {
  const r = await matchGrants({
    state: { applicantType: "일반기업", businessAgeYears: 3, region: "서울" },
    capability: "AI",
    intent: "물류",
  });
  assert.ok(Array.isArray(r.grants));
  assert.equal(r.count, r.grants.length);
  if (r.grants[0]) {
    assert.ok("eligibility" in r.grants[0]);
    assert.ok("fitPrompt" in r.grants[0]);
    assert.notEqual(r.grants[0].eligibility.verdict, "불가");
  }
});

test("get_grant은 존재 id에 grant+formText 반환, 없으면 found=false", async () => {
  const list = await matchGrants({ state: {} });
  const id = list.grants[0]?.id;
  if (id) {
    const r = await getGrant({ id });
    assert.equal(r.found, true);
    if (r.found) assert.ok(typeof r.formText === "string");
  }
  const miss = await getGrant({ id: "nope:0" });
  assert.equal(miss.found, false);
});

test("draft_application은 draftPrompt 반환", async () => {
  const list = await matchGrants({ state: {} });
  const id = list.grants[0]?.id;
  if (id) {
    const r = await draftApplication({ id, userProfile: "3년차 법인" });
    assert.equal(r.found, true);
    if (r.found) assert.ok(r.draftPrompt.includes("[채울 자리]"));
  }
});
