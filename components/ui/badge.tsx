import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-blue-600/20 text-blue-400',
        secondary: 'border-transparent bg-[#252836] text-[#94A3B8]',
        destructive: 'border-transparent bg-red-500/10 text-red-400',
        outline: 'border-[#2A2D3E] text-[#94A3B8]',
        amber: 'border-transparent bg-amber-500/10 text-amber-400',
        emerald: 'border-transparent bg-emerald-500/10 text-emerald-400',
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
