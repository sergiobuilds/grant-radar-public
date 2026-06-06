import { dirname } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";

import type { CachedGrant, Grant, UpsertStats } from "./types.ts";
import { isExpired, todayKst } from "./utils.ts";
import { dedupeGrants } from "./dedup.ts";

interface CacheFile {
  grants: CachedGrant[];
}

export class GrantJsonCache {
  constructor(private readonly filePath = ".cache/grants.json") {}

  async upsert(grants: Grant[], today = todayKst()): Promise<UpsertStats> {
    const existing = await this.readMap(today);
    let inserted = 0;
    let updated = 0;
    const cachedAt = new Date().toISOString();

    for (const grant of grants) {
      if (existing.has(grant.id)) {
        updated += 1;
      } else {
        inserted += 1;
      }
      existing.set(grant.id, this.toCachedGrant(grant, today, cachedAt));
    }

    await this.write([...existing.values()]);
    return {
      inserted,
      updated,
      total: existing.size,
    };
  }

  async listAll(today = todayKst()): Promise<CachedGrant[]> {
    const all = [...(await this.readMap(today)).values()].sort(compareCachedGrant);
    return dedupeGrants(all).sort(compareCachedGrant);
  }

  async listActive(today = todayKst()): Promise<CachedGrant[]> {
    return (await this.listAll(today)).filter((grant) => !grant.isExpired);
  }

  private async readMap(today: string): Promise<Map<string, CachedGrant>> {
    const file = await this.readFile();
    const map = new Map<string, CachedGrant>();
    for (const grant of file.grants) {
      map.set(grant.id, {
        ...grant,
        isExpired: isExpired(grant.applyEnd, today),
      });
    }
    return map;
  }

  private async readFile(): Promise<CacheFile> {
    try {
      const text = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(text) as Partial<CacheFile>;
      return { grants: Array.isArray(parsed.grants) ? parsed.grants : [] };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return { grants: [] };
      throw error;
    }
  }

  private async write(grants: CachedGrant[]): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const payload: CacheFile = { grants: grants.sort(compareCachedGrant) };
    await writeFile(this.filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  }

  private toCachedGrant(grant: Grant, today: string, cachedAt: string): CachedGrant {
    return {
      ...grant,
      isExpired: isExpired(grant.applyEnd, today),
      cachedAt,
    };
  }
}

function compareCachedGrant(a: CachedGrant, b: CachedGrant): number {
  return a.source.localeCompare(b.source) || a.sourceId.localeCompare(b.sourceId);
}
