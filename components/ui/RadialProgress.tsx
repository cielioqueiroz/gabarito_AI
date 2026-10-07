'use client'

interface Props {
  value: number
  max: number
  size?: number
  stroke?: number
  gradient?: 'emerald' | 'cyan'
  label: string
}

// Traço sólido (sem gradiente de marca, por decisão de identidade). Cobalto para
// a meta do plano; verde para domínio — ambos theme-aware via currentColor.
const TONE: Record<string, string> = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  cyan:    'text-brand',
}

export function RadialProgress({ value, max, size = 66, stroke = 6, gradient = 'emerald', label }: Props) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className={`-rotate-90 ${TONE[gradient]}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-border)" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">{pct}%</span>
      </div>
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  )
}
