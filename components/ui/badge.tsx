import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-[#E9C92F] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-[#C9A81D]/20 text-[#E9C92F]',
        secondary:   'border-transparent bg-elevated text-muted',
        destructive: 'border-transparent bg-red-500/10 text-red-500',
        outline:     'border-border text-muted',
        amber:       'border-transparent bg-[#E9C92F]/10 text-[#E9C92F]',
        emerald:     'border-transparent bg-emerald-500/10 text-emerald-500',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
