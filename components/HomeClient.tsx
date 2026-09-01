'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, BookOpen, Target, Award } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ConcursoCard from './ConcursoCard'
import NovoConcursoForm from './NovoConcursoForm'
import Page from './Page'
import { OnboardingTour } from './OnboardingTour'
import { EmptyIllustration } from './ui/EmptyIllustration'
import BancasMarquee from './BancasMarquee'
import type { Concurso } from '@/types'

interface ConcursoStat {
  concurso: Concurso
  topicoTotal: number
  topicoEstudados: number
  flashcardTotal: number
  flashcardDominados: number
}

interface Props {
  stats: ConcursoStat[]
  userEmail: string
  userName: string
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

function getFirstName(name: string, email: string): string {
  const raw = name || email.split('@')[0] || 'estudante'
  return raw.charAt(0).toUpperCase() + raw.slice(1).split(/[\s._-]/)[0]
}

export default function HomeClient({ stats, userEmail, userName }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)

  function handleCreated(concursoId: string, { navegar }: { navegar: boolean }) {
    setShowForm(false)
    // Com plano gerado vale abrir o concurso; sem plano, só atualiza a lista.
    if (navegar) router.push(`/concurso/${concursoId}`)
    else router.refresh()
  }

  async function handleDelete(id: string) {
    await createClient().from('concursos').delete().eq('id', id)
    router.refresh()
  }

  const totalTopicos   = stats.reduce((a, s) => a + s.topicoEstudados, 0)
  const totalDominados = stats.reduce((a, s) => a + s.flashcardDominados, 0)
  const firstName = getFirstName(userName, userEmail)

  const headerRight = (
    <Button onClick={() => setShowForm(v => !v)} size="sm">
      <Plus size={14} />
      Novo concurso
    </Button>
  )

  return (
    <Page title="Dashboard" headerRight={headerRight}>
      <div>

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h2 className="text-xl font-bold text-foreground">
            Olá, {firstName} 👋
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {stats.length === 0
              ? 'Comece adicionando seu primeiro concurso.'
              : `Você tem ${stats.length} concurso${stats.length > 1 ? 's' : ''} cadastrado${stats.length > 1 ? 's' : ''}.`}
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-3 gap-3 sm:gap-4 mb-8"
        >
          {[
            { label: 'Concursos',         value: stats.length,   color: 'text-foreground', icon: BookOpen, iconCls: 'text-slate-300 bg-slate-500/10 border-slate-500/20' },
            { label: 'Tópicos estudados', value: totalTopicos,   color: 'text-brand',   icon: Target,   iconCls: 'text-brand bg-brand/10 border-brand/20' },
            { label: 'Cards dominados',   value: totalDominados, color: 'text-emerald-400', icon: Award,   iconCls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          ].map((s) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.label}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              >
                <Card className="group card-interactive card-sheen">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 transition-colors group-hover:text-muted">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      </div>
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6 ${s.iconCls}`}>
                        <Icon size={15} />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <NovoConcursoForm
                onCreated={handleCreated}
                onCancel={() => setShowForm(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Concurso list */}
        {stats.length === 0 && !showForm ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <EmptyIllustration variant="books" className="mb-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-base mb-1">Comece pelo edital</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">Suba o PDF do edital e a IA organiza tudo — disciplinas, tópicos, flashcards e questões.</p>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 text-brand text-sm font-semibold hover:text-brand transition-colors cursor-pointer">
              Criar o primeiro concurso →
            </button>
          </motion.div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
            {stats.map(s => (
              <ConcursoCard
                key={s.concurso.id}
                concurso={s.concurso}
                topicoTotal={s.topicoTotal}
                topicoEstudados={s.topicoEstudados}
                flashcardTotal={s.flashcardTotal}
                flashcardDominados={s.flashcardDominados}
                onDelete={handleDelete}
              />
            ))}
          </motion.div>
        )}

        {/* Bancas cobertas — carrossel infinito */}
        <div className="mt-10 border-t border-border/60 pt-2">
          <BancasMarquee />
        </div>
      </div>
      <OnboardingTour />
    </Page>
  )
}
