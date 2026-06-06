import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchMssGrants, extractMssRows } from "./mss.ts";

const XML = `<?xml version="1.0" encoding="UTF-8"?><response><header><resultCode>00</resultCode></header><body><numOfRows>2</numOfRows><totalCount>2</totalCount><items>
<item><itemId>1068800</itemId><title><![CDATA[AI+ OpenData 챌린지 참여기업 모집 연장 공고]]></title><dataContents><![CDATA[<p>모집</p>]]></dataContents><applicationStartDate /><applicationEndDate /><viewUrl><![CDATA[https://www.mss.go.kr/v/1068800]]></viewUrl><fileName><![CDATA[공고문.hwpx]]></fileName><fileUrl><![CDATA[https://mss/f1]]></fileUrl></item>
<item><itemId>1068700</itemId><title><![CDATA[2026년 지원사업 선정결과 공고]]></title><dataContents><![CDATA[결과]]></dataContents><viewUrl><![CDATA[https://www.mss.go.kr/v/1068700]]></viewUrl></item>
</items></body></response>`;

test("extractMssRows: XML에서 item 배열 추출", () => {
  const rows = extractMssRows(XML);
  assert.equal(rows.length, 2);
  assert.equal((rows[0] as any).itemId, 1068800);
});

test("fetchMssGrants: XML→Grant[] + 선정결과 모집필터 제외", async () => {
  const fetcher = async () => new Response(XML, { status: 200 });
  const grants = await fetchMssGrants({ serviceKey: "k", fetcher });
  assert.equal(grants.length, 1); // 선정결과 제외
  assert.equal(grants[0].id, "mss:1068800");
  assert.equal(grants[0].source, "mss");
});
