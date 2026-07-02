import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A72E8] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:     'bg-[#4A72E8] text-[#FFFFFF] font-bold hover:bg-[#6C8DF0] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_10px_-2px_rgba(0,0,0,0.5)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_16px_-2px_rgba(74,114,232,0.35)]',
        destructive: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20',
        outline:     'border border-border bg-transparent text-muted hover:bg-elevated hover:text-foreground hover:border-[#34343F]',
        secondary:   'bg-elevated text-muted hover:bg-border hover:text-foreground shadow-[0_2px_8px_-4px_rgba(0,0,0,0.5)]',
        ghost:       'text-muted hover:bg-elevated hover:text-foreground',
        link:        'text-[#4A72E8] underline-offset-4 hover:underline hover:text-[#A8BCF8]',
        amber:       'bg-[#4A72E8] text-[#FFFFFF] font-bold hover:bg-[#6C8DF0] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_10px_-2px_rgba(0,0,0,0.5)]',
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
