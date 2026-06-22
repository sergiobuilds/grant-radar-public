# grant-radar

정부지원사업 공고를 모으고, 신청자 조건에 맞춰 검토할 만한 공고를 골라내며, AI가 적합도와 신청서 초안을 판단할 수 있도록 정리해 주는 REST/MCP 서비스입니다.

단순 공고 목록이 아닙니다. 공고 원문은 흩어져 있고, 지원대상·업력·지역·첨부 양식은 출처마다 다릅니다. grant-radar는 이 정보를 한 스키마로 정리한 뒤, 명확히 맞지 않는 공고는 제외하고, 애매한 공고는 `확인필요`로 남깁니다. 그 다음 호출자 쪽 LLM이 적합도, 지원가치, 준비물, 초안 작성을 수행할 수 있게 프롬프트를 제공합니다.

## 무엇을 하나

- K-Startup, 기업마당, 과기정통부, 중소벤처기업부 공고를 수집합니다.
- 공고를 제목, 기관, 분야, 신청대상, 업력, 지역, 마감, 첨부 링크로 정규화합니다.
- 여러 출처에 반복 게시된 같은 공고를 하나로 합칩니다.
- 마감 지난 공고를 active 목록에서 숨깁니다.
- 신청자 유형, 업력, 지역으로 기본 자격을 판정합니다.
- LLM이 바로 실행할 수 있는 `fitPrompt`와 `draftPrompt`를 반환합니다.
- 웹앱, 공개 읽기 REST API, 토큰 보호 MCP 엔드포인트를 제공합니다.

이 프로젝트는 자체 LLM을 호출하지 않습니다. ChatGPT, Claude, Hermes 같은 호출자 쪽 모델이 grant-radar의 결과를 받아 판단과 글쓰기를 합니다.

## 데모

현재 운영 중인 인스턴스입니다.

| 표면 | 주소 |
|---|---|
| 웹앱 | `https://grant.sealcpa.com/` |
| REST 목록 | `https://grant.sealcpa.com/api/grants` |
| 문서 | `https://grant.sealcpa.com/docs/` |
| MCP | `https://grant.sealcpa.com/mcp` |

읽기 REST는 공개입니다. 정부 공고는 공개 데이터이기 때문입니다. MCP는 AI 에이전트가 붙는 통합 표면이라 Bearer 토큰을 요구합니다.

이 저장소는 public-safe source mirror입니다. 실제 운영에 필요한 secret, 배포 설정, 내부 운영 메모는 public tree에 두지 않습니다.

## 빠른 실행

```bash
npm ci
cp .env.example .env
```

`.env`에 API 키를 채운 뒤 캐시를 갱신합니다.

```bash
npm run refresh
npm run mcp
```

기본 서버 주소는 `http://localhost:13280`입니다.

## 환경변수

| 변수 | 필수 | 용도 |
|---|---:|---|
| `DATA_GO_KR_SERVICE_KEY` | 예 | K-Startup, 과기정통부, 중소벤처기업부 data.go.kr API 키 |
| `BIZINFO_CRTFC_KEY` | 예 | 기업마당 API 키 |
| `GRANT_RADAR_TOKEN` | 권장 | `/mcp` Bearer 토큰. 없으면 서버가 생성해 `.env`에 추가합니다. |
| `PORT` | 아니오 | HTTP 포트. 기본 `13280` |
| `GRANT_CACHE` | 아니오 | 캐시 파일 경로. 기본 `.cache/grants.json` |
| `KSTARTUP_PAGE` | 아니오 | K-Startup 페이지. 기본 `1` |
| `KSTARTUP_PER_PAGE` | 아니오 | K-Startup page size. 기본 `30` |
| `BIZINFO_SEARCH_CNT` | 아니오 | 기업마당 page size. 기본 `30` |

## REST 예시

```bash
curl -G "https://grant.sealcpa.com/api/grants" \
  --data-urlencode "applicantType=중소기업" \
  --data-urlencode "businessAgeYears=3" \
  --data-urlencode "capability=AI 기반 물류 최적화 SaaS" \
  --data-urlencode "intent=초기 고객 실증과 사업화 자금 확보"
```

응답에는 `가능` 또는 `확인필요` 공고만 들어 있습니다. 명확히 불가능한 공고는 제외됩니다.

## MCP 도구

| 도구 | 하는 일 |
|---|---|
| `match_grants` | 조건에 맞는 공고, 자격 사유, `fitPrompt`를 반환합니다. |
| `get_grant` | 특정 공고의 상세 링크, 첨부, 추출 텍스트를 반환합니다. |
| `draft_application` | 공고문과 사용자 프로필을 바탕으로 초안 작성 프롬프트를 만듭니다. |

프롬프트는 호출자 쪽 LLM이 실행합니다. 모르는 사실은 지어내지 않고 `[채울 자리]`로 남기도록 설계했습니다.

## 디렉토리 구조

| 경로 | 역할 |
|---|---|
| `packages/core` | 수집 어댑터, 정규화 스키마, 캐시, 중복 제거, 자격 판정, 프롬프트 생성 |
| `packages/mcp` | Express 앱, REST 엔드포인트, MCP 서버 |
| `scripts/refresh.ts` | 출처 데이터를 가져와 `.cache/grants.json`을 갱신 |
| `web/` | 정적 웹 UI와 문서 뷰어 |
| `docs/` | 사용 설명서, API 계약, 출처 명세서, 프로젝트 지도 |

## 검증

```bash
npm test
```

현재 로컬 기준 `npm ci` 후 Node 테스트 30개가 통과합니다.

## 경계

grant-radar는 공고 탐색과 신청서 초안 작성을 돕는 도구입니다. 실제 신청 제출, 최종 법률·회계 판단, 사업비 집행·정산 관리는 하지 않습니다. 신청 전에는 반드시 원문 공고와 첨부를 확인해야 합니다.

LLM API 키는 필요하지 않고 저장하지 않습니다.
