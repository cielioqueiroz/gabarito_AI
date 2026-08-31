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
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#0D0E13] text-[#F4F4F0]">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'linear-gradient(to right, #000 0%, #000 55%, transparent 86%)',
            WebkitMaskImage: 'linear-gradient(to right, #000 0%, #000 55%, transparent 86%)',
          }}
        />
        <div className="absolute -left-64 top-1/4 h-[620px] w-[620px] rounded-full bg-[#3556C4]/10 blur-[150px]" />
        <div className="absolute right-[24%] top-[-12rem] h-[30rem] w-px rotate-[24deg] bg-gradient-to-b from-transparent via-[#4A72E8]/30 to-transparent" />
      </div>

      <main className="relative mx-auto grid min-h-[100dvh] w-full max-w-[1500px] lg:grid-cols-[minmax(0,1.08fr)_minmax(430px,0.92fr)]">
        <section className="flex min-w-0 flex-col px-5 pb-10 pt-5 sm:px-10 sm:pt-8 lg:px-14 lg:py-10 xl:px-20">
          <header className="flex items-center justify-between">
            <Link href="/sobre" className="group inline-flex items-center gap-3" aria-label="gabarito_AI — página inicial">
              <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#4064D8] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_10px_30px_-12px_rgba(74,114,232,0.8)] transition-transform duration-200 group-hover:-rotate-3">
                <PenLine size={18} strokeWidth={2.2} />
              </span>
              <span className="font-mono text-[15px] font-bold tracking-[-0.03em]">
                gabarito<span className="text-[#A8BCF8]">_AI</span>
              </span>
            </Link>

            <Link
              href="/login"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#2A2C35] bg-[#15161C]/70 px-4 text-xs font-bold text-[#B8B9C2] transition-colors hover:border-[#4A72E8]/45 hover:text-white"
            >
              <ArrowLeft size={14} /> Voltar ao login
            </Link>
          </header>

          <div className="flex flex-1 flex-col justify-center py-12">
            <div className="max-w-2xl">
              <p className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#A8BCF8]">
                <span className="h-px w-8 bg-[#4A72E8]" />
                Recuperação segura
              </p>
              <h1 className="text-[2.65rem] font-bold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-[4.5rem]">
                Nova senha.
                <span className="mt-1 block text-[#858792]">Mesmo plano.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-7 text-[#A5A6AF] sm:text-base">
                Atualize sua credencial e volte para a preparação exatamente de onde parou. Nenhum concurso, revisão ou estatística é alterado.
              </p>
            </div>

            <div className="mt-10 hidden max-w-xl rounded-[1.5rem] border border-[#292B34] bg-[#15161C]/80 p-5 shadow-[0_30px_70px_-45px_rgba(0,0,0,0.95)] backdrop-blur-sm sm:p-6 lg:block">
              <div className="flex items-center gap-3 border-b border-[#292B34] pb-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#4A72E8]/25 bg-[#4A72E8]/10 text-[#8BA7F5]">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#8D8F99]">Proteção da conta</p>
                  <p className="mt-1 text-sm font-bold">Seu histórico permanece protegido</p>
                </div>
              </div>
              <ul className="mt-5 space-y-3">
                {garantias.map(garantia => (
                  <li key={garantia} className="flex items-center gap-3 text-sm text-[#B6B7BE]">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/[0.08] text-emerald-300">
                      <Check size={13} />
                    </span>
                    {garantia}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-[#686A75] lg:block">
            acesso protegido · supabase auth · isolamento por usuário
          </p>
        </section>

        <section className="relative flex min-w-0 items-center justify-center border-t border-[#282A33] bg-[#121318]/90 px-5 py-12 backdrop-blur-sm sm:px-10 lg:min-h-[100dvh] lg:border-l lg:border-t-0 lg:px-12 xl:px-16">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-[#4A72E8]/[0.055] blur-[100px]" />
            <span className="absolute right-8 top-8 hidden font-mono text-[9px] uppercase tracking-[0.25em] text-[#454751] lg:block">credencial / 02</span>
          </div>
          <div className="relative w-full max-w-[440px]">
            <ResetPasswordForm />
            <p className="mt-8 text-center text-[11px] text-[#858792]">
              © {new Date().getFullYear()} Cielio Queiroz · seus estudos continuam seguros
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
