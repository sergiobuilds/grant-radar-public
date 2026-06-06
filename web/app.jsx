// app.jsx — root: data loading (token→live / fallback→demo), filters, sheet, tweaks
const { DEMO_GRANTS, demoDetail, fetchGrants, fetchGrantDetail } = window.GrantData;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#0066FF",
  "density": "\ubcf4\ud1b5"
}/*EDITMODE-END*/;

// Curated calm-blue accents; each maps to derived strong/weak/ink tints.
const ACCENTS = {
  '#0066FF': { strong: '#005EEB', weak: '#EAF2FE', ink: '#005EEB' }, // Wanted blue
  '#3B5BD9': { strong: '#3149C0', weak: '#EDEFFA', ink: '#3149C0' }, // slate blue
  '#4F46E5': { strong: '#4338CA', weak: '#EEEDFC', ink: '#4338CA' }, // indigo
  '#0E7C8B': { strong: '#0B6A77', weak: '#E5F2F4', ink: '#0B6A77' }, // teal
};
const DENSITY = {
  '\ucd09\ucd09': { pad: '14px', gap: '8px' },
  '\ubcf4\ud1b5': { pad: '19px', gap: '12px' },
  '\ub113\ub113': { pad: '26px', gap: '18px' },
};

function useToast() {
  const [toast, setToast] = useState(null);
  const t = useRef(null);
  const show = useCallback((msg) => {
    setToast(msg); clearTimeout(t.current);
    t.current = setTimeout(() => setToast(null), 2400);
  }, []);
  return [toast, show];
}

function ddaySortKey(g) {
  const info = ddayInfo(g.applyEnd);
  if (!info) return Infinity;            // 상시·미정 → 뒤로
  return info.diff < 0 ? Infinity : info.diff;
}

