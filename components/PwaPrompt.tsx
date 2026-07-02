'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, X, Bell } from 'lucide-react'
import { Button } from './ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const INSTALL_KEY = 'gab:pwa-install-dismissed'
const NOTIF_KEY = 'gab:notif-asked'
const ONBOARDING_KEY = 'gab:onboarding-done'

export function PwaPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showNotif, setShowNotif] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    // Only register in production — SW caching interferes with Next dev hot reload.
    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Defer showing our prompts until the onboarding tour is done — otherwise
    // two banners fight for attention on first visit.
    const onboardingDone = (() => { try { return !!localStorage.getItem(ONBOARDING_KEY) } catch { return true } })()

    function onBeforeInstall(e: Event) {
      e.preventDefault()
      const already = localStorage.getItem(INSTALL_KEY)
      if (already) return
      setInstallEvent(e as BeforeInstallPromptEvent)
      if (onboardingDone) setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    // Notifications: ask once, only after user has some cards.
    try {
      if (
        onboardingDone &&
        'Notification' in window &&
        Notification.permission === 'default' &&
        !localStorage.getItem(NOTIF_KEY)
      ) {
        setShowNotif(true)
      }
    } catch {}

    // Re-check when onboarding closes. Storage events don't fire same-tab, so
    // OnboardingTour dispatches a CustomEvent instead.
    function onOnboardingDone() {
      if (installEvent) setShowInstall(true)
      try {
        if ('Notification' in window && Notification.permission === 'default' && !localStorage.getItem(NOTIF_KEY)) {
          setShowNotif(true)
        }
      } catch {}
    }
    window.addEventListener('gab:onboarding-done', onOnboardingDone)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('gab:onboarding-done', onOnboardingDone)
    }
  }, [])

  async function doInstall() {
    if (!installEvent) return
    await installEvent.prompt()
    await installEvent.userChoice
    localStorage.setItem(INSTALL_KEY, '1')
    setShowInstall(false)
  }

  function dismissInstall() {
    localStorage.setItem(INSTALL_KEY, '1')
    setShowInstall(false)
  }

  async function askNotif() {
    localStorage.setItem(NOTIF_KEY, '1')
    setShowNotif(false)
    try {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        new Notification('Perfeito!', { body: 'Vamos avisar quando tiver cards vencidos.' })
      }
    } catch {}
  }

  function dismissNotif() {
    localStorage.setItem(NOTIF_KEY, '1')
    setShowNotif(false)
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-80 z-[90] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {showInstall && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="pointer-events-auto bg-surface border border-border rounded-xl p-4 shadow-lg shadow-black/30"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#E9C92F]/10 border border-[#E9C92F]/20 flex items-center justify-center flex-shrink-0">
                <Smartphone size={16} className="text-[#E9C92F]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Instalar app</p>
                <p className="text-xs text-muted-foreground mt-0.5">Estude offline com atalho na tela inicial.</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={doInstall}>Instalar</Button>
                  <Button size="sm" variant="ghost" onClick={dismissInstall}>Depois</Button>
                </div>
              </div>
              <button onClick={dismissInstall} aria-label="Fechar" className="text-muted-foreground hover:text-foreground p-1 cursor-pointer">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {showNotif && !showInstall && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="pointer-events-auto bg-surface border border-border rounded-xl p-4 shadow-lg shadow-black/30"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#E9C92F]/10 border border-[#E9C92F]/20 flex items-center justify-center flex-shrink-0">
                <Bell size={16} className="text-[#E9C92F]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Avisos de revisão</p>
                <p className="text-xs text-muted-foreground mt-0.5">Ativar notificações para quando houver cards vencidos.</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="amber" onClick={askNotif}>Ativar</Button>
                  <Button size="sm" variant="ghost" onClick={dismissNotif}>Depois</Button>
                </div>
              </div>
              <button onClick={dismissNotif} aria-label="Fechar" className="text-muted-foreground hover:text-foreground p-1 cursor-pointer">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
