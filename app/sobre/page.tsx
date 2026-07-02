import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Sparkles, BookOpen, Brain, BarChart3, Headphones, Lock,
  Upload, ArrowRight, Check, Layers, Repeat, Terminal,
} from 'lucide-react'
import LandingFx from '@/components/LandingFx'

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
  { icon: BookOpen, title: 'Flashcards e questões', description: 'Geração ilimitada por IA, com gabarito e explicação comentada.' },
  { icon: Headphones, title: 'Resumos e podcast', description: 'Resumos a partir de texto, link ou YouTube — e ouça em voz neural, como um podcast.' },
  { icon: BarChart3, title: 'Estatísticas reais', description: 'Taxa de acerto por disciplina e evolução dos últimos 7 dias.' },
  { icon: Lock, title: 'Privado e seguro', description: 'Seus dados protegidos por Row Level Security no PostgreSQL.' },
]

const steps = [
  { icon: Upload, n: '01', title: 'Suba o edital', description: 'Arraste o PDF ou TXT. Sem formatação especial — a IA lê o edital como está.' },
  { icon: Terminal, n: '02', title: 'A IA estrutura', description: 'A IA extrai disciplinas, tópicos e monta seu plano de estudos automaticamente.' },
  { icon: Repeat, n: '03', title: 'Estude com método', description: 'Flashcards e questões comentadas, agendados pelo sistema Leitner de repetição espaçada.' },
  { icon: BarChart3, n: '04', title: 'Acompanhe e conquiste', description: 'Progresso por disciplina, cards dominados e taxa de acerto — no ritmo certo.' },
]

/* Caixas Leitner: o azul-caneta se aprofunda conforme a fixação;
   a 5ª (Dominado) é verde — mesma semântica de domínio usada dentro do app. */
const leitner = [
  { box: 1, label: 'Aprendendo', dias: '1 dia',   cor: '#C9D7FA', texto: '#101014' },
  { box: 2, label: 'Revisando',  dias: '2 dias',  cor: '#A8BCF8', texto: '#101014' },
  { box: 3, label: 'Fixando',    dias: '4 dias',  cor: '#4A72E8', texto: '#FFFFFF' },
  { box: 4, label: 'Dominando',  dias: '7 dias',  cor: '#3556C4', texto: '#FFFFFF' },
  { box: 5, label: 'Dominado',   dias: '15 dias', cor: '#22C55E', texto: '#FFFFFF' },
]

const faqs = [
  { q: 'Preciso pagar alguma coisa?', a: 'Não. O gabarito_AI é um projeto aberto (MIT). Você roda com suas próprias chaves de Supabase e do Google Gemini (com camada gratuita).' },
  { q: 'Que tipo de arquivo o edital pode ser?', a: 'PDF ou TXT de até 5 MB. A IA extrai o texto e organiza em disciplinas e tópicos, sem você precisar formatar nada.' },
  { q: 'Como funciona a repetição espaçada?', a: 'Usamos o método Leitner com 5 caixas. Cada acerto avança o card para uma caixa com intervalo maior (1, 2, 4, 7 e 15 dias); um erro devolve para a caixa 1.' },
  { q: 'Posso estudar para mais de um concurso?', a: 'Sim. Cada concurso tem seu próprio plano, flashcards e questões, e a Revisão do Dia cruza os cards vencidos de todos eles.' },
  { q: 'Meus dados ficam seguros?', a: 'Ficam. Todas as tabelas têm Row Level Security no PostgreSQL, então cada usuário só acessa os próprios dados.' },
]

