'use client'

import { useId } from 'react'

interface Props {
  value: number
  max: number
  size?: number
  stroke?: number
  gradient?: 'emerald' | 'cyan'
  label: string
}

const STOPS: Record<string, [string, string]> = {
  emerald: ['#4ADE80', '#22C55E'],   // domínio / sucesso (verde)
  cyan:    ['#F8E97E', '#F2D53C'],    // meta do plano (ouro)
}

export function RadialProgress({ value, max, size = 66, stroke = 6, gradient = 'emerald', label }: Props) {
  const uid = useId()
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const [from, to] = STOPS[gradient]

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(51,65,85,0.45)" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={`url(#${uid})`} strokeWidth={stroke} strokeLinecap="round"
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
