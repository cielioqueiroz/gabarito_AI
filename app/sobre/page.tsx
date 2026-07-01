import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Sparkles, BookOpen, Brain, BarChart3, Zap, Lock,
  Upload, ArrowRight, Check, Layers, Repeat, Terminal,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'gabarito_AI — estude concursos com IA',
  description: 'Suba o edital em PDF, a IA organiza tudo em disciplinas, flashcards e questões comentadas. Estude com repetição espaçada (Leitner).',
  alternates: { canonical: '/sobre' },
  openGraph: {
    title: 'gabarito_AI — estude concursos com IA',
    description: 'Console de estudos para concursos públicos com IA. Suba o edital e a IA monta seu plano.',
    type: 'website',
    url: '/sobre',
    siteName: 'gabarito_AI',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'gabarito_AI',
    description: 'Console de estudos para concursos públicos com IA.',
  },
}

const features = [
  { icon: Sparkles, title: 'Suba o edital', description: 'PDF ou TXT. A IA extrai disciplinas e tópicos em segundos.' },
  { icon: Brain, title: 'Repetição espaçada', description: 'Sistema Leitner com 5 caixas e agendamento automático de revisão.' },
  { icon: BookOpen, title: 'Flashcards e questões', description: 'Geração ilimitada com Claude, com gabarito e explicação comentada.' },
  { icon: BarChart3, title: 'Estatísticas reais', description: 'Taxa de acerto por disciplina e evolução dos últimos 7 dias.' },
  { icon: Zap, title: 'Streaming ao vivo', description: 'Veja o plano aparecendo em tempo real durante a geração.' },
  { icon: Lock, title: 'Privado e seguro', description: 'Seus dados protegidos por Row Level Security no PostgreSQL.' },
]

const steps = [
  { icon: Upload, n: '01', title: 'Suba o edital', description: 'Arraste o PDF ou TXT. Sem formatação especial — a IA lê o edital como está.' },
  { icon: Terminal, n: '02', title: 'A IA estrutura', description: 'Claude extrai disciplinas, tópicos e monta seu plano de estudos automaticamente.' },
  { icon: Repeat, n: '03', title: 'Estude com método', description: 'Flashcards e questões comentadas, agendados pelo sistema Leitner de repetição espaçada.' },
  { icon: BarChart3, n: '04', title: 'Acompanhe e conquiste', description: 'Progresso por disciplina, cards dominados e taxa de acerto — no ritmo certo.' },
]

const leitner = [
  { box: 1, label: 'Aprendendo', dias: '1 dia' },
  { box: 2, label: 'Revisando', dias: '2 dias' },
  { box: 3, label: 'Fixando', dias: '4 dias' },
  { box: 4, label: 'Dominando', dias: '7 dias' },
  { box: 5, label: 'Dominado', dias: '15 dias' },
]

const faqs = [
  { q: 'Preciso pagar alguma coisa?', a: 'Não. O gabarito_AI é um projeto aberto (MIT). Você roda com suas próprias chaves de Supabase e Anthropic.' },
  { q: 'Que tipo de arquivo o edital pode ser?', a: 'PDF ou TXT de até 5 MB. A IA extrai o texto e organiza em disciplinas e tópicos, sem você precisar formatar nada.' },
  { q: 'Como funciona a repetição espaçada?', a: 'Usamos o método Leitner com 5 caixas. Cada acerto avança o card para uma caixa com intervalo maior (1, 2, 4, 7 e 15 dias); um erro devolve para a caixa 1.' },
  { q: 'Posso estudar para mais de um concurso?', a: 'Sim. Cada concurso tem seu próprio plano, flashcards e questões, e a Revisão do Dia cruza os cards vencidos de todos eles.' },
  { q: 'Meus dados ficam seguros?', a: 'Ficam. Todas as tabelas têm Row Level Security no PostgreSQL, então cada usuário só acessa os próprios dados.' },
]

