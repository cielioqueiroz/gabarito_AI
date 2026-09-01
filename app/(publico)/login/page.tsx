import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowUpRight,
  BookOpenCheck,
  BrainCircuit,
  Check,
  FileText,
  PenLine,
  Repeat2,
} from 'lucide-react'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Entre no gabarito_AI e continue seu plano de estudos para concursos públicos.',
  robots: { index: false, follow: true },
}

const etapas = [
  { numero: '01', titulo: 'Edital lido', detalhe: 'conteúdo organizado pela IA', icon: FileText },
  { numero: '02', titulo: 'Plano em ação', detalhe: 'prioridades no ritmo da prova', icon: BookOpenCheck },
  { numero: '03', titulo: 'Revisão no ponto', detalhe: 'Leitner antes de esquecer', icon: Repeat2 },
]

const topicos = [
  { nome: 'Direito Constitucional', progresso: 78, cor: 'bg-brand' },
  { nome: 'Língua Portuguesa', progresso: 61, cor: 'bg-brand' },
  { nome: 'Raciocínio Lógico', progresso: 43, cor: 'bg-brand-solid' },
]

export default function LoginPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent 0, transparent 31px, color-mix(in srgb, var(--c-border) 42%, transparent) 32px)',
            maskImage: 'linear-gradient(to right, #000 0%, #000 56%, transparent 82%)',
            WebkitMaskImage: 'linear-gradient(to right, #000 0%, #000 56%, transparent 82%)',
          }}
        />
        <div className="absolute bottom-0 left-8 top-0 w-px bg-brand/20 sm:left-16" />
      </div>

      <main className="relative mx-auto grid min-h-[100dvh] w-full max-w-[1600px] lg:grid-cols-[minmax(0,1.12fr)_minmax(440px,0.88fr)]">
        <section className="relative flex min-w-0 flex-col px-5 pb-8 pt-5 sm:px-10 sm:pt-8 lg:min-h-[100dvh] lg:px-14 lg:pb-10 lg:pt-10 xl:px-20">
          <header className="flex items-center justify-between">
            <Link href="/sobre" className="group inline-flex items-center gap-3" aria-label="gabarito_AI — página inicial">
              <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand-solid text-white shadow-[3px_3px_0_var(--c-ink)] transition-transform duration-200 group-hover:-rotate-2">
                <PenLine size={18} strokeWidth={2.2} />
              </span>
              <span className="font-mono text-[15px] font-bold tracking-[-0.03em]">
                gabarito<span className="text-brand">_AI</span>
              </span>
            </Link>

            <Link
              href="/sobre"
              aria-label="Conheça o método gabarito_AI"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-xs font-semibold text-foreground transition-colors hover:border-brand hover:text-brand sm:w-auto sm:gap-1.5 sm:px-4"
            >
              <span className="hidden sm:inline">Conheça o método</span> <ArrowUpRight size={14} />
            </Link>
          </header>

          <div className="flex flex-1 flex-col justify-center pb-2 pt-12 sm:pt-16 lg:py-12">
            <div className="max-w-3xl">
              <p className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-brand">
                <span className="h-px w-8 bg-brand" />
                Sua preparação, com método
              </p>
              <h1 className="max-w-[760px] text-[2.6rem] font-bold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-[4.3rem] xl:text-[5rem]">
                O edital vira plano.
                <span className="mt-1 block text-muted-foreground">O plano vira rotina.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-7 text-muted sm:text-base">
                Um console de estudos que organiza o que cai, mostra o que revisar e mantém sua preparação avançando todos os dias.
              </p>
            </div>

            <div className="relative mt-10 hidden max-w-[760px] lg:block xl:mt-12">
              <div className="relative overflow-hidden rounded-lg border border-border bg-surface shadow-[5px_5px_0_var(--c-border)]">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand/25 bg-brand/10">
                      <BrainCircuit size={17} className="text-brand" />
                    </span>
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Dossiê de estudo</p>
                      <p className="mt-0.5 text-sm font-bold">Analista Judiciário · Área Administrativa</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700/25 bg-emerald-700/[0.08] px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> ativo
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_220px]">
                  <div className="space-y-4 p-6">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Progresso do edital</p>
                        <p className="mt-1 text-2xl font-bold tracking-tight">64% concluído</p>
                      </div>
                      <span className="font-mono text-[10px] text-brand">+12% esta semana</span>
                    </div>

                    <div className="space-y-3">
                      {topicos.map(topico => (
                        <div key={topico.nome}>
                          <div className="mb-1.5 flex justify-between text-[11px]">
                            <span className="text-foreground">{topico.nome}</span>
                            <span className="font-mono text-muted-foreground">{topico.progresso}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                            <div className={`h-full rounded-full ${topico.cor}`} style={{ width: `${topico.progresso}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-l border-border bg-surface p-5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Próxima sessão</p>
                    <p className="mt-4 text-4xl font-bold tracking-[-0.06em]">18</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">cards para revisar</p>
                    <div className="my-5 h-px bg-border" />
                    <div className="space-y-2 text-[11px] text-muted">
                      <p className="flex items-center gap-2"><Check size={13} className="text-brand" /> 8 questões comentadas</p>
                      <p className="flex items-center gap-2"><Check size={13} className="text-brand" /> 24 min estimados</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden grid-cols-3 border-t border-border pt-6 lg:grid">
            {etapas.map(etapa => {
              const Icon = etapa.icon
              return (
                <div key={etapa.numero} className="flex items-center gap-3 border-r border-border px-5 first:pl-0 last:border-r-0">
                  <span className="font-mono text-[10px] text-muted-foreground">{etapa.numero}</span>
                  <Icon size={15} className="text-brand" />
                  <div>
                    <p className="text-xs font-bold text-foreground">{etapa.titulo}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{etapa.detalhe}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="relative flex min-w-0 items-center justify-center border-t border-border bg-surface px-5 py-10 sm:px-10 lg:min-h-[100dvh] lg:border-l lg:border-t-0 lg:px-12 xl:px-16">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <span className="absolute right-8 top-8 hidden font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground lg:block">acesso seguro / 01</span>
          </div>
          <div className="relative w-full max-w-[440px]">
            <LoginForm />
            <p className="mt-8 text-center text-[11px] text-muted-foreground">
              © {new Date().getFullYear()} Cielio Queiroz · feito para quem estuda com propósito
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
