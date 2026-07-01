'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Brain, CalendarCheck } from 'lucide-react'
import { Dialog } from './ui/dialog'
import { Button } from './ui/button'

const STORAGE_KEY = 'gab:onboarding-done'

const slides = [
  {
    icon: Upload,
    title: 'Suba o edital',
    description: 'Cole ou envie o PDF do edital. A IA extrai automaticamente disciplinas e tópicos.',
    accent: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: Brain,
    title: 'Estude com flashcards',
    description: 'Gere flashcards por disciplina. O sistema Leitner agenda as revisões para você fixar o conteúdo.',
    accent: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: CalendarCheck,
    title: 'Revise no ritmo certo',
    description: 'Toda manhã confira "Revisão do Dia" e responda os cards vencidos. Progresso e estatísticas em tempo real.',
    accent: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
]

export function OnboardingTour() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true)
    } catch {}
  }, [])

  function finish() {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
    // Notify same-tab listeners (storage event only fires cross-tab).
    try { window.dispatchEvent(new CustomEvent('gab:onboarding-done')) } catch {}
    setOpen(false)
  }

  const slide = slides[step]
  const Icon = slide.icon
  const isLast = step === slides.length - 1

  return (
    <Dialog open={open} onClose={finish} hideClose>
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl border mb-4 ${slide.accent}`}>
              <Icon size={24} />
            </div>
            <h2 className="font-bold text-foreground text-lg mb-2">{slide.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">{slide.description}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-center gap-1.5 mt-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Ir para slide ${i + 1}`}
              className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all ${i === step ? 'w-4 bg-blue-500' : 'bg-border hover:bg-muted-foreground'}`}
            />
          ))}
        </div>

        <div className="flex gap-2 justify-between mt-6">
          <Button variant="ghost" onClick={finish} size="sm">Pular</Button>
          {isLast ? (
            <Button onClick={finish}>Vamos lá →</Button>
          ) : (
            <Button onClick={() => setStep(s => s + 1)}>Próximo →</Button>
          )}
        </div>
      </div>
    </Dialog>
  )
}
