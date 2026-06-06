import { fetchBizinfoGrants } from "./adapters/bizinfo.ts";
import { fetchKStartupGrants } from "./adapters/kstartup.ts";
import { fetchMsitGrants } from "./adapters/msit.ts";
import { fetchMssGrants } from "./adapters/mss.ts";
import { GrantJsonCache } from "./cache.ts";
import type {
  CachedGrant,
  FetchAdapter,
  FieldCoverage,
  Grant,
  RefreshResult,
} from "./types.ts";
import { todayKst } from "./utils.ts";

export interface RefreshOptions {
  cache?: GrantJsonCache;
  today?: string;
  adapters?: FetchAdapter[];
  kStartup?: {
    serviceKey: string;
    page?: number;
    perPage?: number;
  };
  bizinfo?: {
    crtfcKey: string;
    searchCnt?: number;
  };
}

export async function refresh(options: RefreshOptions = {}): Promise<RefreshResult> {
  const today = options.today ?? todayKst();
  const cache = options.cache ?? new GrantJsonCache();
  const adapters = options.adapters ?? buildDefaultAdapters(options);

  const fetchedBySource = new Map<string, Grant[]>();
  for (const adapter of adapters) {
    fetchedBySource.set(adapter.source, await adapter.fetchGrants());
  }

  const allFetched = [...fetchedBySource.values()].flat();
  const cacheStats = await cache.upsert(allFetched, today);
  const allCached = await cache.listAll(today);
  const active = allCached.filter((grant) => !grant.isExpired);
  const bySource: RefreshResult["bySource"] = {};

  for (const [source, grants] of fetchedBySource) {
    const cachedForSource = allCached.filter((grant) => grant.source === source);
    const activeForSource = cachedForSource.filter((grant) => !grant.isExpired);
    bySource[source] = {
      fetched: grants.length,
      stored: cachedForSource.length,
      active: activeForSource.length,
    };
  }

  return {
    bySource,
    totalFetched: allFetched.length,
    cache: cacheStats,
    activeCount: active.length,
    expiredExcludedCount: allCached.length - active.length,
    quality: {
      applicantTypes: coverage(allCached, (grant) => grant.applicantTypes.length > 0),
      businessAge: coverage(allCached, (grant) => grant.businessAge.length > 0),
      region: coverage(allCached, (grant) => Boolean(grant.region)),
    },
    attachments: {
      withAttachments: allCached.filter((grant) => grant.attachments.length > 0).length,
      totalAttachments: allCached.reduce(
        (sum, grant) => sum + grant.attachments.length,
        0,
      ),
    },
  };
}

function buildDefaultAdapters(options: RefreshOptions): FetchAdapter[] {
  const serviceKey = options.kStartup?.serviceKey ?? process.env.DATA_GO_KR_SERVICE_KEY;
  const crtfcKey = options.bizinfo?.crtfcKey ?? process.env.BIZINFO_CRTFC_KEY;

  if (!serviceKey) throw new Error("DATA_GO_KR_SERVICE_KEY is required");
  if (!crtfcKey) throw new Error("BIZINFO_CRTFC_KEY is required");

  return [
    {
      source: "kstartup",
      fetchGrants: () =>
        fetchKStartupGrants({
          serviceKey,
          page: options.kStartup?.page,
          perPage: options.kStartup?.perPage,
        }),
    },
    {
      source: "bizinfo",
      fetchGrants: () =>
        fetchBizinfoGrants({
          crtfcKey,
          searchCnt: options.bizinfo?.searchCnt,
        }),
    },
    {
      source: "msit",
      fetchGrants: () => fetchMsitGrants({ serviceKey }),
    },
    {
      source: "mss",
      fetchGrants: () => fetchMssGrants({ serviceKey }),
    },
  ];
}

function coverage(
  grants: CachedGrant[],
  isFilled: (grant: CachedGrant) => boolean,
): FieldCoverage {
  const total = grants.length;
  const filled = grants.filter(isFilled).length;
  return {
    filled,
    total,
    rate: total === 0 ? 0 : filled / total,
  };
}
