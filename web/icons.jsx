// icons.jsx — minimal line-icon set in Montage style (1.7px stroke, round caps)
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };

const Ico = {
  Radar: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} {...S} {...p}>
      <path d="M12 12 19 7" /><path d="M12 3a9 9 0 1 0 9 9" /><path d="M12 8.5a3.5 3.5 0 1 0 3.5 3.5" />
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} {...S} {...p}>
      <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.4-3.4" />
    </svg>
  ),
  Bookmark: ({ filled, size, ...p }) => (
    <svg viewBox="0 0 24 24" width={size || 18} height={size || 18} {...S} fill={filled ? 'currentColor' : 'none'} {...p}>
      <path d="M6 4.5h12v15l-6-3.6-6 3.6z" />
    </svg>
  ),
  Copy: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 16} height={p.size || 16} {...S} {...p}>
      <rect x="8" y="8" width="12" height="12" rx="2.4" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 16} height={p.size || 16} {...S} {...p}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  ),
  External: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 16} height={p.size || 16} {...S} {...p}>
      <path d="M14 5h5v5" /><path d="M19 5l-8 8" /><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </svg>
  ),
  Close: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} {...S} {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  File: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 16} height={p.size || 16} {...S} {...p}>
      <path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /><path d="M9.5 13h5M9.5 16.5h5" />
    </svg>
  ),
  Sliders: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 16} height={p.size || 16} {...S} {...p}>
      <path d="M5 7h9M18 7h1M5 17h1M10 17h9" /><circle cx="16" cy="7" r="2.2" /><circle cx="8" cy="17" r="2.2" />
    </svg>
  ),
  Spark: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 16} height={p.size || 16} {...S} {...p}>
      <path d="M12 4l1.7 4.6L18 10l-4.3 1.4L12 16l-1.7-4.6L6 10l4.3-1.4z" /><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 14} height={p.size || 14} {...S} {...p}>
      <circle cx="12" cy="12" r="8" /><path d="M12 8v4.3l2.8 1.7" />
    </svg>
  ),
  Key: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 16} height={p.size || 16} {...S} {...p}>
      <circle cx="8" cy="8" r="4" /><path d="M11 11l8 8M16 16l2-2M14 14l2-2" />
    </svg>
  ),
  Pin: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 14} height={p.size || 14} {...S} {...p}>
      <path d="M12 21s-6-5.7-6-10.5A6 6 0 0 1 18 10.5C18 15.3 12 21 12 21z" /><circle cx="12" cy="10.5" r="2" />
    </svg>
  ),
  Paperclip: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 14} height={p.size || 14} {...S} {...p}>
      <path d="M19 11l-7.5 7.5a4 4 0 0 1-5.6-5.6l8-8a2.5 2.5 0 0 1 3.6 3.6l-8 8a1 1 0 0 1-1.5-1.5l7-7" />
    </svg>
  ),
  Inbox: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 28} height={p.size || 28} {...S} {...p}>
      <path d="M4 13l2.5-7.5A2 2 0 0 1 8.4 4h7.2a2 2 0 0 1 1.9 1.5L20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><path d="M4 13h4l1.5 2.5h5L16 13h4" />
    </svg>
  ),
  ArrowRight: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 16} height={p.size || 16} {...S} {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
};

window.Ico = Ico;
