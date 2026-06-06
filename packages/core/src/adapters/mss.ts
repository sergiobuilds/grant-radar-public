import { XMLParser } from "fast-xml-parser";
import type { Grant } from "../types.ts";
import { encodeKeyForQuery, fetchText, queryString, asArray, type FetchLike } from "../utils.ts";
import { normalizeMssGrant, isOpenCall, type MssRaw } from "../normalize.ts";

const MSS_API = "https://apis.data.go.kr/1421000/mssBizService_v2/getbizList_v2";
const parser = new XMLParser({ ignoreAttributes: true });

export interface MssAdapterOptions {
  serviceKey: string;
  pageNo?: number;
  numOfRows?: number;
  fetcher?: FetchLike;
}

export async function fetchMssGrants(options: MssAdapterOptions): Promise<Grant[]> {
  const fetcher = options.fetcher ?? fetch;
  const url = buildMssApiUrl(options.serviceKey, options.pageNo ?? 1, options.numOfRows ?? 30);
  const xml = await fetchText(url, fetcher);
  return extractMssRows(xml)
    .map((row) => normalizeMssGrant(row))
    .filter((grant) => isOpenCall(grant.title));
}

export function buildMssApiUrl(serviceKey: string, pageNo: number, numOfRows: number): string {
  const params = queryString({ pageNo, numOfRows });
  return `${MSS_API}?serviceKey=${encodeKeyForQuery(serviceKey)}&${params}`;
}

export function extractMssRows(xml: string): MssRaw[] {
  const doc = parser.parse(xml) as Record<string, any>;
  const item = doc?.response?.body?.items?.item;
  return asArray<MssRaw>(item);
}
