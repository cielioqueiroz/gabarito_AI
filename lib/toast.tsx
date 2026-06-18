'use client'

import { createContext, useContext, useCallback, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: number
  type: ToastType
  title: string
  description?: string
}

interface ToastContextValue {
  toast: (t: Omit<Toast, 'id'>) => void
  success: (title: string, description?: string) => void
  error:   (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info:    (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const CONFIG: Record<ToastType, { icon: typeof Info; accent: string; iconColor: string }> = {
  success: { icon: CheckCircle2,  accent: 'bg-emerald-500', iconColor: 'text-emerald-500' },
  error:   { icon: XCircle,       accent: 'bg-red-500',     iconColor: 'text-red-500' },
  warning: { icon: AlertTriangle, accent: 'bg-amber-500',   iconColor: 'text-amber-500' },
  info:    { icon: Info,          accent: 'bg-blue-500',    iconColor: 'text-blue-500' },
}

const DURATION = 4000

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { ...t, id }])
    setTimeout(() => remove(id), DURATION)
  }, [remove])

  const helpers: ToastContextValue = {
    toast,
    success: (title, description) => toast({ type: 'success', title, description }),
    error:   (title, description) => toast({ type: 'error',   title, description }),
    warning: (title, description) => toast({ type: 'warning', title, description }),
    info:    (title, description) => toast({ type: 'info',    title, description }),
  }

  return (
    <ToastContext.Provider value={helpers}>
      {children}

      {/* Viewport */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-xs pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map(t => {
            const { icon: Icon, accent, iconColor } = CONFIG[t.type]
            return (
              <motion.div
                key={t.id}
                layout
                role="alert"
                aria-live="assertive"
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="pointer-events-auto relative overflow-hidden rounded-xl border border-border bg-surface shadow-lg shadow-black/20 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3 p-3.5 pr-9">
                  <Icon size={18} className={`${iconColor} flex-shrink-0 mt-0.5`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground leading-tight">{t.title}</p>
                    {t.description && (
                      <p className="text-xs text-muted mt-0.5 leading-snug">{t.description}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => remove(t.id)}
                  className="absolute top-2.5 right-2.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-elevated transition-colors cursor-pointer"
                  aria-label="Fechar notificação"
                >
                  <X size={13} />
                </button>

                {/* Progress bar */}
                <motion.div
                  className={`absolute bottom-0 left-0 h-0.5 ${accent}`}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: DURATION / 1000, ease: 'linear' }}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>')
  return ctx
}
