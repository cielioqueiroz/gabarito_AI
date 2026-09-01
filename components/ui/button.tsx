import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/* O vermelho de revisão sólido (#B33A2B) mantém 5.9:1 com texto branco.
   Para texto e foco, `brand` troca de tom entre papel claro e carbono escuro. */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:translate-y-px [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:     'bg-brand-solid text-[#FFFFFF] font-bold shadow-[2px_2px_0_var(--c-ink)] hover:brightness-110',
        destructive: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20',
        outline:     'border border-border bg-transparent text-muted hover:bg-elevated hover:text-foreground hover:border-border',
        secondary:   'bg-elevated text-muted hover:bg-border hover:text-foreground shadow-[0_2px_8px_-4px_rgba(0,0,0,0.5)]',
        ghost:       'text-muted hover:bg-elevated hover:text-foreground',
        link:        'text-brand underline-offset-4 hover:underline hover:text-foreground',
        amber:       'bg-brand-solid text-[#FFFFFF] font-bold shadow-[2px_2px_0_var(--c-ink)] hover:brightness-110',
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
