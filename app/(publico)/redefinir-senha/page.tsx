import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, Check, PenLine, ShieldCheck } from 'lucide-react'
import ResetPasswordForm from './ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Redefinir senha',
  description: 'Crie uma nova senha para sua conta do gabarito_AI.',
  robots: { index: false, follow: false },
}

const garantias = [
  'O link de recuperação é temporário',
  'A nova senha substitui a anterior',
  'Seus planos e seu progresso continuam intactos',
]

export default function RedefinirSenhaPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent 0, transparent 31px, color-mix(in srgb, var(--c-border) 42%, transparent) 32px)',
            maskImage: 'linear-gradient(to right, #000 0%, #000 55%, transparent 82%)',
            WebkitMaskImage: 'linear-gradient(to right, #000 0%, #000 55%, transparent 82%)',
          }}
        />
        <div className="absolute bottom-0 left-8 top-0 w-px bg-brand/20 sm:left-16" />
      </div>

      <main className="relative mx-auto grid min-h-[100dvh] w-full max-w-[1500px] lg:grid-cols-[minmax(0,1.08fr)_minmax(430px,0.92fr)]">
        <section className="flex min-w-0 flex-col px-5 pb-10 pt-5 sm:px-10 sm:pt-8 lg:px-14 lg:py-10 xl:px-20">
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
              href="/login"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-xs font-bold text-foreground transition-colors hover:border-brand hover:text-brand"
            >
              <ArrowLeft size={14} /> Voltar ao login
            </Link>
          </header>

          <div className="flex flex-1 flex-col justify-center py-12">
            <div className="max-w-2xl">
              <p className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-brand">
                <span className="h-px w-8 bg-brand" />
                Recuperação segura
              </p>
              <h1 className="text-[2.65rem] font-bold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-[4.5rem]">
                Nova senha.
                <span className="mt-1 block text-muted-foreground">Mesmo plano.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-7 text-muted sm:text-base">
                Atualize sua credencial e volte para a preparação exatamente de onde parou. Nenhum concurso, revisão ou estatística é alterado.
              </p>
            </div>

            <div className="mt-10 hidden max-w-xl rounded-lg border border-border bg-surface p-5 shadow-[5px_5px_0_var(--c-border)] sm:p-6 lg:block">
              <div className="flex items-center gap-3 border-b border-border pb-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-brand/25 bg-brand/10 text-brand">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Proteção da conta</p>
                  <p className="mt-1 text-sm font-bold">Seu histórico permanece protegido</p>
                </div>
              </div>
              <ul className="mt-5 space-y-3">
                {garantias.map(garantia => (
                  <li key={garantia} className="flex items-center gap-3 text-sm text-foreground">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/[0.08] text-emerald-300">
                      <Check size={13} />
                    </span>
                    {garantia}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground lg:block">
            acesso protegido · supabase auth · isolamento por usuário
          </p>
        </section>

        <section className="relative flex min-w-0 items-center justify-center border-t border-border bg-surface px-5 py-12 sm:px-10 lg:min-h-[100dvh] lg:border-l lg:border-t-0 lg:px-12 xl:px-16">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <span className="absolute right-8 top-8 hidden font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground lg:block">credencial / 02</span>
          </div>
          <div className="relative w-full max-w-[440px]">
            <ResetPasswordForm />
            <p className="mt-8 text-center text-[11px] text-muted-foreground">
              © {new Date().getFullYear()} Cielio Queiroz · seus estudos continuam seguros
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
