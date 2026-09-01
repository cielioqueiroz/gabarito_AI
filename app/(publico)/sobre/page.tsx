import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Sparkles, BookOpen, Brain, BarChart3, Headphones, Lock,
  Upload, ArrowRight, Check, Layers, Repeat, Terminal,
} from 'lucide-react'
import BancasMarquee from '@/components/BancasMarquee'
import { ogImage, twitterImage } from '@/app/shared-metadata'

export const metadata: Metadata = {
  title: 'Do edital ao plano de estudos',
  description: 'Envie um edital ou prova em PDF, imagem ou TXT. O gabarito_AI organiza disciplinas, questões, flashcards e revisões em uma rotina de estudos.',
  alternates: { canonical: '/sobre' },
  openGraph: {
    title: 'O edital vira plano. O plano vira rotina.',
    description: 'Do PDF ao plano de estudos, com questões reais, flashcards Leitner, resumos e revisões no momento certo.',
    type: 'website',
    url: '/sobre',
    siteName: 'gabarito_AI',
    locale: 'pt_BR',
    images: [ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'gabarito_AI',
    description: 'Do PDF ao plano de estudos, com questões reais, flashcards e revisões.',
    images: [twitterImage],
  },
}

const features = [
  { icon: Sparkles, title: 'Suba o documento', description: 'PDF, imagem ou TXT — inclusive prova escaneada. A IA identifica estrutura, disciplinas e tópicos.' },
  { icon: Brain, title: 'Repetição espaçada', description: 'Sistema Leitner com 5 caixas e agendamento automático de revisão.' },
  { icon: BookOpen, title: 'Flashcards e questões', description: 'Geração sob demanda, com gabarito, explicação comentada e questões reais importadas da prova.' },
  { icon: Headphones, title: 'Resumos e podcast', description: 'Resumos a partir de texto, link ou YouTube — e ouça em voz neural, como um podcast.' },
  { icon: BarChart3, title: 'Estatísticas reais', description: 'Taxa de acerto por disciplina e evolução dos últimos 7 dias.' },
  { icon: Lock, title: 'Privado e seguro', description: 'Seus dados protegidos por Row Level Security no PostgreSQL.' },
]

const steps = [
  { icon: Upload, n: '01', title: 'Suba o documento', description: 'Arraste o PDF, a imagem ou o TXT. O conteúdo pode ser digital ou escaneado.' },
  { icon: Terminal, n: '02', title: 'A IA estrutura', description: 'Edital vira disciplinas e tópicos; prova também preserva pesos e questões originais.' },
  { icon: Repeat, n: '03', title: 'Estude com método', description: 'Flashcards e questões comentadas, agendados pelo sistema Leitner de repetição espaçada.' },
  { icon: BarChart3, n: '04', title: 'Acompanhe e conquiste', description: 'Progresso por disciplina, cards dominados e taxa de acerto — no ritmo certo.' },
]

/* Caixas Leitner: o vermelho de revisão se aprofunda conforme a fixação;
   a 5ª (Dominado) é verde — mesma semântica de domínio usada dentro do app. */
const leitner = [
  { box: 1, label: 'Aprendendo', dias: '1 dia',   cor: '#E8DECB', texto: '#24211D' },
  { box: 2, label: 'Revisando',  dias: '2 dias',  cor: '#E0B8A9', texto: '#24211D' },
  { box: 3, label: 'Fixando',    dias: '4 dias',  cor: '#C96B55', texto: '#24211D' },
  { box: 4, label: 'Dominando',  dias: '7 dias',  cor: '#9C2F25', texto: '#FFFFFF' },
  { box: 5, label: 'Dominado',   dias: '15 dias', cor: '#22C55E', texto: '#FFFFFF' },
]

const faqs = [
  { q: 'Preciso pagar alguma coisa?', a: 'Não. O gabarito_AI é um projeto aberto (MIT). Você roda com suas próprias chaves de Supabase e do Google Gemini (com camada gratuita).' },
  { q: 'Que tipo de arquivo posso enviar?', a: 'PDF, JPG, PNG ou TXT de até 4 MB. Documentos escaneados são lidos pelo OCR nativo do modelo.' },
  { q: 'Como funciona a repetição espaçada?', a: 'Usamos o método Leitner com 5 caixas. Cada acerto avança o card para uma caixa com intervalo maior (1, 2, 4, 7 e 15 dias); um erro devolve para a caixa 1.' },
  { q: 'Posso estudar para mais de um concurso?', a: 'Sim. Cada concurso tem seu próprio plano, flashcards e questões, e a Revisão do Dia cruza os cards vencidos de todos eles.' },
  { q: 'Meus dados ficam seguros?', a: 'Ficam. Todas as tabelas têm Row Level Security no PostgreSQL, então cada usuário só acessa os próprios dados.' },
]

const tech = ['Next.js 16', 'Google Gemini', 'Supabase', 'PostgreSQL + RLS', 'Sistema Leitner']

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Linhas de caderno discretas: identidade editorial, sem efeitos luminosos. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent 0, transparent 39px, color-mix(in srgb, var(--c-border) 35%, transparent) 40px)',
            maskImage: 'linear-gradient(to bottom, #000 0%, transparent 85%)',
            WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, transparent 85%)',
          }}
        />
        <div className="absolute bottom-0 left-[7vw] top-0 w-px bg-brand/20" />
      </div>

      {/* ── Floating nav ── */}
      <header className="sticky top-4 z-50 px-4">
        <nav className="mx-auto flex h-14 max-w-3xl items-center justify-between rounded-full border border-border bg-surface px-3 pl-5 shadow-[3px_3px_0_var(--c-border)]">
          <Link href="/sobre" className="font-mono text-sm font-bold tracking-tight">
            gabarito<span className="text-brand">_AI</span>
            <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-brand animate-blink" />
          </Link>
          <div className="hidden items-center gap-6 sm:flex">
            <a href="#como-funciona" className="text-sm text-muted transition-colors hover:text-foreground">Como funciona</a>
            <a href="#recursos" className="text-sm text-muted transition-colors hover:text-foreground">Recursos</a>
            <a href="#faq" className="text-sm text-muted transition-colors hover:text-foreground">FAQ</a>
          </div>
          <Link
            href="/login"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-solid px-4 text-sm font-semibold text-white transition-[filter] hover:brightness-110"
          >
            Entrar <ArrowRight size={14} />
          </Link>
        </nav>
      </header>

      <main className="relative z-10">
        {/* ── Hero ── */}
        <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center sm:pt-28">
          <span className="fade-up inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Console de estudos para concursos
          </span>

          <h1 className="fade-up mx-auto mt-7 max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl" style={{ animationDelay: '80ms' }}>
            O edital vira plano.<br className="hidden sm:block" />{' '}
            O plano vira <span className="hl-mark">rotina.</span>
          </h1>

          <p className="fade-up mx-auto mt-6 max-w-xl text-base text-muted sm:text-lg" style={{ animationDelay: '160ms' }}>
            Envie um edital ou prova. A IA organiza disciplinas, importa questões reais
            e prepara revisões para você estudar no ritmo certo.
          </p>

          <div className="fade-up mt-9 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '240ms' }}>
            <Link
              href="/login"
              className="group inline-flex h-12 items-center gap-2 rounded-md bg-brand-solid px-7 font-semibold text-white shadow-[3px_3px_0_var(--c-ink)] transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-110"
            >
              <Sparkles size={17} /> Começar grátis
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-md border border-border bg-surface px-6 font-semibold text-foreground transition-colors hover:border-brand"
            >
              Já tenho conta
            </Link>
          </div>

          {/* ── Product mockup (fade-up on wrapper, float-y on inner — the two
               animations can't share one element: both set `animation`) ── */}
          <div className="fade-up mt-16 sm:mt-20" style={{ animationDelay: '340ms' }}>
            <div className="float-y relative mx-auto max-w-4xl">
              <div className="relative rounded-lg border border-border bg-surface p-2 shadow-[6px_6px_0_var(--c-border)]">
              {/* window chrome */}
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="h-3 w-3 rounded-sm bg-brand-solid" />
                <span className="h-3 w-3 rounded-sm bg-border" />
                <span className="h-3 w-3 rounded-sm bg-muted-foreground" />
                <span className="ml-3 truncate font-mono text-xs text-muted-foreground">gabarito_AI — Banco do Brasil · Agente de Tecnologia</span>
                <span className="ml-auto hidden items-center gap-1.5 rounded-md border border-brand/30 bg-brand/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-brand sm:inline-flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" /> IA ativa
                </span>
              </div>

              <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-border sm:grid-cols-[190px_1fr]">
                {/* sidebar */}
                <div className="hidden flex-col gap-1 bg-surface p-3 text-left sm:flex">
                  <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Disciplinas</p>
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
                        active ? 'bg-brand/10 text-foreground' : 'text-muted'
                      }`}
                    >
                      <Layers size={13} className={active ? 'text-brand' : 'text-muted-foreground'} />
                      <span className="truncate">{d as string}</span>
                    </div>
                  ))}
                </div>

                {/* main panel */}
                <div className="bg-surface p-4 text-left sm:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-brand">Plano de estudos</p>
                      <p className="text-sm font-semibold text-foreground">Segurança da Informação</p>
                    </div>
                    <span className="rounded-md bg-elevated px-2 py-1 font-mono text-[10px] text-muted">gerado em 24s</span>
                  </div>

                  {/* progress */}
                  <div className="mb-4">
                    <div className="mb-1.5 flex justify-between font-mono text-[10px] text-muted">
                      <span>Progresso</span><span className="text-brand">62%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                      <div className="h-full w-[62%] rounded-full bg-brand-solid" />
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
                      <div key={topic as string} className="flex items-center gap-2.5 rounded-lg bg-elevated/60 px-3 py-2">
                        <span className={`flex h-4 w-4 items-center justify-center rounded ${done ? 'bg-brand' : 'border border-border bg-elevated'}`}>
                          {done ? <Check size={11} className="text-white" /> : null}
                        </span>
                        <span className={`text-xs ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{topic as string}</span>
                      </div>
                    ))}
                  </div>

                  {/* chips */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['12 Flashcards', '8 Questões', 'Revisão do dia'].map(c => (
                      <span key={c} className="rounded-lg border border-border bg-elevated px-2.5 py-1 font-mono text-[11px] text-muted">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* tech strip (honest proof) */}
          <div className="fade-up mt-14" style={{ animationDelay: '420ms' }}>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Construído com</p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {tech.map(t => (
                <span key={t} className="font-mono text-sm text-muted-foreground transition-colors hover:text-muted">{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Carrossel de bancas (infinito) ── */}
        <BancasMarquee />

        {/* ── Como funciona ── */}
        <section id="como-funciona" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20">
          <div className="mb-12 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-brand">Como funciona</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Do edital ao domínio, em 4 passos</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(s => {
              const Icon = s.icon
              return (
                <div
                  key={s.n}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-5 transition-colors hover:border-brand/40"
                >
                  <span className="absolute -right-2 -top-3 font-mono text-6xl font-bold text-border/40 transition-colors group-hover:text-brand/10">{s.n}</span>
                  <div className="relative">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-brand/20 bg-brand/10">
                      <Icon size={18} className="text-brand" />
                    </div>
                    <h3 className="mb-1.5 font-bold">{s.title}</h3>
                    <p className="text-sm leading-relaxed text-muted">{s.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Recursos ── */}
        <section id="recursos" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20">
          <div className="mb-12 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-brand">Recursos</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Tudo que você precisa para passar</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {features.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className="rounded-2xl border border-border bg-surface/60 p-6 transition-all hover:-translate-y-0.5 hover:border-brand/30">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-brand/20 bg-brand/10">
                    <Icon size={18} className="text-brand" />
                  </div>
                  <h3 className="mb-1.5 font-bold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{f.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Método Leitner ── */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="rounded-lg border border-border bg-surface p-8 shadow-[5px_5px_0_var(--c-border)] sm:p-12">
            <div className="mb-10 text-center">
              <p className="font-mono text-[11px] uppercase tracking-widest text-brand">Repetição espaçada</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">O método Leitner, automatizado</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
                Cada acerto avança o card para uma caixa com intervalo maior. Um erro devolve para a primeira. Você revisa exatamente quando está prestes a esquecer.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {leitner.map(l => (
                <div key={l.box} className="relative rounded-2xl border border-border bg-surface p-4 text-center">
                  <div
                    className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full font-mono text-sm font-bold"
                    style={{ background: l.cor, color: l.texto }}
                  >
                    {l.box}
                  </div>
                  <p className="text-xs font-semibold text-foreground">{l.label}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{l.dias}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-6 py-20">
          <div className="mb-10 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-brand">FAQ</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map(f => (
              <details key={f.q} className="group rounded-2xl border border-border bg-surface/60 px-5 py-1 transition-colors hover:border-border open:border-brand/40">
                <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-semibold marker:hidden">
                  {f.q}
                  <span className="ml-4 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-border text-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-4 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-lg border border-brand/30 bg-surface p-10 text-center shadow-[6px_6px_0_var(--c-border)] sm:p-16">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute bottom-0 left-12 top-0 w-px bg-brand/20" />
            </div>
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
                Seu próximo concurso começa <span className="text-gradient-brand">com um upload.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-muted">
                Suba o edital agora e deixe a IA montar seu plano de estudos.
              </p>
              <Link
                href="/login"
                className="group mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-brand-solid px-8 font-semibold text-white shadow-[3px_3px_0_var(--c-ink)] transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-110"
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
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between gap-3 rounded-full border border-border bg-surface px-5 shadow-[3px_3px_0_var(--c-border)]">
          <a
            href="https://cielioqueiroz.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-foreground"
            title="Portfólio de Cielio Queiroz"
          >
            <span className="text-muted-foreground">© {new Date().getFullYear()}</span>
            <span className="font-semibold text-brand transition-colors group-hover:text-foreground">Cielio Queiroz</span>
            <span className="hidden sm:inline text-muted-foreground">· Todos os direitos reservados</span>
          </a>
          <span className="hidden md:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            feito para concurseiros
          </span>
          <a
            href="https://github.com/cielioqueiroz/gabarito_AI"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted transition-all hover:-translate-y-0.5 hover:text-foreground"
          >
            GitHub ↗
          </a>
        </div>
      </footer>
    </div>
  )
}
