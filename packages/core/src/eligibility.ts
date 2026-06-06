import type { Grant } from "./types.ts";

export interface UserState {
  applicantType?: string;
  businessAgeYears?: number;
  region?: string;
}

export type Verdict = "가능" | "불가" | "확인필요";

export interface EligibilityResult {
  verdict: Verdict;
  reasons: string[];
}

const EARLY = new Set(["예비창업자", "1년미만", "2년미만"]);
const COVERS_3PLUS = ["3년미만", "5년미만", "7년미만", "10년미만"];
const LOCAL_WORDS = ["관내", "시민", "소재", "거주", "내 기업", "지역 기업"];

// 사용자 자유입력 → 공고 controlled vocab(bizinfo 11값)의 정식 명칭으로 정규화.
const TARGET_SYNONYM: Record<string, string> = {
  스타트업: "창업벤처",
  벤처: "창업벤처",
  벤처기업: "창업벤처",
  창업기업: "창업벤처",
  중기업: "중소기업",
  "중소·중견기업": "중소기업",
  중견기업: "중소기업",
  "1인기업": "1인 창조기업",
  "1인창조기업": "1인 창조기업",
  국민: "일반인",
  개인: "일반인",
  학생: "대학생",
};

// 대상 가족: 정확 일치가 아니어도 같은 가족이면 자르지 않는다(거짓 불가 방지).
const TARGET_FAMILY: Record<string, "기업" | "개인" | "학계"> = {
  일반기업: "기업",
  중소기업: "기업",
  "1인 창조기업": "기업",
  창업벤처: "기업",
  소상공인: "기업",
  사회적기업: "기업",
  일반인: "개인",
  예비창업자: "개인",
  대학생: "개인",
  청소년: "개인",
  대학: "학계",
  연구기관: "학계",
};

function canonTarget(term: string): string {
  const key = term.replace(/\s/g, "");
  return TARGET_SYNONYM[key] ?? TARGET_SYNONYM[term] ?? term;
}

function targetFamily(term: string): "기업" | "개인" | "학계" | null {
  return TARGET_FAMILY[canonTarget(term)] ?? null;
}

function axisTarget(g: Grant, u: UserState): Verdict | null {
  if (!u.applicantType) return null;
  if (g.applicantTypes.length === 0) return "확인필요";
  const userTerm = canonTarget(u.applicantType);
  if (g.applicantTypes.map(canonTarget).includes(userTerm)) return "가능";
  // 가족이 명확히 다를 때만 불가. 같은 가족이거나 판별 불가면 확인필요(안 자름).
  const userFam = targetFamily(u.applicantType);
  const grantFams = new Set(
    g.applicantTypes.map(targetFamily).filter((f): f is "기업" | "개인" | "학계" => f !== null),
  );
  if (userFam && grantFams.size > 0 && !grantFams.has(userFam)) return "불가";
  return "확인필요";
}

function axisAge(g: Grant, u: UserState): Verdict | null {
  if (u.businessAgeYears == null) return null;
  if (g.businessAge.length === 0) return "확인필요";
  const onlyEarly = g.businessAge.every((b) => EARLY.has(b));
  if (u.businessAgeYears >= 3 && onlyEarly) return "불가";
  if (g.businessAge.some((b) => COVERS_3PLUS.includes(b))) return "가능";
  return "확인필요";
}

function axisRegion(g: Grant, u: UserState): Verdict | null {
  if (!u.region) return null;
  if (g.region === "전국" || g.region === u.region) return "가능";
  const ctnt = `${g.raw?.["aply_trgt_ctnt"] ?? ""}${g.raw?.["aply_excl_trgt_ctnt"] ?? ""}`;
  return LOCAL_WORDS.some((w) => ctnt.includes(w)) ? "불가" : "확인필요";
}

export function evaluateEligibility(g: Grant, u: UserState): EligibilityResult {
  const checks: Array<[string, Verdict | null]> = [
    ["대상", axisTarget(g, u)],
    ["업력", axisAge(g, u)],
    ["지역", axisRegion(g, u)],
  ];
  const reasons: string[] = [];
  let verdict: Verdict = "가능";
  for (const [axis, v] of checks) {
    if (v === "불가") {
      reasons.push(`${axis}: 불가`);
      verdict = "불가";
    } else if (v === "확인필요" && verdict !== "불가") {
      reasons.push(`${axis}: 확인필요`);
      verdict = "확인필요";
    }
  }
  return { verdict, reasons };
}
