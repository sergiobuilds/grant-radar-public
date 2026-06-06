import { readFile } from "node:fs/promises";

import { GrantJsonCache, refresh, type FieldCoverage } from "../packages/core/src/index.ts";

await loadEnvFile(".env");

const cache = new GrantJsonCache(".cache/grants.json");
const result = await refresh({
  cache,
  kStartup: {
    serviceKey: requireEnv("DATA_GO_KR_SERVICE_KEY"),
    page: numberEnv("KSTARTUP_PAGE", 1),
    perPage: numberEnv("KSTARTUP_PER_PAGE", 30),
  },
  bizinfo: {
    crtfcKey: requireEnv("BIZINFO_CRTFC_KEY"),
    searchCnt: numberEnv("BIZINFO_SEARCH_CNT", 30),
  },
});

for (const [source, stats] of Object.entries(result.bySource)) {
  console.log(
    `source=${source} fetched=${stats.fetched} stored=${stats.stored} active=${stats.active}`,
  );
}

console.log(
  `cache inserted=${result.cache.inserted} updated=${result.cache.updated} total=${result.cache.total}`,
);
console.log(`quality applicantTypes=${formatCoverage(result.quality.applicantTypes)}`);
console.log(`quality businessAge=${formatCoverage(result.quality.businessAge)}`);
console.log(`quality region=${formatCoverage(result.quality.region)}`);
console.log(
  `attachments grants=${result.attachments.withAttachments} files=${result.attachments.totalAttachments}`,
);
console.log(`expiredExcluded=${result.expiredExcludedCount}`);
const active = Object.keys(result.bySource);
const skipped = ["kstartup", "bizinfo", "msit", "mss"].filter((s) => !active.includes(s));
if (skipped.length) console.log(`skipped=${skipped.join(",")}`);

async function loadEnvFile(path: string): Promise<void> {
  try {
    const text = await readFile(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const rawValue = trimmed.slice(separator + 1).trim();
      if (!key || process.env[key]) continue;
      process.env[key] = unquote(rawValue);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
}

function unquote(value: string): string {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function numberEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatCoverage(coverage: FieldCoverage): string {
  const percentage = Math.round(coverage.rate * 1000) / 10;
  return `${coverage.filled}/${coverage.total} (${percentage}%)`;
}