function TokenModal({ initial, onClose, onSave }) {
  const [val, setVal] = useState(initial || '');
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>API 토큰 (선택)</h2>
        <p>공고 조회는 <b>토큰 없이</b> 실시간으로 됩니다(공개 데이터). 토큰은 MCP 등 통합 연동용이며, 넣으면 인증 호출에 사용됩니다. 토큰은 이 브라우저에만 저장됩니다.</p>
        <input
          className="modal-input" type="password" autoFocus placeholder="Bearer 토큰 붙여넣기"
          value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(val.trim()); }}
        />
        <div className="modal-row">
          {initial ? <button className="btn btn-ghost" onClick={() => onSave('')}>연결 해제</button> : null}
          <button className="btn btn-primary full" onClick={() => onSave(val.trim())}>저장하고 불러오기</button>
        </div>
        <p className="modal-note">데이터: K-Startup · 기업마당 · 과기부 · 중기부 공식 4소스, 매일 자동 갱신, 마감 지난 공고는 자동 숨김.</p>
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(() => { try { return localStorage.getItem('gr-token') || ''; } catch (e) { return ''; } });
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('demo'); // 'live' | 'demo'
  const [tokenOpen, setTokenOpen] = useState(false);

  const [scraps, setScraps] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('gr-scraps') || '[]')); } catch (e) { return new Set(); }
  });
  const [profile, setProfile] = useState({ type: '', biz: '', region: '', intent: '' });
  const [verdictF, setVerdictF] = useState('전체');
  const [cats, setCats] = useState(new Set());
  const [sort, setSort] = useState('추천');
  const [scrapOnly, setScrapOnly] = useState(false);

  const [selected, setSelected] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);

  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [toast, showToast] = useToast();

  // ---- load grants ----
  const load = useCallback(async (tok) => {
    setLoading(true);
    // 공고는 공개 데이터 → 토큰 없이도 실시간 조회. 네트워크 실패 시에만 데모로 폴백.
    try {
      const list = await fetchGrants(tok);
      if (Array.isArray(list) && list.length) {
        setGrants(list); setMode('live'); setLoading(false);
        showToast(`라이브 · ${list.length}건`);
        return;
      }
      throw new Error('empty');
    } catch (e) {
      setGrants(DEMO_GRANTS); setMode('demo'); setLoading(false);
      showToast('오프라인 · 데모 데이터로 표시');
    }
  }, [showToast]);

  useEffect(() => { load(token); }, []); // initial

  // ---- persist scraps ----
  useEffect(() => { try { localStorage.setItem('gr-scraps', JSON.stringify([...scraps])); } catch (e) {} }, [scraps]);

  // ---- tweaks → css vars ----
  useEffect(() => {
    const root = document.documentElement;
    const a = ACCENTS[tw.accent] || ACCENTS['#0066FF'];
    root.style.setProperty('--accent', tw.accent);
    root.style.setProperty('--accent-strong', a.strong);
    root.style.setProperty('--accent-weak', a.weak);
    root.style.setProperty('--accent-ink', a.ink);
    const d = DENSITY[tw.density] || DENSITY['\ubcf4\ud1b5'];
    root.style.setProperty('--card-pad', d.pad);
    root.style.setProperty('--list-gap', d.gap);
  }, [tw]);

  function saveToken(val) {
    setTokenOpen(false); setToken(val);
    try { val ? localStorage.setItem('gr-token', val) : localStorage.removeItem('gr-token'); } catch (e) {}
    load(val);
  }

  function toggleScrap(id) {
    setScraps((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function onMatch(p) {
    setProfile(p);
    const n = grants.filter((g) => matchesType(g, p.type)).length;
    setSort('추천');
    showToast(p.type ? `${p.type} 기준 ${n}건을 추렸어요` : '의도를 반영해 추천순으로 정렬했어요');
  }

  async function openGrant(g) {
    setSelected(g);
    if (detailCache[g.id]) return;
    setDetailLoading(true);
    if (mode === 'live') {
      try {
        const d = await fetchGrantDetail(token, g.id);
        setDetailCache((c) => ({ ...c, [g.id]: d }));
      } catch (e) {
        setDetailCache((c) => ({ ...c, [g.id]: demoDetail(g) }));
      }
    } else {
      await new Promise((r) => setTimeout(r, 280));
      setDetailCache((c) => ({ ...c, [g.id]: demoDetail(g) }));
    }
    setDetailLoading(false);
  }

  // ---- derived categories ----
  const catCounts = {};
  grants.forEach((g) => { const c = g.category || '기타'; catCounts[c] = (catCounts[c] || 0) + 1; });
  const catList = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a]);

  // ---- filter + sort ----
  let view = grants.slice();
  if (scrapOnly) view = view.filter((g) => scraps.has(g.id));
  if (profile.type) view = view.filter((g) => matchesType(g, profile.type));
  if (cats.size) view = view.filter((g) => cats.has(g.category || '기타'));
  if (verdictF !== '전체') view = view.filter((g) => (g.eligibility && g.eligibility.verdict) === verdictF);
  view.sort((a, b) => {
    if (sort === '추천') {
      const va = (a.eligibility && a.eligibility.verdict) === '가능' ? 0 : 1;
      const vb = (b.eligibility && b.eligibility.verdict) === '가능' ? 0 : 1;
      if (va !== vb) return va - vb;
    }
    return ddaySortKey(a) - ddaySortKey(b);
  });

  const okCount = grants.filter((g) => (g.eligibility && g.eligibility.verdict) === '가능').length;

  function toggleCat(c) { setCats((prev) => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n; }); }

  return (
    <React.Fragment>
      <header className="gnb">
        <div className="brand">
          <span className="brand-mark"><Ico.Radar size={18} /></span>
          <div>
            <div className="brand-name">grant-radar</div>
            <div className="brand-sub">정부지원사업 AI 상담사</div>
          </div>
        </div>
        <div className="gnb-spacer" />
        <button className={'gnb-scrap' + (scrapOnly ? ' on' : '')} onClick={() => setScrapOnly((v) => !v)}>
          <Ico.Bookmark filled={scrapOnly} size={16} />스크랩 {scraps.size > 0 ? scraps.size : ''}
        </button>
        <button className={'conn ' + mode} onClick={() => setTokenOpen(true)}>
          <span className="conn-dot" />{mode === 'live' ? '라이브 연결됨' : '데모 모드'}
        </button>
      </header>

      <div className="shell">
        <InputPanel onMatch={onMatch} />

        <main>
          <div className="results-head">
            <div className="results-count">
              {loading ? '불러오는 중…' : <React.Fragment><b>{view.length}</b>개 공고 · 지원 가능 <b>{okCount}</b></React.Fragment>}
            </div>
            <div className="gnb-spacer" />
            <div className="toolbar">
              {['전체', '가능', '확인필요'].map((v) => (
                <button key={v} className={'tfilter' + (verdictF === v ? ' on' : '')} onClick={() => setVerdictF(v)}>{v === '전체' ? '전체' : v}</button>
              ))}
              <span className="vbar" />
              <select className="sort-sel" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="추천">추천순</option>
                <option value="마감">마감임박순</option>
              </select>
            </div>
          </div>

          <div className="cat-row">
            <button className={'tfilter' + (cats.size === 0 ? ' on' : '')} onClick={() => setCats(new Set())}>전체 분류</button>
            {catList.map((c) => (
              <button key={c} className={'tfilter' + (cats.has(c) ? ' on' : '')} onClick={() => toggleCat(c)}>
                {c}<span className="ct">{catCounts[c]}</span>
              </button>
            ))}
          </div>

          {!loading && view.length === 0 ? (
            <div className="empty">
              <Ico.Inbox size={30} style={{ color: 'var(--semantic-label-assistive)' }} />
              <h3>{scrapOnly ? '스크랩한 공고가 없어요' : '조건에 맞는 공고가 없어요'}</h3>
              <p>{scrapOnly ? '카드의 북마크를 눌러 관심 공고를 모아보세요.' : '필터를 줄이거나 기업 형태를 바꿔보세요.'}</p>
            </div>
          ) : (
            <div className="card-list">
              {view.map((g) => (
                <GrantCard
                  key={g.id} grant={g}
                  active={selected && selected.id === g.id}
                  scrapped={scraps.has(g.id)}
                  onOpen={() => openGrant(g)}
                  onScrap={() => toggleScrap(g.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {selected ? (
        <DetailSheet
          grant={selected}
          detail={detailCache[selected.id]}
          loading={detailLoading && !detailCache[selected.id]}
          profile={profile}
          scrapped={scraps.has(selected.id)}
          onClose={() => setSelected(null)}
          onScrap={() => toggleScrap(selected.id)}
          onToast={showToast}
        />
      ) : null}

      {tokenOpen ? <TokenModal initial={token} onClose={() => setTokenOpen(false)} onSave={saveToken} /> : null}
      {toast ? <div className="toast">{toast}</div> : null}

      <TweaksPanel title="Tweaks">
        <TweakSection label="강조색" />
        <TweakColor label="액센트" value={tw.accent} options={Object.keys(ACCENTS)} onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="카드 밀도" />
        <TweakRadio label="여백" value={tw.density} options={['촘촘', '보통', '넓넓']} onChange={(v) => setTweak('density', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
