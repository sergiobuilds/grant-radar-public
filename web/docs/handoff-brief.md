# 정부지원사업 상담 — 연동 명세서

작성일 2026-06-05 · 프로젝트 grant-radar · 용도 외부 연동·핸드오프

## 목적

정부지원사업 공고를 모아 "신청자가 실제로 지원할 수 있는 공고"를 가려내고, 그 위에 적합도·지원가치·준비물·신청서 초안을 얹어 돌려주는 백엔드를 외부에서 연동할 수 있게 한다. 정확한 엔드포인트와 인증, 도구별 입출력, 데이터 현황을 적어 더 조사 없이 붙일 수 있게 한다.

## 구성

(1) 자격 판정은 코드로 한다. 신청자의 대상·업력·지역으로 신청이 불가능한 공고를 걸러 `가능`과 `확인필요`만 남긴다. 보수적으로 판정하며, 근거가 애매하면 자르지 않고 `확인필요`로 둔다.

(2) 적합도·지원가치·준비물·신청서 초안은 호출자의 LLM이 만든다. 백엔드는 모델을 실행하지 않고 프롬프트만 돌려준다. 호출자는 자신의 모델(Claude·GPT 등)로 그 프롬프트를 실행해 결과를 얻는다. 따라서 본 백엔드는 LLM 인증키를 쓰지 않는다(키 사용량 0).

(3) 공고 본문과 첨부까지 받는다. 신청서 초안의 입력이 공고문이며, 첨부(HWP·PDF)에 양식과 평가기준이 들어 있다. 백엔드는 첨부를 내려받아 텍스트로 추출해 제공한다.

## 접속

| 항목 | 값 |
|---|---|
| 웹앱 | `https://grant.sealcpa.com/` (브라우저로 바로 사용) |
| 베이스 URL | `https://grant.sealcpa.com` (공개 HTTPS, CORS 허용) |
| REST 엔드포인트 | `GET /api/grants`, `GET /api/grants/{id}` — **공개(토큰 불필요)**. 정부 공고는 공개 데이터다 |
| MCP 엔드포인트 | `POST https://grant.sealcpa.com/mcp` (Streamable HTTP, 무상태) — **Bearer 토큰 필요**(통합 surface) |
| 인증 | 읽기 REST는 공개. MCP만 `Authorization: Bearer <TOKEN>`(토큰 별도 전달) |

## 사용법

(1) 웹앱 — 브라우저로 `https://grant.sealcpa.com/`에 접속한다. 토큰 없이 실시간 공고가 바로 뜬다. 좌측에 신청자 유형·역량·의도를 입력해 매칭하고, 카드의 자격 판정을 본 뒤, 상세에서 `fitPrompt`를 복사해 자신의 LLM(ChatGPT·Claude)에 붙여 적합도·지원가치·준비물을 받는다.

(2) MCP(에이전트) — MCP 호환 클라이언트(Claude Desktop, MCP Inspector, 자체 에이전트)에 엔드포인트 `https://grant.sealcpa.com/mcp`와 Bearer 토큰을 등록하면 도구 3종을 쓴다. 빠른 확인은 `npx @modelcontextprotocol/inspector`로 Inspector를 띄워 Transport를 Streamable HTTP로, URL을 위 엔드포인트로, 헤더 `Authorization: Bearer <TOKEN>`을 넣고 연결한다.

(3) REST(스크립트) — 토큰 없이 바로 호출한다.

```bash
curl -G "https://grant.sealcpa.com/api/grants" \
  --data-urlencode "applicantType=중소기업" \
  --data-urlencode "capability=해양 IoT 센서"
```

## 인터페이스 — MCP 도구 3종

호출자 에이전트는 위 MCP 엔드포인트에 토큰과 함께 붙어 아래 세 도구를 쓴다. 모든 도구의 LLM 작업물은 프롬프트로 반환되며, 호출자가 자신의 모델로 실행한다.

| 도구 | 입력 | 출력 |
|---|---|---|
| `match_grants` | `state{applicantType?, businessAgeYears?, region?}`, `capability?`, `intent?` | `{count, grants[]}`. 각 grant는 `eligibility.verdict`(가능·확인필요)와 `fitPrompt`(적합도·지원가치·준비물 판정 프롬프트)를 가진다 |
| `get_grant` | `id` | `{found, grant{…, detailUrl, attachments[]}, formText}`. `formText`는 공고문 첨부에서 추출한 본문이다 |
| `draft_application` | `id`, `userProfile?` | `{found, draftPrompt, formText}`. `draftPrompt`는 공고문 양식에 맞춘 신청서 초안 작성 프롬프트다. 없는 칸은 `[채울 자리]`로 두고 공고문에 적힌 것에만 근거한다 |

## 인터페이스 — REST

(1) `GET /api/grants` — 매칭 목록. 쿼리 `applicantType`, `businessAgeYears`, `region`, `capability`, `intent`(전부 선택). 앞 세 가지는 자격 판정에, 뒤 두 가지는 `fitPrompt`에 반영된다. `불가`는 응답에서 제외하고 `가능`·`확인필요`만 반환한다.

(2) `GET /api/grants/{id}` — 단건 상세. `id`는 목록의 `id`를 URL 인코딩해 전달한다. 원문 링크·첨부 목록·추출 본문(`formText`)을 반환한다.

응답의 grant 필드는 `id`, `source`(kstartup·bizinfo·msit·mss), `title`, `agency`, `category`, `region`, `applyEnd`, `attachments`, `eligibility{verdict, reasons}`, `fitPrompt`이다.

## 데이터

(1) 공식 4소스에서 받는다 — K-Startup, 기업마당, 과기정통부, 중기부. 현재 약 150건이다. 출처와 수집 방식의 전체 설계는 하위 문서 「출처 명세서」를 따른다.

(2) 매일 정기 갱신하며, 마감이 지난 공고는 자동으로 숨긴다. 같은 공고가 여러 출처에 중복 게시되면 제목·기관·마감을 기준으로 병합한다.

(3) 지역·업력 필드는 출처에 따라 비어 있을 수 있다. 이 경우 자격 판정은 보수적으로 `확인필요`로 둔다. 마감일이 없는 공고도 있으며(일부 부처 공고), 이때는 마감 표기를 비운다.

## 하위 문서

- 「출처 명세서」(`docs/source-spec.md`) — 출처별 엔드포인트·인증·응답 필드·수집 방식·우선순위.
- 「API 계약서」(`docs/API-SPEC.md`) — REST 응답 스키마 상세(프론트 구현용).

## 이력

- 2026-06-05 v1 — 작성. MCP·REST 라이브 검증(도구 3종, match_grants 실호출 확인), 공식 4소스 약 150건 가동.
