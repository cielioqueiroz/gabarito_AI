'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max: number
  color?: 'blue' | 'emerald' | 'amber' | 'cyan' | 'indigo'
  label?: string
  showPercent?: boolean
  size?: 'sm' | 'md'
}

const colorBar: Record<string, string> = {
  blue:    'bg-[#4A72E8]',
  cyan:    'bg-[#4A72E8]',
  indigo:  'bg-[#4A72E8]',
  emerald: 'bg-emerald-500',
  amber:   'bg-[#4A72E8]',
}
const colorText: Record<string, string> = {
  blue:    'text-[#4A72E8]',
  cyan:    'text-[#4A72E8]',
  indigo:  'text-[#4A72E8]',
  emerald: 'text-emerald-400',
  amber:   'text-[#4A72E8]',
}

export default function ProgressBar({ value, max, color = 'blue', label, showPercent = false, size = 'md' }: ProgressBarProps) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  const count = useMotionValue(0)
  const rounded = useTransform(count, latest => `${Math.round(latest)}%`)
  const [display, setDisplay] = useState('0%')

  useEffect(() => {
    const controls = animate(count, pct, { duration: 0.8, ease: 'easeOut', delay: 0.1 })
    const unsub = rounded.on('change', v => setDisplay(v))
    return () => { controls.stop(); unsub() }
  }, [pct, count, rounded])

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
          )}
          {showPercent && (
            <span className={cn('font-mono text-[10px] uppercase tracking-widest ml-auto', colorText[color])}>
              {display}
            </span>
          )}
        </div>
      )}
      <div
        className={cn('w-full bg-elevated rounded-full overflow-hidden', size === 'sm' ? 'h-1' : 'h-1.5')}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <motion.div
          className={cn('h-full rounded-full', colorBar[color])}
          initial={{ width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
    </div>
  )
}