const tech = ['Next.js 16', 'Claude (Anthropic)', 'Supabase', 'PostgreSQL + RLS', 'Sistema Leitner']

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-[#0F1117] text-[#F1F5F9] overflow-x-hidden">
      {/* Atmosphere: grid + blue glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(#2A2D3E 1px, transparent 1px), linear-gradient(90deg, #2A2D3E 1px, transparent 1px)',
            backgroundSize: '54px 54px',
            maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, #000 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, #000 40%, transparent 100%)',
          }}
        />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[820px] rounded-full bg-[#2563EB]/15 blur-[120px]" />
      </div>

      {/* ── Floating nav ── */}
      <header className="sticky top-4 z-50 px-4">
        <nav className="mx-auto flex h-14 max-w-3xl items-center justify-between rounded-full border border-[#2A2D3E] bg-[#12141c]/70 px-3 pl-5 backdrop-blur-xl shadow-lg shadow-black/30">
          <Link href="/sobre" className="font-mono text-sm font-bold tracking-tight">
            gabarito<span className="text-blue-500">_AI</span>
            <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-blue-500 animate-blink" />
          </Link>
          <div className="hidden items-center gap-6 sm:flex">
            <a href="#como-funciona" className="text-sm text-[#94A3B8] transition-colors hover:text-[#F1F5F9]">Como funciona</a>
            <a href="#recursos" className="text-sm text-[#94A3B8] transition-colors hover:text-[#F1F5F9]">Recursos</a>
            <a href="#faq" className="text-sm text-[#94A3B8] transition-colors hover:text-[#F1F5F9]">FAQ</a>
          </div>
          <Link
            href="/login"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Entrar <ArrowRight size={14} />
          </Link>
        </nav>
      </header>

      <main className="relative z-10">
        {/* ── Hero ── */}
        <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center sm:pt-28">
          <span className="fade-up inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_2px] shadow-blue-400/50" />
            Console de estudos para concursos
          </span>

          <h1 className="fade-up mx-auto mt-7 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl" style={{ animationDelay: '80ms' }}>
            Transforme o edital em um<br className="hidden sm:block" />{' '}
            <span className="text-gradient-blue">plano de estudos com IA.</span>
          </h1>

          <p className="fade-up mx-auto mt-6 max-w-xl text-base text-[#94A3B8] sm:text-lg" style={{ animationDelay: '160ms' }}>
            Suba o PDF do edital e o Claude organiza tudo em disciplinas, flashcards e
            questões comentadas. Você estuda com repetição espaçada, no ritmo certo.
          </p>

          <div className="fade-up mt-9 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '240ms' }}>
            <Link
              href="/login"
              className="group inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-7 font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-500/40"
            >
              <Sparkles size={17} /> Começar grátis
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#2A2D3E] bg-[#1C1F2E]/60 px-6 font-semibold text-[#F1F5F9] backdrop-blur-sm transition-colors hover:border-blue-500/40"
            >
              Já tenho conta
            </Link>
          </div>

          {/* ── Product mockup (fade-up on wrapper, float-y on inner — the two
               animations can't share one element: both set `animation`) ── */}
          <div className="fade-up mt-16 sm:mt-20" style={{ animationDelay: '340ms' }}>
            <div className="float-y relative mx-auto max-w-4xl">
              <div aria-hidden className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-blue-600/10 blur-3xl" />
              <div className="relative rounded-2xl border border-[#343850] bg-[#181b26] p-2 shadow-2xl shadow-black/70">
              {/* window chrome */}
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 truncate font-mono text-xs text-[#475569]">gabarito_AI — Banco do Brasil · Agente de Tecnologia</span>
                <span className="ml-auto hidden items-center gap-1.5 rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-blue-300 sm:inline-flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" /> IA ativa
                </span>
              </div>

              <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-[#2A2D3E] sm:grid-cols-[190px_1fr]">
                {/* sidebar */}
                <div className="hidden flex-col gap-1 bg-[#14161f] p-3 text-left sm:flex">
                  <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-[#475569]">Disciplinas</p>
                  {[
                    ['Língua Portuguesa', true],
                    ['Raciocínio Lógico', true],
                    ['Segurança da Informação', false],
                    ['Banco de Dados', false],
                    ['Redes de Computadores', false],
                  ].map(([d, active]) => (
                    <div
                      key={d as string}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                        active ? 'bg-blue-500/10 text-[#F1F5F9]' : 'text-[#94A3B8]'
                      }`}
                    >
                      <Layers size={13} className={active ? 'text-blue-400' : 'text-[#475569]'} />
                      <span className="truncate">{d as string}</span>
                    </div>
                  ))}
                </div>

                {/* main panel */}
                <div className="bg-[#161822] p-4 text-left sm:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-blue-400">Plano de estudos</p>
                      <p className="text-sm font-semibold text-[#F1F5F9]">Segurança da Informação</p>
                    </div>
                    <span className="rounded-md bg-[#1C1F2E] px-2 py-1 font-mono text-[10px] text-[#94A3B8]">gerado em 24s</span>
                  </div>

                  {/* progress */}
                  <div className="mb-4">
                    <div className="mb-1.5 flex justify-between font-mono text-[10px] text-[#94A3B8]">
                      <span>Progresso</span><span className="text-blue-400">62%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#252836]">
                      <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-blue-500 to-blue-400" />
                    </div>
                  </div>

                  {/* topic checklist */}
                  <div className="space-y-1.5">
                    {[
                      ['Criptografia simétrica e assimétrica', true],
                      ['Certificação digital e PKI', true],
                      ['Ataques e vulnerabilidades', false],
                      ['Políticas de segurança (ISO 27001)', false],
                    ].map(([topic, done]) => (
                      <div key={topic as string} className="flex items-center gap-2.5 rounded-lg bg-[#1C1F2E]/60 px-3 py-2">
                        <span className={`flex h-4 w-4 items-center justify-center rounded ${done ? 'bg-blue-500' : 'border border-[#2A2D3E] bg-[#252836]'}`}>
                          {done ? <Check size={11} className="text-white" /> : null}
                        </span>
                        <span className={`text-xs ${done ? 'text-[#94A3B8] line-through' : 'text-[#F1F5F9]'}`}>{topic as string}</span>
                      </div>
                    ))}
                  </div>

                  {/* chips */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['12 Flashcards', '8 Questões', 'Revisão do dia'].map(c => (
                      <span key={c} className="rounded-lg border border-[#2A2D3E] bg-[#1C1F2E] px-2.5 py-1 font-mono text-[11px] text-[#94A3B8]">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* tech strip (honest proof) */}
          <div className="fade-up mt-14" style={{ animationDelay: '420ms' }}>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#475569]">Construído com</p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {tech.map(t => (
                <span key={t} className="font-mono text-sm text-[#475569] transition-colors hover:text-[#94A3B8]">{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Como funciona ── */}
        <section id="como-funciona" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20">
          <div className="mb-12 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-blue-400">Como funciona</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Do edital ao domínio, em 4 passos</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <div
                  key={s.n}
                  className="group relative overflow-hidden rounded-2xl border border-[#2A2D3E] bg-[#1C1F2E]/50 p-5 transition-colors hover:border-blue-500/40"
                >
                  <span className="absolute -right-2 -top-3 font-mono text-6xl font-bold text-[#2A2D3E]/40 transition-colors group-hover:text-blue-500/10">{s.n}</span>
                  <div className="relative">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                      <Icon size={18} className="text-blue-400" />
                    </div>
                    <h3 className="mb-1.5 font-bold">{s.title}</h3>
                    <p className="text-sm leading-relaxed text-[#94A3B8]">{s.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Recursos ── */}
        <section id="recursos" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20">
          <div className="mb-12 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-blue-400">Recursos</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Tudo que você precisa para passar</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {features.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className="rounded-2xl border border-[#2A2D3E] bg-[#1C1F2E]/50 p-6 transition-all hover:-translate-y-0.5 hover:border-blue-500/30">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                    <Icon size={18} className="text-blue-400" />
                  </div>
                  <h3 className="mb-1.5 font-bold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-[#94A3B8]">{f.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Método Leitner ── */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="rounded-3xl border border-[#2A2D3E] bg-gradient-to-b from-[#1C1F2E]/70 to-[#12141c]/70 p-8 sm:p-12">
            <div className="mb-10 text-center">
              <p className="font-mono text-[11px] uppercase tracking-widest text-blue-400">Repetição espaçada</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">O método Leitner, automatizado</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-[#94A3B8]">
                Cada acerto avança o card para uma caixa com intervalo maior. Um erro devolve para a primeira. Você revisa exatamente quando está prestes a esquecer.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {leitner.map((l, i) => (
                <div key={l.box} className="relative rounded-2xl border border-[#2A2D3E] bg-[#14161f] p-4 text-center">
                  <div
                    className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full font-mono text-sm font-bold text-white"
                    style={{ background: `hsl(217 91% ${62 - i * 6}%)` }}
                  >
                    {l.box}
                  </div>
                  <p className="text-xs font-semibold text-[#F1F5F9]">{l.label}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-[#475569]">{l.dias}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-6 py-20">
          <div className="mb-10 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-blue-400">FAQ</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map(f => (
              <details key={f.q} className="group rounded-2xl border border-[#2A2D3E] bg-[#1C1F2E]/50 px-5 py-1 transition-colors hover:border-[#3D4158] open:border-blue-500/30">
                <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-semibold marker:hidden">
                  {f.q}
                  <span className="ml-4 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#2A2D3E] text-[#94A3B8] transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-4 text-sm leading-relaxed text-[#94A3B8]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-[#12141c] p-10 text-center sm:p-16">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-blue-600/20 blur-[100px]" />
            </div>
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
                Seu próximo concurso começa <span className="text-gradient-blue">com um upload.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[#94A3B8]">
                Suba o edital agora e deixe a IA montar seu plano de estudos.
              </p>
              <Link
                href="/login"
                className="group mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-8 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 hover:bg-blue-500"
              >
                <Sparkles size={17} /> Começar grátis
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-[#2A2D3E]">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <span className="font-mono text-sm font-bold tracking-tight">
            gabarito<span className="text-blue-500">_AI</span>
          </span>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#475569]">
            {new Date().getFullYear()} · MIT · feito para concurseiros
          </p>
          <a
            href="https://github.com/cielioqueiroz/gabarito_AI"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#94A3B8] transition-colors hover:text-[#F1F5F9]"
          >
            GitHub ↗
          </a>
        </div>
      </footer>
    </div>
  )
}
