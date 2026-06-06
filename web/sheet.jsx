// sheet.jsx — right detail slide sheet (verdict · fitPrompt · attachments · formText)
function composePrompt(grant, profile) {
  const base = grant.fitPrompt || '';
  const lines = [];
  if (profile) {
    if (profile.type) lines.push(`- 기업형태: ${profile.type}`);
    if (profile.biz) lines.push(`- 업력: ${profile.biz}`);
    if (profile.region) lines.push(`- 지역: ${profile.region}`);
    if (profile.intent && profile.intent.trim()) lines.push(`- 역량·의도: ${profile.intent.trim()}`);
  }
  const block = lines.length
    ? `\n\n[신청자 정보]\n${lines.join('\n')}`
    : `\n\n[신청자 정보]\n(좌측 패널에서 기업형태·역량·의도를 입력하면 이 자리에 자동으로 채워집니다.)`;
  return base + block;
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
  return new Promise((res) => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta); res();
  });
}

function DetailSheet({ grant, detail, loading, profile, scrapped, onClose, onScrap, onToast }) {
  const [copied, setCopied] = useState(false);
  const [answer, setAnswer] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    setCopied(false); setFormOpen(false);
    try { setAnswer(localStorage.getItem('gr-answer-' + grant.id) || ''); } catch (e) { setAnswer(''); }
  }, [grant.id]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function saveAnswer(v) {
    setAnswer(v);
    try { localStorage.setItem('gr-answer-' + grant.id, v); } catch (e) {}
  }

  const prompt = composePrompt(grant, profile);
  const detailGrant = detail && detail.grant ? detail.grant : null;
  const attachments = detailGrant && detailGrant.attachments ? detailGrant.attachments : null;
  const detailUrl = detailGrant ? detailGrant.detailUrl : null;
  const reasons = (grant.eligibility && grant.eligibility.reasons) || [];

  function doCopy() {
    copyText(prompt).then(() => {
      setCopied(true); onToast('프롬프트를 복사했어요 · 내 LLM에 붙여넣으세요');
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <React.Fragment>
      <div className="scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet-top">
          <div className="sheet-top-main">
            <div className="sheet-eyebrow">
              <span className="card-cat">{grant.category || '기타'}</span>
              <span className="dotsep" /><span>{grant.agency}</span>
              {grant.source ? <React.Fragment><span className="dotsep" /><span>{grant.source}</span></React.Fragment> : null}
            </div>
            <h2 className="sheet-title">{grant.title}</h2>
            <div className="sheet-badges">
              <Verdict verdict={grant.eligibility && grant.eligibility.verdict} big />
              <Dday applyEnd={grant.applyEnd} />
            </div>
          </div>
          <button className="icon-btn" onClick={onScrap} aria-label="스크랩" title="스크랩">
            <Ico.Bookmark filled={scrapped} size={19} style={scrapped ? { color: 'var(--accent)' } : null} />
          </button>
          <button className="icon-btn" onClick={onClose} aria-label="닫기" title="닫기"><Ico.Close size={19} /></button>
        </div>

        <div className="sheet-body">
          {/* ① verdict */}
          <div className="sec">
            <div className="sec-head"><span className="num">1</span><h3>자격 판정</h3>
              <span className="hint">자동 1차 검토</span>
            </div>
            <div className="vblock">
              <div className="vblock-top">
                <Verdict verdict={grant.eligibility && grant.eligibility.verdict} big />
                <span className="meta-soft" style={{ fontSize: 12.5 }}>
                  {grant.eligibility && grant.eligibility.verdict === '가능' ? '조건이 맞아 보여요. 세부 요건만 확인하세요.' : '조건을 한 번 더 확인해야 해요.'}
                </span>
              </div>
              <ul className="reasons">
                {reasons.map((r, i) => (<li key={i}><Ico.Check size={15} className="rk" />{r}</li>))}
              </ul>
            </div>
          </div>

          {/* ② AI 상담 — fitPrompt */}
          <div className="sec">
            <div className="sec-head"><span className="num">2</span><h3>AI 상담 프롬프트</h3>
              <span className="hint">BYO-LLM</span>
            </div>
            <div className="prompt-card">
              <div className="prompt-explain">
                <b>복사</b>해서 ChatGPT·Claude 등 내 LLM에 붙여넣으면 ① 적합도(상·중·하) ② 값있나(해볼 만함·애매·시간낭비) ③ 준비물을 정리해 줍니다.
              </div>
              <pre className="prompt-body">{prompt}</pre>
              <div className="prompt-foot">
                <button className={'btn btn-primary' + (copied ? ' copied' : '')} onClick={doCopy}>
                  {copied ? <React.Fragment><Ico.Check />복사됨</React.Fragment> : <React.Fragment><Ico.Copy />프롬프트 복사</React.Fragment>}
                </button>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div className="field-label" style={{ marginBottom: 8 }}>LLM 답변 붙여넣기 <span className="opt">· 이 공고에 저장됩니다</span></div>
              <textarea
                className="answer-ta"
                placeholder="LLM이 준 적합도 · 값있나 · 준비물 답변을 여기에 붙여넣으면 공고별로 보관돼요."
                value={answer}
                onChange={(e) => saveAnswer(e.target.value)}
              />
            </div>
          </div>

          {/* ③ attachments */}
          <div className="sec">
            <div className="sec-head"><span className="num">3</span><h3>첨부 자료</h3>
              {!loading && attachments ? <span className="hint">{attachments.length}건</span> : null}
            </div>
            {loading && !attachments ? (
              <div className="sec-loading"><span className="spin" />첨부 정보를 불러오는 중…</div>
            ) : attachments && attachments.length ? (
              <div className="attach-list">
                {attachments.map((a, i) => (
                  <a key={i} className="attach-item" href={a.url} target="_blank" rel="noopener noreferrer">
                    <span className="attach-ico"><Ico.File /></span>
                    <span className="attach-name">{a.name}</span>
                    <Ico.External size={15} style={{ color: 'var(--semantic-label-assistive)' }} />
                  </a>
                ))}
              </div>
            ) : (
              <p className="meta-soft" style={{ fontSize: 13 }}>첨부된 자료가 없습니다.</p>
            )}
          </div>

          {/* ④ formText */}
          <div className="sec" style={{ marginBottom: 8 }}>
            <div className="sec-head"><span className="num">4</span><h3>공고 원문 미리보기</h3></div>
            {loading && !(detail && detail.formText) ? (
              <div className="sec-loading"><span className="spin" />원문을 추출하는 중…</div>
            ) : detail && detail.formText ? (
              <div className={'form-prev' + (formOpen ? '' : ' collapsed')}>
                <pre>{detail.formText}</pre>
                <button className="form-toggle" onClick={() => setFormOpen(!formOpen)}>{formOpen ? '접기' : '펼쳐서 더 보기'}</button>
              </div>
            ) : (
              <p className="meta-soft" style={{ fontSize: 13 }}>원문 미리보기를 제공할 수 없습니다.</p>
            )}
          </div>
        </div>

        <div className="sheet-foot">
          <button className={'btn btn-ghost'} onClick={onScrap} style={scrapped ? { color: 'var(--accent)', borderColor: 'var(--accent-weak)' } : null}>
            <Ico.Bookmark filled={scrapped} />{scrapped ? '스크랩됨' : '스크랩'}
          </button>
          <a className="btn btn-primary full" href={detailUrl || '#'} target="_blank" rel="noopener noreferrer"
             style={!detailUrl ? { pointerEvents: 'none', opacity: 0.5 } : null}>
            원문 공고 열기<Ico.External />
          </a>
        </div>
      </div>
    </React.Fragment>
  );
}
window.DetailSheet = DetailSheet;
window.composePrompt = composePrompt;
