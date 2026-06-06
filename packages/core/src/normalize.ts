import type { Attachment, Grant } from "./types.ts";
import {
  absoluteUrl,
  asArray,
  dedupeAttachments,
  normalizeYyyymmdd,
  parseBeginEndDate,
  requiredField,
  splitList,
  toText,
} from "./utils.ts";

export type KStartupRaw = Record<string, unknown>;
export type BizinfoRaw = Record<string, unknown>;
export type MsitRaw = Record<string, unknown>;

// 과기부 businessAnnouncMentList: 선정결과·평가결과 등 비-모집 공고를 제외(모집만).
export function isOpenCall(title: string): boolean {
  return !/결과|선정\s*기업|선정\s*완료|지정\s*기관/.test(title);
}

interface MsitFile {
  file?: { fileName?: unknown; fileUrl?: unknown };
}

export function normalizeMsitGrant(row: MsitRaw): Grant {
  const viewUrl = toText(row.viewUrl);
  const nttSeqNo = viewUrl.match(/nttSeqNo=(\d+)/)?.[1];
  const sourceId = nttSeqNo ?? requiredField(row.subject, "subject");
  return {
    id: `msit:${sourceId}`,
    source: "msit",
    sourceId,
    title: toText(row.subject),
    agency: "과학기술정보통신부",
    category: "R&D",
    applicantTypes: [],
    businessAge: [],
    region: "",
    applyStart: normalizeYyyymmdd(row.pressDt),
    applyEnd: "",
    summary: "",
    detailUrl: viewUrl,
    attachments: buildMsitAttachments(row),
    raw: { ...row },
  };
}

export type MssRaw = Record<string, unknown>;

export function normalizeMssGrant(row: MssRaw): Grant {
  const sourceId = requiredField(row.itemId, "itemId");
  return {
    id: `mss:${sourceId}`,
    source: "mss",
    sourceId,
    title: toText(row.title),
    agency: "중소벤처기업부",
    category: "",
    applicantTypes: [],
    businessAge: [],
    region: "",
    applyStart: normalizeYyyymmdd(row.applicationStartDate),
    applyEnd: normalizeYyyymmdd(row.applicationEndDate),
    summary: toText(row.dataContents),
    detailUrl: toText(row.viewUrl),
    attachments: buildMssAttachments(row),
    raw: { ...row },
  };
}

// 중기부는 fileName/fileUrl이 형제 반복 요소 → 인덱스로 짝짓는다.
function buildMssAttachments(row: MssRaw): Attachment[] {
  const names = asArray<unknown>(row.fileName).map(toText);
  const urls = asArray<unknown>(row.fileUrl).map(toText);
  const attachments = urls
    .map((url, i) => (url ? { name: names[i] || "첨부", url } : null))
    .filter((a): a is Attachment => a !== null);
  return dedupeAttachments(attachments);
}

function buildMsitAttachments(row: MsitRaw): Attachment[] {
  const files = Array.isArray(row.files) ? (row.files as MsitFile[]) : [];
  const attachments = files
    .map((f) => {
      const url = toText(f.file?.fileUrl);
      if (!url) return null;
      return { name: toText(f.file?.fileName) || "첨부", url };
    })
    .filter((a): a is Attachment => a !== null);
  return dedupeAttachments(attachments);
}

export function normalizeKStartupGrant(
  row: KStartupRaw,
  attachments: Attachment[] = [],
): Grant {
  const sourceId = requiredField(row.pbanc_sn, "pbanc_sn");
  return {
    id: `kstartup:${sourceId}`,
    source: "kstartup",
    sourceId,
    title: toText(row.biz_pbanc_nm),
    agency: toText(row.pbanc_ntrp_nm),
    category: toText(row.supt_biz_clsfc),
    applicantTypes: splitList(row.aply_trgt),
    businessAge: splitList(row.biz_enyy),
    region: toText(row.supt_regin),
    applyStart: normalizeYyyymmdd(row.pbanc_rcpt_bgng_dt),
    applyEnd: normalizeYyyymmdd(row.pbanc_rcpt_end_dt),
    summary: toText(row.pbanc_ctnt),
    detailUrl: toText(row.detl_pg_url),
    attachments: dedupeAttachments(attachments),
    raw: { ...row },
  };
}

export function normalizeBizinfoGrant(row: BizinfoRaw): Grant {
  const sourceId = requiredField(row.pblancId, "pblancId");
  const { start, end } = parseBeginEndDate(row.reqstBeginEndDe);
  return {
    id: `bizinfo:${sourceId}`,
    source: "bizinfo",
    sourceId,
    title: toText(row.pblancNm),
    agency: toText(row.jrsdInsttNm),
    category: toText(row.pldirSportRealmLclasCodeNm),
    applicantTypes: splitList(row.trgetNm),
    businessAge: [],
    region: "",
    applyStart: start,
    applyEnd: end,
    summary: toText(row.bsnsSumryCn),
    detailUrl: absoluteUrl(toText(row.pblancUrl), "https://www.bizinfo.go.kr/"),
    attachments: buildBizinfoAttachments(row),
    raw: { ...row },
  };
}

function buildBizinfoAttachments(row: BizinfoRaw): Attachment[] {
  return dedupeAttachments([
    buildBizinfoAttachment(row.fileNm, row.flpthNm),
    buildBizinfoAttachment(row.printFileNm, row.printFlpthNm),
  ].filter((attachment): attachment is Attachment => attachment !== null));
}

function buildBizinfoAttachment(nameValue: unknown, urlValue: unknown): Attachment | null {
  const url = toText(urlValue);
  if (!url) return null;
  const name = toText(nameValue) || inferNameFromUrl(url);
  return {
    name,
    url: absoluteUrl(url, "https://www.bizinfo.go.kr/"),
  };
}

function inferNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url, "https://www.bizinfo.go.kr/");
    return parsed.pathname.split("/").filter(Boolean).at(-1) ?? "attachment";
  } catch {
    return "attachment";
  }
}
