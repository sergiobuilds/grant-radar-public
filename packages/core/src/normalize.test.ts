import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeBizinfoGrant,
  normalizeKStartupGrant,
  normalizeMsitGrant,
  normalizeMssGrant,
  isOpenCall,
} from "./index.ts";

test("normalizes a K-Startup announcement into the Grant schema", () => {
  const grant = normalizeKStartupGrant({
    biz_pbanc_nm: "AI 창업 사업화 지원",
    pbanc_ntrp_nm: "창업진흥원",
    supt_biz_clsfc: "사업화",
    aply_trgt: "예비창업자, 초기창업기업",
    biz_enyy: "예비, 3년미만",
    supt_regin: "전국",
    pbanc_rcpt_bgng_dt: "20260601",
    pbanc_rcpt_end_dt: "20260630",
    pbanc_ctnt: "사업화 자금을 지원합니다.",
    detl_pg_url: "https://www.k-startup.go.kr/detail",
    pbanc_sn: "12345",
    aply_trgt_ctnt: "상세 대상",
    aply_excl_trgt_ctnt: "제외 대상",
  });

  assert.equal(grant.id, "kstartup:12345");
  assert.equal(grant.source, "kstartup");
  assert.equal(grant.sourceId, "12345");
  assert.equal(grant.title, "AI 창업 사업화 지원");
  assert.equal(grant.agency, "창업진흥원");
  assert.equal(grant.category, "사업화");
  assert.deepEqual(grant.applicantTypes, ["예비창업자", "초기창업기업"]);
  assert.deepEqual(grant.businessAge, ["예비", "3년미만"]);
  assert.equal(grant.region, "전국");
  assert.equal(grant.applyStart, "2026-06-01");
  assert.equal(grant.applyEnd, "2026-06-30");
  assert.equal(grant.summary, "사업화 자금을 지원합니다.");
  assert.equal(grant.detailUrl, "https://www.k-startup.go.kr/detail");
  assert.deepEqual(grant.attachments, []);
  assert.equal(grant.raw.aply_trgt_ctnt, "상세 대상");
  assert.equal(grant.raw.aply_excl_trgt_ctnt, "제외 대상");
});

test("normalizes a Bizinfo announcement and builds file attachments", () => {
  const grant = normalizeBizinfoGrant({
    pblancNm: "수출 바우처 지원",
    jrsdInsttNm: "중소벤처기업부",
    pldirSportRealmLclasCodeNm: "수출",
    trgetNm: "중소기업, 소상공인",
    reqstBeginEndDe: "20260605 ~ 20260710",
    bsnsSumryCn: "수출 마케팅을 지원합니다.",
    pblancUrl: "https://www.bizinfo.go.kr/detail",
    pblancId: "BI2026",
    flpthNm: "https://www.bizinfo.go.kr/cmm/fms/FileDown.do?atchFileId=A",
    fileNm: "공고문.pdf",
    printFlpthNm: "https://www.bizinfo.go.kr/cmm/fms/FileDown.do?atchFileId=B",
    printFileNm: "신청서.hwp",
  });

  assert.equal(grant.id, "bizinfo:BI2026");
  assert.equal(grant.source, "bizinfo");
  assert.equal(grant.applyStart, "2026-06-05");
  assert.equal(grant.applyEnd, "2026-07-10");
  assert.deepEqual(grant.applicantTypes, ["중소기업", "소상공인"]);
  assert.deepEqual(grant.businessAge, []);
  assert.deepEqual(grant.attachments, [
    {
      name: "공고문.pdf",
      url: "https://www.bizinfo.go.kr/cmm/fms/FileDown.do?atchFileId=A",
    },
    {
      name: "신청서.hwp",
      url: "https://www.bizinfo.go.kr/cmm/fms/FileDown.do?atchFileId=B",
    },
  ]);
});

test("normalizeMsitGrant: 과기부 실레코드를 Grant로 정규화 (nttSeqNo=id, 첨부, 마감없음)", () => {
  const fixture = {
    deptName: "바이오융합혁신팀",
    pressDt: "2026-06-01",
    subject: "2026년도 바이오·의료기술개발 사업 제4차 신규과제 재공모",
    viewUrl: "https://www.msit.go.kr/bbs/view.do?sCode=user&mId=311&nttSeqNo=3186762",
    files: [
      { file: { fileName: "공고문.hwpx", fileUrl: "https://www.msit.go.kr/ssm/file/fileDown.do?atchFileNo=53976&fileOrd=1" } },
    ],
  };
  const g = normalizeMsitGrant(fixture as any);
  assert.equal(g.source, "msit");
  assert.equal(g.id, "msit:3186762");
  assert.equal(g.title, "2026년도 바이오·의료기술개발 사업 제4차 신규과제 재공모");
  assert.equal(g.agency, "과학기술정보통신부");
  assert.equal(g.applyEnd, ""); // 마감일 필드 없음
  assert.equal(g.attachments.length, 1);
});

test("isOpenCall: 선정결과 공고는 비-모집으로 제외", () => {
  assert.equal(isOpenCall("2026년 신규과제 선정결과 공고"), false);
  assert.equal(isOpenCall("2026년 바이오 신규과제 재공모"), true);
});

test("normalizeMssGrant: 중기부 레코드 정규화 (itemId=id, fileName/fileUrl 짝짓기)", () => {
  const g = normalizeMssGrant({
    itemId: "1068800",
    title: "AI+ OpenData 챌린지 참여기업 모집 공고",
    dataContents: "<p>모집 안내</p>",
    applicationStartDate: "",
    applicationEndDate: "2026-06-19",
    viewUrl: "https://www.mss.go.kr/site/smba/ex/bbs/View.do?bcIdx=1068800",
    fileName: ["공고문.hwpx", "FAQ.hwpx"],
    fileUrl: ["https://mss/f1", "https://mss/f2"],
  } as any);
  assert.equal(g.source, "mss");
  assert.equal(g.id, "mss:1068800");
  assert.equal(g.agency, "중소벤처기업부");
  assert.equal(g.applyEnd, "2026-06-19");
  assert.equal(g.attachments.length, 2);
  assert.equal(g.attachments[0].name, "공고문.hwpx");
});
