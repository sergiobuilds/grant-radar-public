import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { GrantJsonCache, type Grant } from "./index.ts";

const baseGrant: Grant = {
  id: "kstartup:1",
  source: "kstartup",
  sourceId: "1",
  title: "지원사업",
  agency: "기관",
  category: "사업화",
  applicantTypes: [],
  businessAge: [],
  region: "",
  applyStart: "2026-06-01",
  applyEnd: "2026-06-30",
  summary: "",
  detailUrl: "",
  attachments: [],
  raw: {},
};

test("upserts grants by id and excludes expired records from active queries", async () => {
  const dir = await mkdtemp(join(tmpdir(), "grant-radar-cache-"));
  try {
    const cache = new GrantJsonCache(join(dir, "grants.json"));

    const stats = await cache.upsert([
      baseGrant,
      { ...baseGrant, title: "갱신", summary: "latest" },
      {
        ...baseGrant,
        id: "bizinfo:2",
        source: "bizinfo",
        sourceId: "2",
        applyEnd: "2026-06-04",
      },
    ]);

    assert.deepEqual(stats, { inserted: 2, updated: 1, total: 2 });

    const all = await cache.listAll();
    assert.equal(all.length, 2);
    assert.equal(all.find((grant) => grant.id === "kstartup:1")?.title, "갱신");

    const active = await cache.listActive("2026-06-05");
    assert.deepEqual(active.map((grant) => grant.id), ["kstartup:1"]);
    assert.equal(active[0]?.isExpired, false);

    const expired = all.find((grant) => grant.id === "bizinfo:2");
    assert.equal(expired?.isExpired, true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("listAll: 소스 간 중복(제목·기관·마감 동일)을 1건으로 병합", async () => {
  const dir = await mkdtemp(join(tmpdir(), "grant-radar-dedup-"));
  try {
    const cache = new GrantJsonCache(join(dir, "grants.json"));
    await cache.upsert([
      { ...baseGrant, id: "bizinfo:1", source: "bizinfo", sourceId: "1", title: "청년창업", agency: "중기부", applyEnd: "2026-06-30", attachments: [] },
      { ...baseGrant, id: "msit:9", source: "msit", sourceId: "9", title: "청년창업", agency: "중기부", applyEnd: "2026-06-30", attachments: [{ name: "공고문", url: "u" }] },
    ], "2026-06-01");
    const all = await cache.listAll("2026-06-01");
    assert.equal(all.length, 1);
    assert.equal(all[0].id, "msit:9"); // 첨부 많은 쪽
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
