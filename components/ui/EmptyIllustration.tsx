interface Props { variant?: 'books' | 'cards' | 'chart' | 'target'; className?: string }

export function EmptyIllustration({ variant = 'books', className }: Props) {
  const svg = variant === 'cards' ? cards : variant === 'chart' ? chart : variant === 'target' ? target : books
  return (
    <div className={className} aria-hidden>
      {svg}
    </div>
  )
}

const books = (
  <svg viewBox="0 0 200 160" className="w-full h-auto max-w-[220px] mx-auto">
    <defs>
      <linearGradient id="bookg1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4A72E8" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#4A72E8" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    <rect x="30" y="110" width="140" height="4" rx="2" fill="currentColor" opacity="0.3"/>
    <g transform="translate(50 40)">
      <rect x="0" y="0" width="30" height="70" rx="3" fill="url(#bookg1)" stroke="#4A72E8" strokeOpacity="0.4"/>
      <rect x="35" y="10" width="30" height="60" rx="3" fill="url(#bookg1)" stroke="#4A72E8" strokeOpacity="0.5"/>
      <rect x="70" y="5"  width="30" height="65" rx="3" fill="url(#bookg1)" stroke="#4A72E8" strokeOpacity="0.4"/>
    </g>
    <circle cx="150" cy="55" r="6" fill="#4A72E8" opacity="0.8"/>
    <circle cx="160" cy="45" r="3" fill="#4A72E8" opacity="0.5"/>
  </svg>
)

const cards = (
  <svg viewBox="0 0 200 160" className="w-full h-auto max-w-[220px] mx-auto">
    <g transform="rotate(-6 100 90)">
      <rect x="30" y="30" width="140" height="90" rx="10" fill="#17171D" stroke="#4A72E8" strokeOpacity="0.3"/>
    </g>
    <g transform="rotate(3 100 90)">
      <rect x="35" y="35" width="130" height="80" rx="10" fill="#1F1F28" stroke="#4A72E8" strokeOpacity="0.5"/>
      <rect x="55" y="60" width="90" height="4" rx="2" fill="#4A72E8" opacity="0.7"/>
      <rect x="55" y="72" width="60" height="3" rx="2" fill="#94A3B8" opacity="0.5"/>
      <rect x="55" y="82" width="70" height="3" rx="2" fill="#94A3B8" opacity="0.5"/>
    </g>
  </svg>
)

const chart = (
  <svg viewBox="0 0 200 160" className="w-full h-auto max-w-[220px] mx-auto">
    <line x1="30" y1="130" x2="180" y2="130" stroke="currentColor" strokeOpacity="0.3"/>
    <line x1="30" y1="30"  x2="30"  y2="130" stroke="currentColor" strokeOpacity="0.3"/>
    <rect x="50"  y="80" width="18" height="50" rx="3" fill="#4A72E8" opacity="0.4"/>
    <rect x="75"  y="60" width="18" height="70" rx="3" fill="#4A72E8" opacity="0.7"/>
    <rect x="100" y="40" width="18" height="90" rx="3" fill="#10B981" opacity="0.8"/>
    <rect x="125" y="70" width="18" height="60" rx="3" fill="#4A72E8" opacity="0.5"/>
    <rect x="150" y="50" width="18" height="80" rx="3" fill="#10B981" opacity="0.9"/>
  </svg>
)

const target = (
  <svg viewBox="0 0 200 160" className="w-full h-auto max-w-[220px] mx-auto">
    <circle cx="100" cy="80" r="55" fill="none" stroke="#4A72E8" strokeOpacity="0.2" strokeWidth="2"/>
    <circle cx="100" cy="80" r="35" fill="none" stroke="#4A72E8" strokeOpacity="0.4" strokeWidth="2"/>
    <circle cx="100" cy="80" r="15" fill="#4A72E8" opacity="0.7"/>
    <circle cx="100" cy="80" r="4"  fill="#F1F5F9"/>
  </svg>
)
