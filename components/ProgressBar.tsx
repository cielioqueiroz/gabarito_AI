'use client'

interface ProgressBarProps {
  value: number
  max: number
  color?: 'blue' | 'emerald' | 'amber'
  label?: string
  showPercent?: boolean
  size?: 'sm' | 'md'
}

const colorClasses = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-400',
}

export default function ProgressBar({
  value,
  max,
  color = 'blue',
  label,
  showPercent = false,
  size = 'md',
}: ProgressBarProps) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
              {label}
            </span>
          )}
          {showPercent && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 ml-auto">
              {pct}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-slate-100 rounded-full overflow-hidden ${size === 'sm' ? 'h-1.5' : 'h-2'}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none ${colorClasses[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
