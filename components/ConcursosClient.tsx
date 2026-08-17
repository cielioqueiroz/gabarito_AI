'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import ConcursoCard from './ConcursoCard'
import NovoConcursoForm from './NovoConcursoForm'
import ShellLayout from './ShellLayout'
import type { Concurso } from '@/types'

interface ConcursoStat {
  concurso: Concurso
  topicoTotal: number
  topicoEstudados: number
  flashcardTotal: number
  flashcardDominados: number
}

export default function ConcursosClient({ stats }: { stats: ConcursoStat[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)

  function handleCreated(concursoId: string, { navegar }: { navegar: boolean }) {
    setShowForm(false)
    if (navegar) router.push(`/concurso/${concursoId}`)
    else router.refresh()
  }

  async function handleDelete(id: string) {
    await createClient().from('concursos').delete().eq('id', id)
    router.refresh()
  }

  const headerRight = (
    <Button onClick={() => setShowForm(v => !v)} size="sm">
      <Plus size={14} />
      Novo concurso
    </Button>
  )

  return (
    <ShellLayout largura="4xl" title="Meus Concursos" headerRight={headerRight}>
      <div>

        {/* Summary line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted mb-6"
        >
          {stats.length === 0
            ? 'Nenhum concurso cadastrado.'
            : `${stats.length} concurso${stats.length > 1 ? 's' : ''} — clique em um para ver detalhes.`}
        </motion.p>

        {/* Add form */}
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

        {/* Grid */}
        {stats.length === 0 && !showForm ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface border border-border mb-5">
              <BookOpen size={22} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm mb-4">Nenhum concurso cadastrado ainda.</p>
            <button onClick={() => setShowForm(true)} className="text-[#4A72E8] text-sm font-semibold hover:text-[#4A72E8] transition-colors cursor-pointer">
              Criar o primeiro concurso →
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {stats.map(s => (
              <motion.div
                key={s.concurso.id}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              >
                <ConcursoCard
                  concurso={s.concurso}
                  topicoTotal={s.topicoTotal}
                  topicoEstudados={s.topicoEstudados}
                  flashcardTotal={s.flashcardTotal}
                  flashcardDominados={s.flashcardDominados}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </ShellLayout>
  )
}
