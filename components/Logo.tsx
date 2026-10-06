import { cn } from '@/lib/utils'

// Símbolo: a bolha do cartão-resposta — anel de tinta (currentColor) + centro
// cobalto preenchido (a alternativa marcada). É o ícone do app e a assinatura
// da marca. A cor do anel segue o texto do contexto (text-foreground/-muted…).
export function Logomark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.4" className="fill-brand" />
    </svg>
  )
}

const WORD = { sm: 'text-sm', md: 'text-xl', lg: 'text-3xl' }
const DOT = { sm: 'h-[5px] w-[5px]', md: 'h-[7px] w-[7px]', lg: 'h-2.5 w-2.5' }
const TAG = { sm: 'text-[8px]', md: 'text-[9px]', lg: 'text-[11px]' }

// Wordmark: "gabarito" em serifa editorial + a bolha cobalto como ponto final +
// "AI" numa tag mono discreta. Substitui o antigo "gabarito_AI" com cursor
// piscando (leitura de "startup de IA" — o que estávamos fugindo).
export function Wordmark({
  size = 'md',
  className,
}: {
  size?: keyof typeof WORD
  className?: string
}) {
  return (
    <span
      className={cn('inline-flex items-baseline font-display leading-none text-foreground', WORD[size], className)}
    >
      gabarito
      <span className={cn('mx-[3px] self-end mb-[0.14em] rounded-full bg-brand', DOT[size])} aria-hidden="true" />
      <span className={cn('font-mono font-semibold uppercase tracking-[0.14em] text-muted-foreground', TAG[size])}>
        AI
      </span>
    </span>
  )
}
