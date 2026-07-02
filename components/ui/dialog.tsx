'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  hideClose?: boolean
}

export function Dialog({ open, onClose, title, description, children, className, hideClose }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstFocusable = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    firstFocusable.current = dialogRef.current?.querySelector<HTMLElement>('button, input, [href]') ?? null
    firstFocusable.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'dialog-title' : undefined}
          aria-describedby={description ? 'dialog-desc' : undefined}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className={cn(
              'relative w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl',
              className
            )}
          >
            {!hideClose && (
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-elevated cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A72E8]"
              >
                <X size={14} />
              </button>
            )}
            {(title || description) && (
              <div className="px-6 pt-6 pb-2">
                {title && <h2 id="dialog-title" className="font-bold text-foreground text-base">{title}</h2>}
                {description && <p id="dialog-desc" className="text-sm text-muted-foreground mt-1">{description}</p>}
              </div>
            )}
            <div className="px-6 pb-6 pt-2">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
