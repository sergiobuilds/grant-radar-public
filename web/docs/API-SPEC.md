# grant-radar API and MCP Contract

This document describes the public read API and the token-protected MCP integration surface.

Base URL for the hosted instance:

```text
https://grant.sealcpa.com
```

Local default:

```text
http://localhost:13280
```

## Authentication

| Surface | Auth | Reason |
|---|---|---|
| `GET /api/grants` | none | read-only public notice data |
| `GET /api/grants/:id` | none | read-only public notice data |
| `POST /mcp` | `Authorization: Bearer <TOKEN>` | tool integration surface |

CORS is open for the read and MCP surfaces. The server responds to preflight with `204`.

## Data Model

Each normalized grant has this shape internally.

```ts
type GrantSource = "kstartup" | "bizinfo" | "msit" | "mss";

interface Grant {
  id: string;
  source: GrantSource;
  sourceId: string;
  title: string;
  agency: string;
  category: string;
  applicantTypes: string[];
  businessAge: string[];
  region: string;
  applyStart: string;
  applyEnd: string;
  summary: string;
  detailUrl: string;
  attachments: { name: string; url: string }[];
  raw: Record<string, unknown>;
}
```

The list endpoint returns a summarized version plus eligibility and `fitPrompt`.

## `GET /api/grants`

Returns active grants after deterministic eligibility filtering.

### Query Parameters

All parameters are optional.

| Parameter | Meaning | Example |
|---|---|---|
| `applicantType` | applicant category | `중소기업`, `예비창업자`, `일반기업` |
| `businessAgeYears` | company age in years | `3` |
| `region` | applicant region | `서울` |
| `capability` | what the applicant can do | `AI 기반 물류 최적화 SaaS` |
| `intent` | why the applicant is searching | `실증 고객 확보` |

`applicantType`, `businessAgeYears`, and `region` affect deterministic eligibility.

`capability` and `intent` are inserted into `fitPrompt`; the server does not call an LLM.

### Example

```bash
curl -G "https://grant.sealcpa.com/api/grants" \
  --data-urlencode "applicantType=중소기업" \
  --data-urlencode "businessAgeYears=3" \
  --data-urlencode "capability=AI 기반 물류 최적화 SaaS" \
  --data-urlencode "intent=초기 고객 실증과 사업화 자금 확보"
```

### Response

```json
{
  "count": 2,
  "grants": [
    {
      "id": "bizinfo:PBLN_000000000122757",
      "source": "bizinfo",
      "title": "2026년 ... 참가 기업 모집 공고",
      "agency": "해양수산부",
      "category": "창업",
      "region": "",
      "applyEnd": "20260731",
      "attachments": 1,
      "eligibility": {
        "verdict": "가능",
        "reasons": []
      },
      "fitPrompt": "당신은 정부지원사업 매칭 전문가다. ..."
    }
  ]
}
```

Eligibility verdicts in this response are:

| Verdict | Meaning |
|---|---|
| `가능` | clearly eligible from available fields |
| `확인필요` | not enough information or ambiguous wording |

Clearly ineligible grants are excluded from the list.

## `GET /api/grants/:id`

Returns one grant and extracted form text when available.

The `id` must be URL-encoded.

```bash
curl "https://grant.sealcpa.com/api/grants/bizinfo%3APBLN_000000000122757"
```

### Found Response

```json
{
  "found": true,
  "grant": {
    "id": "bizinfo:PBLN_000000000122757",
    "source": "bizinfo",
    "title": "...",
    "agency": "...",
    "category": "...",
    "applyEnd": "20260731",
    "detailUrl": "https://...",
    "attachments": [
      { "name": "공고문.hwp", "url": "https://..." }
    ]
  },
  "formText": "..."
}
```

### Missing Response

```json
{
  "found": false
}
```

Missing records return HTTP `404`.

## `POST /mcp`

The MCP server is stateless Streamable HTTP. Register it with a Bearer token.

```text
Authorization: Bearer <TOKEN>
```

### Tools

| Tool | Input | Output |
|---|---|---|
| `match_grants` | `state`, `capability`, `intent` | matching grants, eligibility reasons, `fitPrompt` |
| `get_grant` | `id` | grant detail and extracted form text |
| `draft_application` | `id`, `userProfile`, `capability`, `intent` | `draftPrompt` and source text |

### `match_grants` Input

```json
{
  "state": {
    "applicantType": "중소기업",
    "businessAgeYears": 3,
    "region": "서울"
  },
  "capability": "AI 기반 물류 최적화 SaaS",
  "intent": "초기 고객 실증과 사업화 자금 확보"
}
```

### `draft_application` Input

```json
{
  "id": "bizinfo:PBLN_000000000122757",
  "userProfile": "3년차 중소기업. 물류 SaaS를 운영하며 초기 고객 5곳을 보유.",
  "capability": "AI 기반 물류 최적화 SaaS",
  "intent": "실증 지원과 사업화 자금 확보"
}
```

`draft_application` returns a prompt. The caller's LLM writes the actual draft.

## Data Caveats

Government notice data is uneven. Some sources do not provide region, company age, or deadline fields. The UI should avoid promising filters that the data cannot support.

Recommended emphasis:

- eligibility verdict and reasons.
- original notice link and attachments.
- `fitPrompt` copy/use flow.
- draft prompt generation grounded in source text.

## Runtime Expectations

The active list is backed by `.cache/grants.json`. Run `npm run refresh` before local use. The hosted service refreshes on a schedule.

If `.cache/grants.json` is empty or missing, the server can start but list responses will be empty until refresh has run.
