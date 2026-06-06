import type { Grant } from "../types.ts";
import { encodeKeyForQuery, fetchJson, queryString, type FetchLike } from "../utils.ts";
import { normalizeMsitGrant, isOpenCall, type MsitRaw } from "../normalize.ts";

const MSIT_API =
  "https://apis.data.go.kr/1721000/msitannouncementinfo/businessAnnouncMentList";

export interface MsitAdapterOptions {
  serviceKey: string;
  pageNo?: number;
  numOfRows?: number;
  fetcher?: FetchLike;
}

export async function fetchMsitGrants(options: MsitAdapterOptions): Promise<Grant[]> {
  const fetcher = options.fetcher ?? fetch;
  const url = buildMsitApiUrl(options.serviceKey, options.pageNo ?? 1, options.numOfRows ?? 30);
  const payload = await fetchJson<unknown>(url, fetcher);
  return extractMsitRows(payload)
    .map((row) => normalizeMsitGrant(row))
    .filter((grant) => isOpenCall(grant.title)); // 모집만(선정결과 등 제외)
}

export function buildMsitApiUrl(serviceKey: string, pageNo: number, numOfRows: number): string {
  const params = queryString({ returnType: "json", pageNo, numOfRows });
  return `${MSIT_API}?serviceKey=${encodeKeyForQuery(serviceKey)}&${params}`;
}

// 응답 구조: { response: [ {header}, {body:{items:[{item:{...}}]}} ] }
function extractMsitRows(payload: unknown): MsitRaw[] {
  const root = payload as Record<string, unknown>;
  const response = root.response;
  const blocks = Array.isArray(response) ? response : response ? [response] : [];
  for (const block of blocks) {
    const body = (block as Record<string, unknown>)?.body as Record<string, unknown> | undefined;
    const items = body?.items;
    if (Array.isArray(items)) {
      return items
        .map((entry) => (entry as Record<string, unknown>)?.item ?? entry)
        .filter(Boolean) as MsitRaw[];
    }
  }
  return [];
}
