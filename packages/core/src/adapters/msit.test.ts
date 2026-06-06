import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchMsitGrants } from "./msit.ts";

const body = JSON.stringify({
  response: [
    { header: { resultCode: "00" } },
    { body: { totalCount: 2, items: [
      { item: { subject: "2026년 바이오 신규과제 재공모", pressDt: "2026-06-01",
        viewUrl: "https://www.msit.go.kr/bbs/view.do?nttSeqNo=3186762",
        files: [{ file: { fileName: "공고문.hwpx", fileUrl: "https://x/f1" } }] } },
      { item: { subject: "2026년 신규과제 선정결과 공고", pressDt: "2026-05-29",
        viewUrl: "https://www.msit.go.kr/bbs/view.do?nttSeqNo=3186761", files: [] } },
    ] } },
  ],
});

test("fetchMsitGrants: 응답을 Grant[]로 + 선정결과 제외(모집필터)", async () => {
  const fetcher = async () => new Response(body, { status: 200 });
  const grants = await fetchMsitGrants({ serviceKey: "k", fetcher });
  assert.equal(grants.length, 1); // 선정결과 1건 필터됨
  assert.equal(grants[0].source, "msit");
  assert.equal(grants[0].id, "msit:3186762");
  assert.equal(grants[0].attachments.length, 1);
});
