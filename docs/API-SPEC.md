# grant-radar API 계약서 (프론트용)

> claude.ai에서 프론트를 만들 때 이 문서를 그대로 붙여넣어 출발한다.
> 백엔드는 변하지 않는 계약(이 문서)만 노출한다.

## 0. 접속

- **베이스 URL**: `https://grant.sealcpa.com` (공개 HTTPS, CORS 허용, Access PIN 게이트 없음 — claude.ai에서 바로 fetch 가능). 로컬 검증용: `http://localhost:13280`
- **인증**: 읽기 REST(`GET /api/grants`, `/api/grants/{id}`)는 **공개**다 — 정부 공고는 공개 데이터라 토큰이 필요 없다. MCP 엔드포인트(`POST /mcp`)만 `Authorization: Bearer <TOKEN>`을 요구한다(통합 surface).
- **CORS**: 허용(`*`). 브라우저 fetch로 바로 호출 가능. preflight(OPTIONS) 204.
- **현재 데이터**: 공식 4소스(K-Startup·기업마당·과기부·중기부) 약 150건, 매일 06:30 자동 갱신, 마감 지난 건 자동 숨김.

### ★ 데이터 현실 (프론트 설계 시 반드시 반영 — 없는 필터를 UI로 약속하지 말 것)

- **`region`(지역)·`businessAge`(업력)는 대부분 비어 있다.** 지역은 4소스 중 대부분 빈값, 업력은 K-Startup만 채워짐. → "지역" "창업기간" 필터는 데이터가 얇다. 메인 필터로 내세우지 말고, 있으면 보조로만. **분류(category)·기업형태(applicantType)·마감(applyEnd)** 위주로 거른다.
- **`applyEnd`(마감)가 빈 건이 있다**(특히 과기부). 빈 값이면 D-day 배지를 그리지 말 것(마감 별도확인).
- 즉 이 제품의 강점은 풍부한 필터가 아니라 **자격 판정(verdict) + AI 적합/초안**이다. 화면도 거기에 무게를 둔다.

## 1. GET /api/grants — 매칭 목록

쿼리(전부 선택):

| 파라미터 | 의미 | 예 |
|---|---|---|
| `applicantType` | 신청자 유형 | `예비창업자`, `중소기업`, `일반기업` |
| `businessAgeYears` | 업력(년) | `2` |
| `region` | 지역 | `서울`, `경기` |
| `capability` | 내 역량(자유 텍스트) | `해양 IoT 센서 제조` |
| `intent` | 의도(자유 텍스트) | `초기 투자유치` |

`applicantType`/`businessAgeYears`/`region` 3축은 **결정론적 자격필터**에 들어가 `verdict`를 만든다(`불가`는 응답에서 제외, `가능`·`확인필요`만 반환). `capability`/`intent`는 각 카드의 `fitPrompt`에 끼워진다(LLM이 적합도 판정).

### 응답

```jsonc
{
  "grants": [
    {
      "id": "bizinfo:PBLN_000000000122757",   // 고유 id (상세 조회 키)
      "source": "bizinfo",                      // "kstartup" | "bizinfo" | "msit"(과기부) | "mss"(중기부)
      "title": "2026년 ... 오픈이노베이션 참가 기업 모집 공고",
      "agency": "해양수산부",                    // 주관/소관
      "category": "창업",                        // 분류(과기부는 "R&D", 중기부는 빈값일 수 있음)
      "region": "",                             // 지역(대부분 빈 값 — 위 '데이터 현실' 참고)
      "applyEnd": "",                           // 마감 YYYYMMDD 또는 빈 값(빈 값이면 D-day 없음)
      "attachments": 1,                         // 첨부 개수(숫자)
      "eligibility": {
        "verdict": "가능",                       // "가능" | "확인필요"  (불가는 응답에서 제외)
        "reasons": []                           // 막거나 확인이 필요한 사유 배열(예: "대상: 확인필요")
      },
      "fitPrompt": "당신은 정부지원사업 매칭 전문가다. ..."  // 호출자 LLM이 그대로 실행
    }
  ]
}
```

**핵심 설계(BYO-LLM)**: 백엔드는 LLM을 돌리지 않는다. `fitPrompt`를 **그대로** 사용자의 LLM(헤르메스/GPT/MCP 호출자)에 던진다. fitPrompt는 3가지를 요구한다 — **① 적합도(상/중/하+근거) ② 값있나(해볼 만함/애매/시간낭비) ③ 준비물**. 즉 단순 점수가 아니라 상담사 답변이 나온다. 우리 LLM 키 사용량 = 0.

## 2. GET /api/grants/:id — 상세 + 공고문 추출

`id`는 1번 목록의 `id`를 URL 인코딩해서 전달.

```jsonc
{
  "found": true,
  "grant": {
    "id": "...", "title": "...", "agency": "...", "category": "...",
    "applyEnd": "...", "detailUrl": "https://...",      // 원문 링크
    "attachments": [{ "name": "공고문.hwp", "url": "https://..." }]
  },
  "formText": "...(공고문/양식 첨부에서 추출한 텍스트, 없으면 개요로 폴백)..."
}
```

`formText`는 `~/bin/hwp-read`로 첨부 .hwp를 실제 추출한 본문이다. 초안 작성 프롬프트의 근거가 된다(공고문에 없는 칸은 `[채울 자리]`).

## 3. POST /mcp — MCP (호출자 에이전트용)

Streamable HTTP, stateless. 도구 3개: `match_grants`, `get_grant`, `draft_application`. 헤르메스 등 MCP 클라이언트가 붙는 경로. 프론트(브라우저)는 1·2번 REST만 쓰면 된다.

## 4. 화면이 가지면 좋은 것 (제안, 강제 아님)

- 좌측: 4축 입력(유형·업력·지역) + 역량·의도 텍스트 → 매칭 버튼
- 중앙: 카드 리스트 — D-day 배지(`applyEnd`로 계산), `verdict` 배지(가능/확인필요), 분류·주관·지역
- 우측: 상세 패널 — 자격 사유, 첨부 링크, `fitPrompt` 복사 버튼, `formText` 미리보기
- 부가: 마감 캘린더, 스크랩(localStorage)
- **이 프로덕트의 정체는 "목록"이 아니라 "AI 상담사"다.** fitPrompt/초안을 전면에 둔다. 단순 디렉토리처럼 보이면 실패.
