import type { Attachment, Grant } from "../types.ts";
import {
  absoluteUrl,
  asArray,
  decodeHtmlText,
  encodeKeyForQuery,
  fetchJson,
  fetchText,
  queryString,
  type FetchLike,
} from "../utils.ts";
import { normalizeKStartupGrant, type KStartupRaw } from "../normalize.ts";

const KSTARTUP_API =
  "https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01";
const KSTARTUP_BASE = "https://www.k-startup.go.kr/";

export interface KStartupAdapterOptions {
  serviceKey: string;
  page?: number;
  perPage?: number;
  fetcher?: FetchLike;
}

export async function fetchKStartupGrants(
  options: KStartupAdapterOptions,
): Promise<Grant[]> {
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 30;
  const fetcher = options.fetcher ?? fetch;
  const url = buildKStartupApiUrl(options.serviceKey, page, perPage);
  const payload = await fetchJson<unknown>(url, fetcher);
  const rows = extractKStartupRows(payload);

  return Promise.all(
    rows.map(async (row) => {
      const sourceId = String(row.pbanc_sn ?? "").trim();
      const detailUrl = String(row.detl_pg_url ?? "").trim() || kStartupFallbackDetailUrl(sourceId);
      const attachments = await fetchKStartupAttachments(detailUrl, fetcher);
      return normalizeKStartupGrant({ ...row, detl_pg_url: detailUrl }, attachments);
    }),
  );
}

export function buildKStartupApiUrl(
  serviceKey: string,
  page: number,
  perPage: number,
): string {
  const params = queryString({
    page,
    perPage,
    returnType: "json",
  });
  return `${KSTARTUP_API}?serviceKey=${encodeKeyForQuery(serviceKey)}&${params}`;
}

export function kStartupFallbackDetailUrl(sourceId: string): string {
  const params = queryString({
    schM: "view",
    pbancSn: sourceId,
  });
  return `${KSTARTUP_BASE}web/contents/bizpbanc-ongoing.do?${params}`;
}

export async function fetchKStartupAttachments(
  detailUrl: string,
  fetcher: FetchLike = fetch,
): Promise<Attachment[]> {
  if (!detailUrl) return [];
  try {
    const html = await fetchText(detailUrl, fetcher);
    return extractKStartupAttachmentsFromHtml(html);
  } catch {
    return [];
  }
}

export function extractKStartupAttachmentsFromHtml(html: string): Attachment[] {
  const attachments: Attachment[] = [];
  const linkPattern = /<a\b[^>]*href=["']([^"']*\/afile\/fileDownload\/[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(linkPattern)) {
    const href = match[1] ?? "";
    const label = decodeHtmlText(match[2] ?? "");
    attachments.push({
      name: label || inferKStartupAttachmentName(href, attachments.length + 1),
      url: absoluteUrl(href, KSTARTUP_BASE),
    });
  }

  const seen = new Set<string>();
  return attachments.filter((attachment) => {
    if (!attachment.url || seen.has(attachment.url)) return false;
    seen.add(attachment.url);
    return true;
  });
}

function extractKStartupRows(payload: unknown): KStartupRaw[] {
  const root = payload as Record<string, unknown>;
  if (Array.isArray(root.data)) return root.data as KStartupRaw[];

  const response = root.response as Record<string, unknown> | undefined;
  const body = response?.body as Record<string, unknown> | undefined;
  const items = body?.items as Record<string, unknown> | undefined;
  if (items && "item" in items) return asArray<KStartupRaw>(items.item);
  if (body && "items" in body) return asArray<KStartupRaw>(body.items);
  return [];
}

function inferKStartupAttachmentName(href: string, index: number): string {
  try {
    const url = new URL(href, KSTARTUP_BASE);
    return url.searchParams.get("fileNm") ?? `attachment-${index}`;
  } catch {
    return `attachment-${index}`;
  }
}
