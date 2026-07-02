import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:     'bg-[#E8A93C] text-[#0E1B33] font-bold hover:bg-[#F0BA5A] shadow-sm shadow-amber-900/30',
        destructive: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20',
        outline:     'border border-border bg-transparent text-muted hover:bg-elevated hover:text-foreground',
        secondary:   'bg-elevated text-muted hover:bg-border hover:text-foreground',
        ghost:       'text-muted hover:bg-elevated hover:text-foreground',
        link:        'text-amber-400 underline-offset-4 hover:underline hover:text-amber-300',
        amber:       'bg-[#E8A93C] text-[#0E1B33] font-bold hover:bg-[#F0BA5A] shadow-sm',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm:      'h-7 rounded-md px-3 text-xs',
        lg:      'h-11 rounded-lg px-6',
        icon:    'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
