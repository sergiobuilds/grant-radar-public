import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { GrantJsonCache, refresh } from "./index.ts";

test("refresh fetches both adapters, upserts grants, and returns coverage stats", async () => {
  const dir = await mkdtemp(join(tmpdir(), "grant-radar-refresh-"));
  try {
    const cache = new GrantJsonCache(join(dir, "grants.json"));

    const result = await refresh({
      cache,
      today: "2026-06-05",
      adapters: [
        {
          source: "kstartup",
          fetchGrants: async () => [
            {
              id: "kstartup:1",
              source: "kstartup",
              sourceId: "1",
              title: "K 공고",
              agency: "기관",
              category: "사업화",
              applicantTypes: ["예비창업자"],
              businessAge: ["3년미만"],
              region: "전국",
              applyStart: "2026-06-01",
              applyEnd: "2026-06-30",
              summary: "요약",
              detailUrl: "https://example.test/k",
              attachments: [{ name: "공고문.pdf", url: "https://example.test/file" }],
              raw: {},
            },
          ],
        },
        {
          source: "bizinfo",
          fetchGrants: async () => [
            {
              id: "bizinfo:2",
              source: "bizinfo",
              sourceId: "2",
              title: "B 공고",
              agency: "기관",
              category: "수출",
              applicantTypes: [],
              businessAge: [],
              region: "",
              applyStart: "2026-05-01",
              applyEnd: "2026-06-04",
              summary: "",
              detailUrl: "https://example.test/b",
              attachments: [],
              raw: {},
            },
          ],
        },
      ],
    });

    assert.deepEqual(result.bySource, {
      kstartup: { fetched: 1, stored: 1, active: 1 },
      bizinfo: { fetched: 1, stored: 1, active: 0 },
    });
    assert.equal(result.totalFetched, 2);
    assert.equal(result.cache.total, 2);
    assert.equal(result.activeCount, 1);
    assert.equal(result.expiredExcludedCount, 1);
    assert.equal(result.quality.applicantTypes.filled, 1);
    assert.equal(result.quality.businessAge.filled, 1);
    assert.equal(result.quality.region.filled, 1);
    assert.equal(result.attachments.withAttachments, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
