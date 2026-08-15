---
doc_kind: project-map
status: canonical
version: 2026-06-22_v2
canonical_path: /home/campbell/projects/personal/products/grant-radar-public/docs/MASTER-MAP.md
---

# Grant Radar Public MASTER-MAP

Grant Radar Public은 Grant Radar의 공개 가능한 소스와 문서를 분리한 public-safe mirror입니다. 보조금·정부지원사업 공고를 수집하고, 신청자 조건에 맞춰 기본 자격과 LLM용 판단 프롬프트를 제공합니다.

**목차** - 1 Project Seed · 2 Current Map · 3 Confirmed Scope · 4 Work Tree · 5 Open / Unconfirmed · 6 Canonical Documents · 7 Status · 8 이력

## 1 Project Seed

| 항목 | 내용 |
|---|---|
| 목적 | 정부지원사업 공고 수집·자격 필터·MCP 연동을 외부인이 이해하고 실행할 수 있게 공개합니다. |

## 2 Current Map

| 경로 | 역할 |
|---|---|
| `web/` | 공개 프론트 산출물입니다. |
| `packages/` | core와 MCP 패키지입니다. |
| `docs/` | 사용 설명서, API 계약, 출처 설명, 프로젝트 지도입니다. |

## 3 Confirmed Scope

| 포함 | 제외 |
|---|---|
| 공개 mirror, 데모, REST/MCP 계약, 수집 어댑터, 테스트 | 배포 secret, 운영 메모, 내부 전략 판단, private handoff |

## 4 Work Tree

| 작업 | 상태 |
|---|---|
| public README 재작성 | 완료 |
| 사용 설명서/API 계약 재작성 | 완료 |
| 깨진 handoff 문서 링크 제거 | 완료 |

## 5 Open / Unconfirmed

| 항목 | 상태 |
|---|---|
| 라이선스 선택 | 미정 |
| hosted service와 public mirror 동기화 정책 | 운영 tree와 공개 mirror를 분리한다는 현재 설명으로 고정 |

## 6 Canonical Documents

| 문서 | 역할 |
|---|---|
| `docs/MASTER-MAP.md` | 현재 프로젝트 지도입니다. |
| `docs/CHRONICLE.md` | 결정 기록입니다. |
| `README.md` | GitHub 첫 화면 설명입니다. |
| `.env.example` | 실행 환경변수 예시입니다. |

## 7 Status

| 날짜 | 상태 |
|---|---|
| 2026-06-21 | dirty cleanup 중 문서 스텁을 정본 형식으로 정리했습니다. |
| 2026-06-22 | public GitHub 설명을 제품 소개와 실행 안내 중심으로 재작성했습니다. |

## 8 이력

- 2026-06-21 v1 - 프로젝트 지도를 생성했습니다.
- 2026-06-22 v2 - public README, guide, API 계약, 문서 뷰어 링크를 공개 설명 기준으로 정리했습니다.
