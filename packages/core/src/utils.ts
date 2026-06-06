import type { Attachment } from "./types.ts";

export const USER_AGENT =
  "grant-radar/0.1 (+https://github.com/svvys/grant-radar)";

export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function splitList(value: unknown): string[] {
  return toText(value)
    .split(/[,，]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function normalizeYyyymmdd(value: unknown): string {
  const raw = toText(value).replace(/\D/g, "");
  if (raw.length !== 8) return "";
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

export function parseBeginEndDate(value: unknown): { start: string; end: string } {
  const raw = toText(value);
  const matches = raw.match(/\d{8}/g) ?? [];
  return {
    start: normalizeYyyymmdd(matches[0] ?? ""),
    end: normalizeYyyymmdd(matches[1] ?? matches[0] ?? ""),
  };
}

export function todayKst(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function isExpired(applyEnd: string, today = todayKst()): boolean {
  if (!applyEnd) return false;
  return applyEnd < today;
}

export function encodeKeyForQuery(key: string): string {
  return /%[0-9a-fA-F]{2}/.test(key) ? key : encodeURIComponent(key);
}

export function queryString(params: Record<string, string | number | undefined>): string {
  const pairs: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return pairs.join("&");
}

export function redactUrl(url: string): string {
  return url
    .replace(/([?&]serviceKey=)[^&]+/gi, "$1[redacted]")
    .replace(/([?&]crtfcKey=)[^&]+/gi, "$1[redacted]");
}

export async function fetchJson<T>(
  url: string,
  fetcher: FetchLike = fetch,
): Promise<T> {
  const response = await fetcher(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${redactUrl(url)}: ${text.slice(0, 300)}`);
  }
  return JSON.parse(text) as T;
}

export async function fetchText(
  url: string,
  fetcher: FetchLike = fetch,
): Promise<string> {
  const response = await fetcher(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": USER_AGENT,
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${redactUrl(url)}: ${text.slice(0, 300)}`);
  }
  return text;
}

export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") return [value as T];
  return [];
}

export function absoluteUrl(value: string, base: string): string {
  const raw = value.trim();
  if (!raw) return "";
  return new URL(raw, base).toString();
}

export function dedupeAttachments(attachments: Attachment[]): Attachment[] {
  const seen = new Set<string>();
  const result: Attachment[] = [];
  for (const attachment of attachments) {
    if (!attachment.url || seen.has(attachment.url)) continue;
    seen.add(attachment.url);
    result.push(attachment);
  }
  return result;
}

export function decodeHtmlText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export class GrantNormalizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GrantNormalizationError";
  }
}

export function requiredField(value: unknown, fieldName: string): string {
  const text = toText(value);
  if (!text) throw new GrantNormalizationError(`Missing required grant field: ${fieldName}`);
  return text;
}
