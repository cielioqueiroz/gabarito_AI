'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max: number
  color?: 'blue' | 'emerald' | 'amber'
  label?: string
  showPercent?: boolean
  size?: 'sm' | 'md'
}

const colorBar: Record<string, string> = {
  blue:    'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-400',
}
const colorText: Record<string, string> = {
  blue:    'text-blue-400',
  emerald: 'text-emerald-400',
  amber:   'text-amber-400',
}

export default function ProgressBar({ value, max, color = 'blue', label, showPercent = false, size = 'md' }: ProgressBarProps) {
  const pct    = max === 0 ? 0 : Math.round((value / max) * 100)
  const barRef = useRef<HTMLDivElement>(null)
  const numRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!barRef.current) return
    gsap.fromTo(
      barRef.current,
      { width: '0%' },
      { width: `${pct}%`, duration: 0.8, ease: 'power2.out', delay: 0.1 }
    )
    if (numRef.current) {
      const obj = { val: 0 }
      gsap.fromTo(
        obj,
        { val: 0 },
        {
          val: pct,
          duration: 0.8,
          ease: 'power2.out',
          delay: 0.1,
          onUpdate() { if (numRef.current) numRef.current.textContent = `${Math.round(obj.val)}%` },
        }
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct])

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#475569]">{label}</span>
          )}
          {showPercent && (
            <span ref={numRef} className={cn('font-mono text-[10px] uppercase tracking-widest ml-auto', colorText[color])}>
              {pct}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn('w-full bg-[#252836] rounded-full overflow-hidden', size === 'sm' ? 'h-1' : 'h-1.5')}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          ref={barRef}
          className={cn('h-full rounded-full', colorBar[color])}
          style={{ width: '0%' }}
        />
      </div>
    </div>
  )
}
