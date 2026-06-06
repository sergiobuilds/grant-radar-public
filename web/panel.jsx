// panel.jsx — left consultation input panel
const APPLICANT_TYPES = ['예비창업자', '창업기업', '중소기업', '소상공인'];
const BIZ_AGES = ['예비', '1년 미만', '1~3년', '3~7년', '7년 이상'];
const REGIONS = ['전국', '수도권', '비수도권'];

function InputPanel({ onMatch }) {
  const [type, setType] = useState('');
  const [biz, setBiz] = useState('');
  const [region, setRegion] = useState('');
  const [intent, setIntent] = useState('');

  function pick(cur, set, val) { set(cur === val ? '' : val); }

  return (
    <aside className="panel">
      <span className="panel-eyebrow"><Ico.Spark size={14} />AI 상담</span>
      <h2>내 조건으로 상담받기</h2>
      <p className="panel-desc">조건과 의도를 알려주시면, 지원 가능한 공고를 추려 자격을 판정하고 맞춤 분석 프롬프트를 만들어 드려요.</p>

      <div className="field">
        <div className="field-label">기업 형태 <span className="opt">· 목록을 추립니다</span></div>
        <div className="seg">
          {APPLICANT_TYPES.map((t) => (
            <button key={t} className={'seg-chip' + (type === t ? ' on' : '')} onClick={() => pick(type, setType, t)}>{t}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field-label">역량 · 의도 <span className="opt">· 상담의 핵심</span></div>
        <textarea
          className="ta"
          placeholder="예) SaaS 개발 2년차, 매출 3억. AI 기능 R&D 자금과 수출 판로가 필요합니다. 정부 R&D는 처음이에요."
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
        />
      </div>

      <div className="field">
        <div className="field-label">업력 <span className="opt">· 상담에 반영</span></div>
        <div className="seg small">
          {BIZ_AGES.map((b) => (
            <button key={b} className={'seg-chip' + (biz === b ? ' on' : '')} onClick={() => pick(biz, setBiz, b)}>{b}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field-label">지역 <span className="opt">· 상담에 반영</span></div>
        <div className="seg small">
          {REGIONS.map((r) => (
            <button key={r} className={'seg-chip' + (region === r ? ' on' : '')} onClick={() => pick(region, setRegion, r)}>{r}</button>
          ))}
        </div>
      </div>

      <button className="btn-match" onClick={() => onMatch({ type, biz, region, intent })}>
        <Ico.Radar size={17} />매칭하기
      </button>
      <p className="panel-note">업력·지역은 공고 데이터가 얇아 필터로 쓰지 않고, 상담 프롬프트에만 반영합니다. 목록은 기업 형태·분류·마감 기준으로 좁혀집니다.</p>
    </aside>
  );
}
window.InputPanel = InputPanel;
window.matchesType = function (grant, type) {
  if (!type) return true;
  const a = (grant.applicantType || '');
  const key = { '예비창업자': '예비', '창업기업': '창업', '중소기업': '중소', '소상공인': '소상공인' }[type] || type;
  return a.indexOf(key) !== -1 || a.indexOf('전체') !== -1;
};
