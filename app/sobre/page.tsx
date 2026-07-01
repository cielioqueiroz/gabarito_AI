import Link from 'next/link'
import type { Metadata } from 'next'
import { Sparkles, BookOpen, Brain, BarChart3, Zap, Lock } from 'lucide-react'

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
  { icon: Brain, title: 'Repetição espaçada', description: 'Sistema Leitner com 5 caixas e agendamento automático.' },
  { icon: BookOpen, title: 'Flashcards e questões', description: 'Geração ilimitada com Claude, com explicações comentadas.' },
  { icon: BarChart3, title: 'Estatísticas reais', description: 'Taxa de acerto por disciplina e evolução semanal.' },
  { icon: Zap, title: 'Streaming ao vivo', description: 'Veja o plano aparecendo em tempo real durante a geração.' },
  { icon: Lock, title: 'Privado e seguro', description: 'Seus dados protegidos por Row Level Security no PostgreSQL.' },
]

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-[#0F1117] text-[#F1F5F9]">
      <header className="border-b border-[#2A2D3E]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-mono font-bold tracking-tight">
            gabarito<span className="text-blue-500">_AI</span>
          </span>
          <Link href="/login" className="text-sm font-semibold text-blue-400 hover:text-blue-300 cursor-pointer">
            Entrar →
          </Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-6 py-16 sm:py-24 text-center">
        <span className="inline-block font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 mb-6">
          Console de estudos para concursos
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
          Estude concurso público com <span className="text-blue-500">IA</span>.
        </h1>
        <p className="text-base sm:text-lg text-[#94A3B8] max-w-xl mx-auto mb-8">
          Suba o edital em PDF, a IA organiza tudo em disciplinas, flashcards e questões comentadas. Estude com repetição espaçada.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/login" className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors cursor-pointer">
            <Sparkles size={16} /> Começar grátis
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 h-11 px-6 rounded-lg border border-[#2A2D3E] hover:border-blue-500/40 text-[#F1F5F9] font-semibold text-sm transition-colors cursor-pointer">
            Já tenho conta
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16 sm:pb-24 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {features.map(f => {
          const Icon = f.icon
          return (
            <div key={f.title} className="rounded-xl border border-[#2A2D3E] bg-[#1C1F2E] p-5 hover:border-blue-500/30 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
                <Icon size={16} className="text-blue-500" />
              </div>
              <h3 className="font-bold text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{f.description}</p>
            </div>
          )
        })}
      </section>

      <footer className="border-t border-[#2A2D3E] py-6">
        <p className="text-center font-mono text-[10px] uppercase tracking-widest text-[#475569]">
          gabarito_AI · {new Date().getFullYear()} · MIT
        </p>
      </footer>
    </div>
  )
}
