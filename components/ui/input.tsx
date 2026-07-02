import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-lg border border-border bg-elevated px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus:border-[#F2D53C]/80 focus-visible:ring-2 focus-visible:ring-[#F2D53C]/20 focus-visible:border-[#F2D53C]/60 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-rose-500 aria-[invalid=true]:focus-visible:ring-rose-500/20',
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = 'Input'

const FieldError = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    if (!children) return null
    return (
      <p
        ref={ref}
        role="alert"
        className={cn('flex items-center gap-1 text-[11px] text-red-500 mt-1', className)}
        {...props}
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
          <path d="M8 16A8 8 0 108 0a8 8 0 000 16zM7 4a1 1 0 112 0v5a1 1 0 11-2 0V4zm1 8.5a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z" />
        </svg>
        {children}
      </p>
    )
  }
)
FieldError.displayName = 'FieldError'

export { Input, FieldError }
