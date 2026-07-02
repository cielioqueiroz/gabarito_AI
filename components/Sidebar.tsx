'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useTheme } from '@/lib/theme'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, BookOpen, CalendarCheck,
  BarChart3, Settings, Sun, Moon, LogOut, GraduationCap,
} from 'lucide-react'

interface Props { onMobileClose?: () => void }

type BadgeKey = 'revisao'
const navItems: { href: string; label: string; icon: typeof LayoutDashboard; badge?: BadgeKey }[] = [
  { href: '/',             label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/concursos',    label: 'Meus Concursos', icon: BookOpen },
  { href: '/revisao',      label: 'Revisão do Dia', icon: CalendarCheck, badge: 'revisao' },
  { href: '/estatisticas', label: 'Estatísticas',   icon: BarChart3 },
]

export default function Sidebar({ onMobileClose }: Props) {
  const pathname         = usePathname()
  const router           = useRouter()
  const { theme, toggle } = useTheme()
  const [badges, setBadges] = useState<Record<BadgeKey, number>>({ revisao: 0 })
  const previousRef = useRef<number | null>(null)

  useEffect(() => {
    let alive = true
    async function refresh() {
      try {
        const res = await fetch('/api/revisao-count', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json() as { count: number }
        if (!alive) return
        setBadges({ revisao: data.count })
        // Fire notification only when count crossed from 0 to >0 across the whole
        // session, not per pathname change. First fetch is a baseline (no notify).
        const previous = previousRef.current
        if (
          previous !== null && previous === 0 && data.count > 0 &&
          typeof window !== 'undefined' && 'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          try {
            new Notification('Cards para revisar', {
              body: `${data.count} card${data.count === 1 ? '' : 's'} vencidos aguardando revisão.`,
              tag: 'gab-revisao',
            })
          } catch {}
        }
        previousRef.current = data.count
      } catch {}
    }
    refresh()
    const iv = setInterval(refresh, 60_000)
    return () => { alive = false; clearInterval(iv) }
  }, [pathname])

  async function handleSignOut() {
    await createClient().auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <aside className="flex flex-col h-full w-60 bg-[#0B1526] border-r border-border">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-border flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 font-mono text-base font-bold text-foreground tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-500 shadow-sm shadow-amber-500/25">
            <GraduationCap size={15} className="text-white" />
          </span>
          gabarito<span className="text-amber-400">_AI</span>
          <span className="inline-block w-1.5 h-3.5 bg-amber-400 ml-0.5 align-middle animate-blink" />
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon   = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'text-amber-400 bg-gradient-to-r from-amber-500/12 to-amber-500/5'
                  : 'text-muted hover:text-foreground hover:bg-elevated'
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-amber-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                size={16}
                className={cn(
                  'flex-shrink-0 transition-colors',
                  active ? 'text-amber-400' : 'text-muted-foreground group-hover:text-muted'
                )}
              />
              <motion.span
                animate={{ x: active ? 2 : 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="flex-1"
              >
                {item.label}
              </motion.span>
              {item.badge && badges[item.badge] > 0 && (
                <span className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30" aria-label={`${badges[item.badge]} pendentes`}>
                  {badges[item.badge]}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Secondary actions */}
      <div className="border-t border-border py-4 px-3 space-y-0.5 flex-shrink-0">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:bg-elevated hover:text-foreground transition-all duration-150 cursor-pointer group"
        >
          <motion.div animate={{ rotate: theme === 'dark' ? 0 : 180 }} transition={{ duration: 0.3 }}>
            {theme === 'dark'
              ? <Sun  size={16} className="flex-shrink-0 text-muted-foreground group-hover:text-amber-500 transition-colors" />
              : <Moon size={16} className="flex-shrink-0 text-muted-foreground group-hover:text-amber-500 transition-colors" />
            }
          </motion.div>
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </button>

        <Link
          href="/configuracoes"
          onClick={onMobileClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:bg-elevated hover:text-foreground transition-all duration-150 cursor-pointer group"
        >
          <Settings size={16} className="flex-shrink-0 text-muted-foreground group-hover:text-muted transition-colors" />
          Configurações
        </Link>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-150 cursor-pointer group"
        >
          <LogOut size={16} className="flex-shrink-0 text-muted-foreground group-hover:text-rose-400 transition-colors" />
          Sair
        </button>
      </div>
    </aside>
  )
}
