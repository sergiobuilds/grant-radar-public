# grant-radar 사용 설명서

grant-radar는 정부지원사업 공고를 모아 보여주는 목록 서비스가 아닙니다. 공고 원문과 신청자 조건을 같이 보고, 어떤 공고가 실제로 검토할 만한지 AI가 판단할 수 있게 정리해 주는 수집·상담 보조 도구입니다.

핵심은 세 가지입니다.

1. 여러 공공 출처의 공고를 한 스키마로 모읍니다.
2. 명확히 신청 불가능한 공고는 제외하고, 애매한 공고는 `확인필요`로 남깁니다.
3. 호출자의 LLM이 적합도, 지원가치, 준비물, 신청서 초안을 만들 수 있도록 근거 프롬프트를 제공합니다.

## 어디서 쓰나

| 경로 | 대상 | 주소 |
|---|---|---|
| 웹앱 | 사람이 브라우저에서 탐색 | `https://grant.sealcpa.com/` |
| REST | 스크립트와 프론트엔드 | `GET https://grant.sealcpa.com/api/grants` |
| MCP | AI 에이전트 | `POST https://grant.sealcpa.com/mcp` |
| 문서 | 사용법과 계약 | `https://grant.sealcpa.com/docs/` |

읽기 REST는 공개입니다. MCP는 Bearer 토큰이 필요합니다.

## 기본 흐름

1. 신청자 유형, 업력, 지역을 입력합니다.
2. 역량과 의도를 자유 문장으로 넣습니다.
3. 서버가 공고별 자격을 먼저 가릅니다.
4. 응답의 `fitPrompt`를 LLM에 넘겨 적합도와 지원가치를 판단합니다.
5. 필요한 공고는 `draft_application`으로 초안 작성 프롬프트를 만듭니다.

서버가 직접 LLM을 호출하지 않습니다. ChatGPT, Claude, Hermes 같은 호출자 쪽 LLM이 프롬프트를 실행합니다.

## 웹앱

브라우저에서 `https://grant.sealcpa.com/`을 열면 현재 캐시된 공고 목록이 나옵니다.

카드의 자격 배지는 두 가지입니다.

| 배지 | 의미 |
|---|---|
| `가능` | 입력한 조건과 공고 요건이 명확히 맞습니다. |
| `확인필요` | 정보가 부족하거나 공고 요건이 애매합니다. 함부로 숨기지 않습니다. |

`불가` 공고는 목록에서 제외됩니다. 이 프로젝트는 거짓으로 `불가` 판정해 좋은 공고를 숨기는 일을 더 큰 오류로 봅니다.

## REST

가장 간단한 호출은 다음과 같습니다.

```bash
curl -G "https://grant.sealcpa.com/api/grants" \
  --data-urlencode "applicantType=중소기업" \
  --data-urlencode "businessAgeYears=3" \
  --data-urlencode "region=서울" \
  --data-urlencode "capability=AI 기반 물류 최적화 SaaS" \
  --data-urlencode "intent=초기 고객 실증과 사업화 자금 확보"
```

응답에는 `count`와 `grants`가 들어 있습니다. 각 공고에는 제목, 기관, 마감, 첨부 수, 자격 판정, `fitPrompt`가 포함됩니다.

상세는 목록의 `id`로 조회합니다.

```bash
curl "https://grant.sealcpa.com/api/grants/bizinfo%3APBLN_000000000122757"
```

## MCP

MCP 클라이언트에는 Streamable HTTP 서버로 등록합니다.

| 항목 | 값 |
|---|---|
| URL | `https://grant.sealcpa.com/mcp` |
| Header | `Authorization: Bearer <TOKEN>` |
| Transport | Streamable HTTP |

도구는 세 개입니다.

| 도구 | 하는 일 |
|---|---|
| `match_grants` | 신청자 조건으로 공고를 찾고 자격 판정과 `fitPrompt`를 반환합니다. |
| `get_grant` | 특정 공고의 상세, 원문 링크, 첨부, 추출 텍스트를 반환합니다. |
| `draft_application` | 공고문과 사용자 프로필을 바탕으로 신청서 초안 프롬프트를 만듭니다. |

## 프롬프트가 하는 일

`fitPrompt`는 LLM에게 다음을 요구합니다.

- 이 공고가 신청자 역량과 맞는지.
- 시간과 준비비용을 감안해 해볼 만한지.
- 어떤 자료를 준비해야 하는지.
- 공고 요건상 조심할 점이 무엇인지.

`draftPrompt`는 신청서 초안을 만들기 위한 프롬프트입니다. 공고문과 첨부에서 얻은 내용에 근거하며, 모르는 사실은 `[채울 자리]`로 남기도록 지시합니다.

## 데이터 출처

현재 공개 빌드는 공식 API 중심으로 동작합니다.

| 출처 | 코드 | 비고 |
|---|---|---|
| K-Startup | `kstartup` | 창업진흥원 공고 |
| 기업마당 | `bizinfo` | 중앙부처·지자체·유관기관 지원사업 |
| 과학기술정보통신부 | `msit` | R&D·국제협력·인프라 공고 |
| 중소벤처기업부 | `mss` | 중기부 사업공고 |

마감이 지난 공고는 active list에서 숨기고, 여러 출처에 반복 게시된 공고는 하나로 합칩니다.

## 한계

공공 데이터는 필드 품질이 고르지 않습니다. 지역, 업력, 마감일이 비어 있는 공고가 있습니다. 그래서 grant-radar는 없는 필터를 강하게 약속하지 않고, 애매한 경우를 `확인필요`로 남깁니다.

최종 신청 전에는 반드시 원문 공고와 첨부를 확인해야 합니다.
