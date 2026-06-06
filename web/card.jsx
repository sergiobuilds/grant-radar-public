// card.jsx — minimal grant card (title · verdict · agency · deadline)
function GrantCard({ grant, active, scrapped, onOpen, onScrap }) {
  return (
    <div className={'card' + (active ? ' active' : '')} onClick={onOpen}>
      <div className="card-main">
        <div className="card-eyebrow">
          <span className="card-cat">{grant.category || '기타'}</span>
          <span className="dotsep" />
          <span>{grant.agency}</span>
        </div>
        <h3 className="card-title">{grant.title}</h3>
        <div className="card-foot">
          <Verdict verdict={grant.eligibility && grant.eligibility.verdict} />
          <span className="dotsep" />
          <Dday applyEnd={grant.applyEnd} />
        </div>
      </div>
      <div className="card-right">
        <button
          className={'scrap-btn' + (scrapped ? ' on' : '')}
          onClick={(e) => { e.stopPropagation(); onScrap(); }}
          aria-label={scrapped ? '스크랩 해제' : '스크랩'}
          title={scrapped ? '스크랩 해제' : '스크랩'}
        >
          <Ico.Bookmark filled={scrapped} />
        </button>
      </div>
    </div>
  );
}
window.GrantCard = GrantCard;
