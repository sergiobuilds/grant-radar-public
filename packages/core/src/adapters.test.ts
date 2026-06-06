import assert from "node:assert/strict";
import test from "node:test";

import { fetchBizinfoGrants, fetchKStartupGrants } from "./index.ts";

test("K-Startup adapter sends UA, normalizes rows, and extracts absolute attachment links", async () => {
  const calls: Array<{ url: string; userAgent: string }> = [];
  const fetcher = async (input: string | URL, init?: RequestInit) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    calls.push({ url, userAgent: headers.get("user-agent") ?? "" });

    if (url.includes("getAnnouncementInformation01")) {
      return new Response(
        JSON.stringify({
          data: [
            {
              biz_pbanc_nm: "창업 지원",
              pbanc_ntrp_nm: "창업진흥원",
              supt_biz_clsfc: "사업화",
              aply_trgt: "예비창업자",
              biz_enyy: "7년미만",
              supt_regin: "전국",
              pbanc_rcpt_bgng_dt: "20260601",
              pbanc_rcpt_end_dt: "20260630",
              pbanc_ctnt: "요약",
              detl_pg_url: "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=900",
              pbanc_sn: "900",
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }

    return new Response(
      '<a href="/afile/fileDownload/file1.do?fileSn=1">공고문 다운로드</a>',
      { status: 200, headers: { "content-type": "text/html" } },
    );
  };

  const grants = await fetchKStartupGrants({
    serviceKey: "encoded%2Fkey",
    page: 2,
    perPage: 1,
    fetcher,
  });

  assert.equal(calls.length, 2);
  assert.match(calls[0]?.url ?? "", /serviceKey=encoded%2Fkey/);
  assert.match(calls[0]?.url ?? "", /page=2/);
  assert.match(calls[0]?.url ?? "", /perPage=1/);
  assert.ok(calls.every((call) => call.userAgent.includes("grant-radar")));
  assert.deepEqual(grants[0]?.attachments, [
    {
      name: "공고문 다운로드",
      url: "https://www.k-startup.go.kr/afile/fileDownload/file1.do?fileSn=1",
    },
  ]);
});

test("Bizinfo adapter sends UA and reads jsonArray.item attachments", async () => {
  const calls: Array<{ url: string; userAgent: string }> = [];
  const fetcher = async (input: string | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    calls.push({ url: String(input), userAgent: headers.get("user-agent") ?? "" });

    return new Response(
      JSON.stringify({
        jsonArray: {
          item: [
            {
              pblancNm: "기업마당 공고",
              jrsdInsttNm: "중소벤처기업부",
              pldirSportRealmLclasCodeNm: "수출",
              trgetNm: "중소기업",
              reqstBeginEndDe: "20260601 ~ 20260630",
              bsnsSumryCn: "요약",
              pblancUrl: "https://www.bizinfo.go.kr/detail",
              pblancId: "BIZ-1",
              flpthNm: "/cmm/fms/FileDown.do?atchFileId=A",
              fileNm: "공고문.pdf",
            },
          ],
        },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  const grants = await fetchBizinfoGrants({
    crtfcKey: "biz-key",
    searchCnt: 1,
    fetcher,
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0]?.url ?? "", /crtfcKey=biz-key/);
  assert.match(calls[0]?.url ?? "", /searchCnt=1/);
  assert.ok(calls[0]?.userAgent.includes("grant-radar"));
  assert.deepEqual(grants[0]?.attachments, [
    {
      name: "공고문.pdf",
      url: "https://www.bizinfo.go.kr/cmm/fms/FileDown.do?atchFileId=A",
    },
  ]);
});