const tech = ['Next.js 16', 'Google Gemini', 'Supabase', 'PostgreSQL + RLS', 'Sistema Leitner']

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-[#101014] text-[#F4F4F0] overflow-x-hidden">
      {/* Atmosphere: grid + glow + partículas Three.js */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <LandingFx />
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              'linear-gradient(#26262F 1px, transparent 1px), linear-gradient(90deg, #26262F 1px, transparent 1px)',
            backgroundSize: '54px 54px',
            maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, #000 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, #000 40%, transparent 100%)',
          }}
        />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[820px] rounded-full bg-[#4A72E8]/10 blur-[120px]" />
      </div>

      {/* ── Floating nav ── */}
      <header className="sticky top-4 z-50 px-4">
        <nav className="mx-auto flex h-14 max-w-3xl items-center justify-between rounded-full border border-[#26262F] bg-[#17171D] px-3 pl-5 shadow-lg shadow-black/40">
          <Link href="/sobre" className="font-mono text-sm font-bold tracking-tight">
            gabarito<span className="text-[#4A72E8]">_AI</span>
            <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-[#4A72E8] animate-blink" />
          </Link>
          <div className="hidden items-center gap-6 sm:flex">
            <a href="#como-funciona" className="text-sm text-[#9C9CA6] transition-colors hover:text-[#F4F4F0]">Como funciona</a>
            <a href="#recursos" className="text-sm text-[#9C9CA6] transition-colors hover:text-[#F4F4F0]">Recursos</a>
            <a href="#faq" className="text-sm text-[#9C9CA6] transition-colors hover:text-[#F4F4F0]">FAQ</a>
          </div>
          <Link
            href="/login"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#4A72E8] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#6C8DF0]"
          >
            Entrar <ArrowRight size={14} />
          </Link>
        </nav>
      </header>

      <main className="relative z-10">
        {/* ── Hero ── */}
        <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center sm:pt-28">
          <span className="fade-up inline-flex items-center gap-2 rounded-full border border-[#4A72E8]/30 bg-[#4A72E8]/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-[#A8BCF8]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4A72E8] shadow-[0_0_8px_2px] shadow-[#4A72E8]/50" />
            Console de estudos para concursos
          </span>

          <h1 className="fade-up mx-auto mt-7 max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl" style={{ animationDelay: '80ms' }}>
            Transforme o edital em<br className="hidden sm:block" />{' '}
            um <span className="hl-mark">plano de estudos</span> com IA.
          </h1>

          <p className="fade-up mx-auto mt-6 max-w-xl text-base text-[#9C9CA6] sm:text-lg" style={{ animationDelay: '160ms' }}>
            Suba o PDF do edital e a IA organiza tudo em disciplinas, flashcards e
            questões comentadas. Você estuda com repetição espaçada, no ritmo certo.
          </p>

          <div className="fade-up mt-9 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '240ms' }}>
            <Link
              href="/login"
              className="group inline-flex h-12 items-center gap-2 rounded-xl bg-[#4A72E8] px-7 font-semibold text-white shadow-lg shadow-[#4A72E8]/25 transition-all hover:-translate-y-0.5 hover:bg-[#6C8DF0] hover:shadow-[#4A72E8]/40"
            >
              <Sparkles size={17} /> Começar grátis
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#26262F] bg-[#17171D] px-6 font-semibold text-[#F4F4F0] transition-colors hover:border-[#4A72E8]/40"
            >
              Já tenho conta
            </Link>
          </div>

          {/* ── Product mockup (fade-up on wrapper, float-y on inner — the two
               animations can't share one element: both set `animation`) ── */}
          <div className="fade-up mt-16 sm:mt-20" style={{ animationDelay: '340ms' }}>
            <div className="float-y relative mx-auto max-w-4xl">
              <div aria-hidden className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-[#4A72E8]/10 blur-3xl" />
              <div className="relative rounded-2xl border border-[#34343F] bg-[#17171D] p-2 shadow-2xl shadow-black/70">
              {/* window chrome */}
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 truncate font-mono text-xs text-[#6E6E7A]">gabarito_AI — Banco do Brasil · Agente de Tecnologia</span>
                <span className="ml-auto hidden items-center gap-1.5 rounded-md border border-[#4A72E8]/30 bg-[#4A72E8]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#A8BCF8] sm:inline-flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4A72E8]" /> IA ativa
                </span>
              </div>

              <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-[#26262F] sm:grid-cols-[190px_1fr]">
                {/* sidebar */}
                <div className="hidden flex-col gap-1 bg-[#121218] p-3 text-left sm:flex">
                  <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-[#6E6E7A]">Disciplinas</p>
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
                        active ? 'bg-[#4A72E8]/10 text-[#F4F4F0]' : 'text-[#9C9CA6]'
                      }`}
                    >
                      <Layers size={13} className={active ? 'text-[#4A72E8]' : 'text-[#6E6E7A]'} />
                      <span className="truncate">{d as string}</span>
                    </div>
                  ))}
                </div>

                {/* main panel */}
                <div className="bg-[#15151A] p-4 text-left sm:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-[#4A72E8]">Plano de estudos</p>
                      <p className="text-sm font-semibold text-[#F4F4F0]">Segurança da Informação</p>
                    </div>
                    <span className="rounded-md bg-[#1F1F28] px-2 py-1 font-mono text-[10px] text-[#9C9CA6]">gerado em 24s</span>
                  </div>

                  {/* progress */}
                  <div className="mb-4">
                    <div className="mb-1.5 flex justify-between font-mono text-[10px] text-[#9C9CA6]">
                      <span>Progresso</span><span className="text-[#4A72E8]">62%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#1F1F28]">
                      <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-[#3556C4] to-[#A8BCF8]" />
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
                      <div key={topic as string} className="flex items-center gap-2.5 rounded-lg bg-[#1F1F28]/60 px-3 py-2">
                        <span className={`flex h-4 w-4 items-center justify-center rounded ${done ? 'bg-[#4A72E8]' : 'border border-[#26262F] bg-[#1F1F28]'}`}>
                          {done ? <Check size={11} className="text-white" /> : null}
                        </span>
                        <span className={`text-xs ${done ? 'text-[#6E6E7A] line-through' : 'text-[#F4F4F0]'}`}>{topic as string}</span>
                      </div>
                    ))}
                  </div>

                  {/* chips */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['12 Flashcards', '8 Questões', 'Revisão do dia'].map(c => (
                      <span key={c} className="rounded-lg border border-[#26262F] bg-[#1F1F28] px-2.5 py-1 font-mono text-[11px] text-[#9C9CA6]">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* tech strip (honest proof) */}
          <div className="fade-up mt-14" style={{ animationDelay: '420ms' }}>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#6E6E7A]/70">Construído com</p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {tech.map(t => (
                <span key={t} className="font-mono text-sm text-[#6E6E7A] transition-colors hover:text-[#9C9CA6]">{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Como funciona ── */}
        <section id="como-funciona" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20">
          <div className="mb-12 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-[#4A72E8]">Como funciona</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Do edital ao domínio, em 4 passos</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(s => {
              const Icon = s.icon
              return (
                <div
                  key={s.n}
                  className="group relative overflow-hidden rounded-2xl border border-[#26262F] bg-[#17171D]/60 p-5 transition-colors hover:border-[#4A72E8]/40"
                >
                  <span className="absolute -right-2 -top-3 font-mono text-6xl font-bold text-[#26262F]/40 transition-colors group-hover:text-[#4A72E8]/10">{s.n}</span>
                  <div className="relative">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-[#4A72E8]/20 bg-[#4A72E8]/10">
                      <Icon size={18} className="text-[#4A72E8]" />
                    </div>
                    <h3 className="mb-1.5 font-bold">{s.title}</h3>
                    <p className="text-sm leading-relaxed text-[#9C9CA6]">{s.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Recursos ── */}
        <section id="recursos" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20">
          <div className="mb-12 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-[#4A72E8]">Recursos</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Tudo que você precisa para passar</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {features.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className="rounded-2xl border border-[#26262F] bg-[#17171D]/60 p-6 transition-all hover:-translate-y-0.5 hover:border-[#4A72E8]/30">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#4A72E8]/20 bg-[#4A72E8]/10">
                    <Icon size={18} className="text-[#4A72E8]" />
                  </div>
                  <h3 className="mb-1.5 font-bold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-[#9C9CA6]">{f.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Método Leitner ── */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="rounded-3xl border border-[#26262F] bg-gradient-to-b from-[#17171D] to-[#121218] p-8 sm:p-12">
            <div className="mb-10 text-center">
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#4A72E8]">Repetição espaçada</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">O método Leitner, automatizado</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-[#9C9CA6]">
                Cada acerto avança o card para uma caixa com intervalo maior. Um erro devolve para a primeira. Você revisa exatamente quando está prestes a esquecer.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {leitner.map(l => (
                <div key={l.box} className="relative rounded-2xl border border-[#26262F] bg-[#121218] p-4 text-center">
                  <div
                    className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full font-mono text-sm font-bold"
                    style={{ background: l.cor, color: l.texto }}
                  >
                    {l.box}
                  </div>
                  <p className="text-xs font-semibold text-[#F4F4F0]">{l.label}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-[#6E6E7A]">{l.dias}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-6 py-20">
          <div className="mb-10 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-[#4A72E8]">FAQ</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map(f => (
              <details key={f.q} className="group rounded-2xl border border-[#26262F] bg-[#17171D]/60 px-5 py-1 transition-colors hover:border-[#34343F] open:border-[#4A72E8]/40">
                <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-semibold marker:hidden">
                  {f.q}
                  <span className="ml-4 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#26262F] text-[#9C9CA6] transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-4 text-sm leading-relaxed text-[#9C9CA6]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-3xl border border-[#4A72E8]/20 bg-[#17171D] p-10 text-center sm:p-16">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-[#4A72E8]/15 blur-[100px]" />
            </div>
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
                Seu próximo concurso começa <span className="text-gradient-brand">com um upload.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[#9C9CA6]">
                Suba o edital agora e deixe a IA montar seu plano de estudos.
              </p>
              <Link
                href="/login"
                className="group mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-[#4A72E8] px-8 font-semibold text-white shadow-lg shadow-[#4A72E8]/30 transition-all hover:-translate-y-0.5 hover:bg-[#6C8DF0]"
              >
                <Sparkles size={17} /> Começar grátis
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Respiro para o conteúdo não ficar escondido atrás do footer fixo */}
      <div aria-hidden className="h-24" />

      {/* ── Footer flutuante — acompanha o scroll, espelha a nav do topo ── */}
      <footer className="fixed inset-x-0 bottom-4 z-50 px-4">
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between gap-3 rounded-full border border-[#26262F] bg-[#17171D]/95 px-5 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm">
          <a
            href="https://cielioqueiroz.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 text-xs text-[#9C9CA6] transition-colors hover:text-[#F4F4F0]"
            title="Portfólio de Cielio Queiroz"
          >
            <span className="text-[#6E6E7A]">© {new Date().getFullYear()}</span>
            <span className="font-semibold text-[#A8BCF8] transition-colors group-hover:text-[#F4F4F0]">Cielio Queiroz</span>
            <span className="hidden sm:inline text-[#6E6E7A]">· Todos os direitos reservados</span>
          </a>
          <span className="hidden md:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#6E6E7A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4A72E8] animate-pulse" />
            feito para concurseiros
          </span>
          <a
            href="https://github.com/cielioqueiroz/gabarito_AI"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#9C9CA6] transition-all hover:-translate-y-0.5 hover:text-[#F4F4F0]"
          >
            GitHub ↗
          </a>
        </div>
      </footer>
    </div>
  )
}
