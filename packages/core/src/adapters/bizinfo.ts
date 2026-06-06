import type { Grant } from "../types.ts";
import {
  asArray,
  encodeKeyForQuery,
  fetchJson,
  queryString,
  type FetchLike,
} from "../utils.ts";
import { normalizeBizinfoGrant, type BizinfoRaw } from "../normalize.ts";

const BIZINFO_API = "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do";

export interface BizinfoAdapterOptions {
  crtfcKey: string;
  searchCnt?: number;
  fetcher?: FetchLike;
}

export async function fetchBizinfoGrants(
  options: BizinfoAdapterOptions,
): Promise<Grant[]> {
  const fetcher = options.fetcher ?? fetch;
  const searchCnt = options.searchCnt ?? 30;
  const url = buildBizinfoApiUrl(options.crtfcKey, searchCnt);
  const payload = await fetchJson<unknown>(url, fetcher);
  return extractBizinfoRows(payload).map((row) => normalizeBizinfoGrant(row));
}

export function buildBizinfoApiUrl(crtfcKey: string, searchCnt: number): string {
  const params = queryString({
    dataType: "json",
    searchCnt,
  });
  return `${BIZINFO_API}?crtfcKey=${encodeKeyForQuery(crtfcKey)}&${params}`;
}

function extractBizinfoRows(payload: unknown): BizinfoRaw[] {
  const root = payload as Record<string, unknown>;
  const jsonArray = root.jsonArray as Record<string, unknown> | unknown[] | undefined;

  if (Array.isArray(jsonArray)) return jsonArray as BizinfoRaw[];
  if (jsonArray && typeof jsonArray === "object" && "item" in jsonArray) {
    return asArray<BizinfoRaw>((jsonArray as Record<string, unknown>).item);
  }
  if ("item" in root) return asArray<BizinfoRaw>(root.item);
  return [];
}
