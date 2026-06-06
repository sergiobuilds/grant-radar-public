// helpers.jsx — shared utilities + tiny presentational atoms
const { useState, useEffect, useRef, useCallback } = React;

function ddayInfo(applyEnd) {
  if (!applyEnd || applyEnd.length !== 8) return null;
  const y = +applyEnd.slice(0, 4), m = +applyEnd.slice(4, 6), d = +applyEnd.slice(6, 8);
  const end = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((end - today) / 86400000);
  if (diff < 0) return { diff, label: '마감', expired: true };
  return { diff, label: diff === 0 ? 'D-DAY' : `D-${diff}`, urgent: diff <= 7, expired: false };
}

function Verdict({ verdict, big }) {
  const ok = verdict === '가능';
  return (
    <span className={'verdict ' + (ok ? 'ok' : 'check')} style={big ? { fontSize: '13.5px', padding: '6px 13px 6px 11px' } : null}>
      <span className="vdot" />{verdict}
    </span>
  );
}

function Dday({ applyEnd }) {
  const info = ddayInfo(applyEnd);
  if (!info) return <span className="meta-soft">상시·미정</span>;
  return (
    <span className={'dday' + (info.urgent ? ' urgent' : '')}>
      <Ico.Clock />{info.label}
    </span>
  );
}

window.ddayInfo = ddayInfo;
window.Verdict = Verdict;
window.Dday = Dday;
