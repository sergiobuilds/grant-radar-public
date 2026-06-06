// ============================================================================
// data.js — demo dataset + API client for grant-radar
// Loaded as a plain <script> (no JSX) so globals are ready before the app.
// ============================================================================

(function () {
  // --- fitPrompt builder (mirrors what the backend would emit per grant) -----
  function buildFitPrompt(g) {
    const deadline = g.applyEnd ? fmtDate(g.applyEnd) + ' 마감' : '상시 / 미정';
    return (
`당신은 정부지원사업 매칭 전문가다. 아래 공고와 신청자 정보를 바탕으로 군더더기 없이 세 가지만 판정하라. 추측은 추측이라고 밝혀라.

[공고]
- 사업명: ${g.title}
- 주관기관: ${g.agency}
- 분류: ${g.category}
- 신청대상: ${g.applicantType || '명시 안 됨(공고문 확인 필요)'}
- 접수마감: ${deadline}
- 핵심요건: ${g.requirement || '공고문 본문 참조'}

다음 순서로 답하라.
① 적합도 — 상 / 중 / 하 중 하나. 한 줄 근거.
② 값있나 — 해볼 만함 / 애매 / 시간낭비 중 하나. 경쟁률·지원금액·준비부담을 따져 한 줄 근거.
③ 준비물 — 지금 당장 챙겨야 할 서류·자료를 불릿 3~5개로.`
    );
  }

  function fmtDate(yyyymmdd) {
    if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd || '';
    return `${yyyymmdd.slice(0, 4)}.${yyyymmdd.slice(4, 6)}.${yyyymmdd.slice(6, 8)}`;
  }

  // --- demo grants ------------------------------------------------------------
  // Reflects the real data: region/businessAge mostly empty; some applyEnd empty
  // (esp. 과기부). Categories/applicantType are the meaningful filters.
  const RAW = [
    {
      id: 'kstartup-2026-pre-001', source: 'K-Startup', title: '2026년 예비창업패키지 일반분야 창업자 모집',
      agency: '창업진흥원', category: '창업사업화', applicantType: '예비창업자',
      region: '', businessAge: '', applyEnd: '20260710', attachments: 3,
      requirement: '공고일 기준 사업자등록 이력이 없는 예비창업자',
      eligibility: { verdict: '가능', reasons: ['대상: 예비창업자 — 조건 일치', '업력: 해당 없음(예비창업 단계)'] },
    },
    {
      id: 'kstartup-2026-early-002', source: 'K-Startup', title: '초기창업패키지 창업기업 모집공고',
      agency: '창업진흥원', category: '창업사업화', applicantType: '창업기업(3년 이내)',
      region: '', businessAge: '3년 이내', applyEnd: '20260620', attachments: 4,
      requirement: '창업 후 3년 이내 기업',
      eligibility: { verdict: '확인필요', reasons: ['업력: 창업 3년 이내인지 확인 필요', '대상: 법인·개인 창업기업'] },
    },
    {
      id: 'mss-2026-tips-003', source: '중기부', title: '민간투자주도형 기술창업지원(TIPS) 창업팀 모집',
      agency: '중소벤처기업부', category: 'R&D·기술개발', applicantType: '창업기업(7년 이내)',
      region: '', businessAge: '', applyEnd: '', attachments: 2,
      requirement: 'TIPS 운영사의 투자·추천을 받은 창업팀',
      eligibility: { verdict: '확인필요', reasons: ['추천: 운영사 추천이 선행되어야 함', '마감: 운영사별 상시 접수'] },
    },
    {
      id: 'kstartup-2026-leap-004', source: 'K-Startup', title: '2026 창업도약패키지 성장지원',
      agency: '창업진흥원', category: '창업사업화', applicantType: '창업기업(3~7년)',
      region: '', businessAge: '3~7년', applyEnd: '20260630', attachments: 3,
      requirement: '창업 후 3년 초과 7년 이내 도약기 기업',
      eligibility: { verdict: '확인필요', reasons: ['업력: 3년 초과 7년 이내인지 확인 필요'] },
    },
    {
      id: 'mss-2026-rnd-005', source: '중기부', title: '중소기업 기술혁신개발사업(R&D) 신규 지원',
      agency: '중소벤처기업부', category: 'R&D·기술개발', applicantType: '중소기업',
      region: '', businessAge: '', applyEnd: '20260605', attachments: 5,
      requirement: '「중소기업기본법」상 중소기업',
      eligibility: { verdict: '가능', reasons: ['대상: 중소기업 — 조건 일치', '업력: 제한 없음'] },
    },
    {
      id: 'bizinfo-2026-loan-006', source: '기업마당', title: '소상공인 정책자금(일반경영안정자금) 융자',
      agency: '소상공인시장진흥공단', category: '융자·자금', applicantType: '소상공인',
      region: '', businessAge: '', applyEnd: '', attachments: 2,
      requirement: '상시근로자 수 기준을 충족하는 소상공인',
      eligibility: { verdict: '가능', reasons: ['대상: 소상공인 — 조건 일치', '마감: 예산 소진 시까지 상시'] },
    },
    {
      id: 'bizinfo-2026-export-007', source: '기업마당', title: '수출바우처사업 참여기업 모집',
      agency: '중소벤처기업부', category: '수출·해외진출', applicantType: '중소·중견기업',
      region: '', businessAge: '', applyEnd: '20260808', attachments: 4,
      requirement: '전년도 직수출 실적 등 트랙별 요건',
      eligibility: { verdict: '확인필요', reasons: ['요건: 수출실적 트랙 충족 여부 확인 필요'] },
    },
    {
      id: 'kstartup-2026-youth-008', source: 'K-Startup', title: '청년창업사관학교 입교생 모집',
      agency: '중소벤처기업진흥공단', category: '창업사업화', applicantType: '예비창업자·창업기업(3년 이내)',
      region: '', businessAge: '3년 이내', applyEnd: '20260625', attachments: 3,
      requirement: '만 39세 이하, 창업 3년 이내',
      eligibility: { verdict: '확인필요', reasons: ['연령: 만 39세 이하인지 확인 필요', '업력: 3년 이내'] },
    },
    {
      id: 'mss-2026-smart-009', source: '중기부', title: '스마트공장 구축 및 고도화 지원사업',
      agency: '중소벤처기업부', category: '제조혁신', applicantType: '중소·중견 제조기업',
      region: '', businessAge: '', applyEnd: '20260715', attachments: 4,
      requirement: '제조업을 영위하는 중소·중견기업',
      eligibility: { verdict: '가능', reasons: ['대상: 중소·중견 제조기업 — 조건 일치'] },
    },
    {
      id: 'msit-2026-data-010', source: '과기부', title: '데이터바우처 지원사업 수요기업 모집',
      agency: '과학기술정보통신부', category: '데이터·AI', applicantType: '중소기업·소상공인',
      region: '', businessAge: '', applyEnd: '', attachments: 2,
      requirement: '데이터 구매·가공 수요가 있는 중소기업·소상공인',
      eligibility: { verdict: '확인필요', reasons: ['요건: 데이터 활용 계획 구체화 필요', '마감: 공고문 별도 확인'] },
    },
    {
      id: 'msit-2026-ai-011', source: '과기부', title: 'AI 바우처 지원사업 수요기업 모집',
      agency: '과학기술정보통신부', category: '데이터·AI', applicantType: '중소기업',
      region: '', businessAge: '', applyEnd: '', attachments: 2,
      requirement: 'AI 솔루션 도입 수요가 있는 중소기업',
      eligibility: { verdict: '확인필요', reasons: ['요건: 도입 솔루션·과제 정의 필요'] },
    },
    {
      id: 'mss-2026-untact-012', source: '중기부', title: '비대면 서비스 바우처 지원',
      agency: '중소벤처기업부', category: '디지털전환', applicantType: '중소기업·소상공인',
      region: '', businessAge: '', applyEnd: '20260920', attachments: 3,
      requirement: '비대면 솔루션 도입을 원하는 중소기업·소상공인',
      eligibility: { verdict: '가능', reasons: ['대상: 중소기업·소상공인 — 조건 일치'] },
    },
    {
      id: 'kstartup-2026-global-013', source: 'K-Startup', title: '글로벌 액셀러레이팅 프로그램 참가기업 모집',
      agency: '창업진흥원', category: '수출·해외진출', applicantType: '창업기업(7년 이내)',
      region: '', businessAge: '7년 이내', applyEnd: '20260612', attachments: 3,
      requirement: '해외 진출을 준비하는 창업 7년 이내 기업',
      eligibility: { verdict: '확인필요', reasons: ['요건: 해외진출 계획·영문 자료 준비 필요'] },
    },
    {
      id: 'mss-2026-region-014', source: '중기부', title: '지역특화산업육성+(R&D) 과제 모집',
      agency: '중소벤처기업부', category: 'R&D·기술개발', applicantType: '중소기업',
      region: '비수도권', businessAge: '', applyEnd: '20260704', attachments: 5,
      requirement: '비수도권 소재 중소기업',
      eligibility: { verdict: '확인필요', reasons: ['지역: 비수도권 소재 기업 한정', '대상: 중소기업'] },
    },
    {
      id: 'kosme-2026-fund-015', source: '기업마당', title: '창업기업지원자금(창업기반지원) 융자',
      agency: '중소벤처기업진흥공단', category: '융자·자금', applicantType: '창업기업(7년 이내)',
      region: '', businessAge: '7년 이내', applyEnd: '', attachments: 2,
      requirement: '업력 7년 미만 중소기업',
      eligibility: { verdict: '가능', reasons: ['대상: 업력 7년 미만 — 조건 일치', '마감: 예산 범위 내 상시'] },
    },
    {
      id: 'kstartup-2026-big3-016', source: 'K-Startup', title: '혁신분야 창업패키지(BIG3) 창업기업 모집',
      agency: '창업진흥원', category: '창업사업화', applicantType: '창업기업(7년 이내)',
      region: '', businessAge: '7년 이내', applyEnd: '20260628', attachments: 4,
      requirement: '시스템반도체·바이오·미래차 분야 창업 7년 이내 기업',
      eligibility: { verdict: '확인필요', reasons: ['분야: BIG3 해당 여부 확인 필요', '업력: 7년 이내'] },
    },
  ];

  const DEMO_GRANTS = RAW.map((g) => ({ ...g, fitPrompt: buildFitPrompt(g) }));

  // --- demo detail (formText + named attachments) -----------------------------
  function demoDetail(g) {
    const names = ['공고문.hwp', '사업계획서 양식.hwpx', '신청서식.docx', '평가지표.pdf', '제출서류 안내.hwp'];
    const attachments = names.slice(0, g.attachments || 1).map((name, i) => ({
      name, url: `https://www.k-startup.go.kr/files/${g.id}-${i + 1}`,
    }));
    const deadline = g.applyEnd ? fmtDate(g.applyEnd) + '까지' : '예산 소진 시 또는 별도 공고 시까지';
    const formText =
`Ⅰ. 사업개요
○ 사업명: ${g.title}
○ 주관기관: ${g.agency}
○ 분류: ${g.category}

Ⅱ. 지원대상
○ ${g.applicantType || '공고문 본문 참조'}
○ ${g.requirement}

Ⅲ. 신청기간 및 방법
○ 접수기간: ${deadline}
○ 신청방법: 온라인 접수 시스템을 통한 사업계획서 제출
○ 제출서류: 사업계획서, 신청서, 대표자 신분 증빙 등 (첨부 양식 참조)

Ⅳ. 지원내용
○ 사업화 자금 및 멘토링·교육 등 프로그램 연계 지원
○ 세부 지원 규모와 항목은 선정 후 협약 시 확정

Ⅴ. 유의사항
○ 신청 자격 미충족 또는 서류 누락 시 평가 대상에서 제외될 수 있습니다.
○ 동일 사업 중복 수혜 제한이 적용될 수 있으니 공고문을 반드시 확인하시기 바랍니다.

※ 본 미리보기는 공고 첨부문서에서 추출한 요약본입니다. 정확한 내용은 원문 공고를 확인하세요.`;
    return {
      found: true,
      grant: {
        id: g.id, title: g.title, agency: g.agency, category: g.category,
        applyEnd: g.applyEnd, detailUrl: `https://www.k-startup.go.kr/web/contents/${g.id}.do`,
        attachments,
      },
      formText,
    };
  }

  // --- API client -------------------------------------------------------------
  const BASE = 'https://grant.sealcpa.com';

  // 읽기는 공개 — 토큰은 선택. 있으면 Authorization 헤더로 보낸다.
  function authHeaders(token) {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function fetchGrants(token) {
    const res = await fetch(`${BASE}/api/grants`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.grants || json.items || [];
  }

  async function fetchGrantDetail(token, id) {
    const res = await fetch(`${BASE}/api/grants/${encodeURIComponent(id)}`, {
      headers: authHeaders(token),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  window.GrantData = {
    BASE,
    DEMO_GRANTS,
    demoDetail,
    fetchGrants,
    fetchGrantDetail,
    fmtDate,
    buildFitPrompt,
  };
})();
