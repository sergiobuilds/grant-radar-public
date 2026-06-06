import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Grant } from "./types.ts";

const exec = promisify(execFile);
const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/**
 * 공고문 첨부(.hwp/.hwpx)를 내려받아 ~/bin/hwp-read로 텍스트 추출.
 * 첨부가 없거나 추출 실패 시 grant.summary로 폴백한다.
 */
export async function extractAttachmentText(grant: Grant, ua = DEFAULT_UA): Promise<string> {
  const att =
    grant.attachments.find((a) => /\.hwpx?($|\?)/i.test(a.name) || /\.hwpx?($|\?)/i.test(a.url)) ??
    grant.attachments[0];
  if (!att) return grant.summary;
  // 정부서버는 간헐적으로 느리거나 끊긴다 → 타임아웃 + 1회 재시도(신뢰성).
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await tryExtractOnce(att.url, ua);
    if (text) return text;
  }
  return grant.summary;
}

async function tryExtractOnce(url: string, ua: string): Promise<string | null> {
  const dir = await mkdtemp(join(tmpdir(), "gr-"));
  const file = join(dir, "doc.hwp");
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": ua },
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) return null;
    await writeFile(file, buf);
    const hwpRead = join(process.env.HOME ?? "", "bin", "hwp-read");
    const { stdout } = await exec(hwpRead, ["--text-only", file], {
      maxBuffer: 20 * 1024 * 1024,
    });
    return stdout.trim() || null;
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** 적합도(상/중/하) 판정 프롬프트. LLM은 호출자가 실행한다(BYO-LLM). */
export function buildFitPrompt(o: { grant: Grant; capability: string; intent: string }): string {
  return [
    "당신은 정부지원사업 매칭 전문가다. 아래 공고가 신청자에게 실제로 맞는지 판정하라.",
    `[공고] 제목:${o.grant.title} / 분류:${o.grant.category} / 개요:${o.grant.summary}`,
    `[신청자] 역량:${o.capability} / 의도:${o.intent}`,
    "판정 절차: 공고의 '핵심 도메인'을 먼저 뽑고, 신청자 역량·의도와의 결을 본다.",
    "핵심이 아닌 단순 수식어(예: 'AI 농업'에서의 AI)는 할인한다.",
    "출력(3가지, 디렉토리가 아니라 상담사로서):",
    "1) 적합도: 상/중/하 + 한 줄 근거(핵심 도메인 vs 역량·의도).",
    "2) 값있나: 지원규모 대비 준비 노력·경쟁 강도를 따져 '해볼 만함/애매/시간낭비' 중 하나 + 한 줄 근거. 공고에 규모가 없으면 '확인필요'로 둔다(지어내지 않음).",
    "3) 준비물: 신청에 당장 필요한 핵심 준비물 1~3개(공고에 적힌 것 기준).",
  ].join("\n");
}

/** 신청서 초안 작성 프롬프트. 공고문 근거·[채울 자리] 규칙 포함. */
export function buildDraftPrompt(o: { grant: Grant; formText: string; userProfile: string }): string {
  return [
    "아래 공고문/양식에 맞춰 사업계획서 초안을 작성하라.",
    `[공고문/양식]\n${o.formText}`,
    `[신청자]\n${o.userProfile}`,
    "규칙: 공고문에 적힌 항목·평가기준에만 근거한다.",
    "신청자 정보로 채우되, 정보가 없는 칸은 [채울 자리]로 둔다.",
    "없는 사실을 지어내지 않는다.",
  ].join("\n");
}
