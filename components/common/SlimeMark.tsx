/** The VectorSlime mark: the slime tutor in its mortarboard (same art as app/icon.svg, without the tile). */
export default function SlimeMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="16 20 96 94" width={size} height={size} className={className} aria-hidden>
      <defs>
        <linearGradient id="slime-mark-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b6f5c4" />
          <stop offset="0.45" stopColor="#4fd27e" />
          <stop offset="1" stopColor="#22a456" />
        </linearGradient>
      </defs>
      <path
        d="M20 104 C20 72 38 52 64 52 C90 52 108 72 108 104 C108 110 100 111 64 111 C28 111 20 110 20 104 Z"
        fill="url(#slime-mark-body)"
        stroke="rgba(14,84,44,0.55)"
        strokeWidth="2"
      />
      <ellipse cx="38" cy="72" rx="9" ry="4" transform="rotate(-38 38 72)" fill="#fff" opacity="0.55" />
      <ellipse cx="40" cy="92" rx="5.5" ry="3" fill="#ff9eb6" opacity="0.85" />
      <ellipse cx="88" cy="92" rx="5.5" ry="3" fill="#ff9eb6" opacity="0.85" />
      <ellipse cx="52" cy="82" rx="5" ry="6.5" fill="#0f2418" />
      <ellipse cx="76" cy="82" rx="5" ry="6.5" fill="#0f2418" />
      <circle cx="50.4" cy="79.2" r="1.9" fill="#fff" />
      <circle cx="74.4" cy="79.2" r="1.9" fill="#fff" />
      <path d="M57 93 Q64 99 71 93" fill="none" stroke="#5b1f2a" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M45 40 L83 40 L81 55 Q64 59 47 55 Z" fill="#1f2228" />
      <path d="M26 39 L64 28 L102 39 L64 50 Z" fill="#1f2228" />
      <path d="M26 36 L64 25 L102 36 L64 47 Z" fill="#363b46" stroke="#4b515c" strokeWidth="1.2" />
      <path d="M64 36 L98 37 Q101 44 100 52" fill="none" stroke="#f4c74f" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="64" cy="36" r="2.6" fill="#f4c74f" />
      <rect x="96.5" y="50" width="7" height="12" rx="2.4" fill="#f4c74f" />
    </svg>
  );
}
