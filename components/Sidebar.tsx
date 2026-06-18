'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useTheme } from '@/lib/theme'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  BarChart3,
  Settings,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react'

interface Props {
  onMobileClose?: () => void
}

const navItems = [
  { href: '/',             label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/concursos',    label: 'Meus Concursos',  icon: BookOpen },
  { href: '/revisao',      label: 'Revisão do Dia',  icon: CalendarCheck },
  { href: '/estatisticas', label: 'Estatísticas',    icon: BarChart3 },
]

export default function Sidebar({ onMobileClose }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const { theme, toggle } = useTheme()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <aside className="flex flex-col h-full w-60 bg-[var(--c-surface)] border-r border-[var(--c-border)]">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-[var(--c-border)] flex-shrink-0">
        <Link href="/" className="font-mono text-base font-bold text-[var(--c-text)] tracking-tight">
          gabarito<span className="text-blue-500">_AI</span>
          <span className="inline-block w-1.5 h-3.5 bg-blue-500 ml-0.5 align-middle animate-blink" />
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'text-blue-500 bg-blue-500/10'
                  : 'text-[var(--c-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-elevated)]'
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                size={16}
                className={cn(
                  'flex-shrink-0 transition-colors',
                  active ? 'text-blue-500' : 'text-[var(--c-dimmed)] group-hover:text-[var(--c-muted)]'
                )}
              />
              <motion.span
                animate={{ x: active ? 2 : 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              >
                {item.label}
              </motion.span>
            </Link>
          )
        })}
      </nav>

      {/* Secondary actions */}
      <div className="border-t border-[var(--c-border)] py-4 px-3 space-y-0.5 flex-shrink-0">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--c-muted)] hover:bg-[var(--c-elevated)] hover:text-[var(--c-text)] transition-all duration-150 cursor-pointer group"
        >
          <motion.div
            animate={{ rotate: theme === 'dark' ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            {theme === 'dark'
              ? <Sun  size={16} className="flex-shrink-0 text-[var(--c-dimmed)] group-hover:text-amber-500 transition-colors" />
              : <Moon size={16} className="flex-shrink-0 text-[var(--c-dimmed)] group-hover:text-blue-500 transition-colors" />
            }
          </motion.div>
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </button>

        <Link
          href="/configuracoes"
          onClick={onMobileClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--c-muted)] hover:bg-[var(--c-elevated)] hover:text-[var(--c-text)] transition-all duration-150 cursor-pointer group"
        >
          <Settings size={16} className="flex-shrink-0 text-[var(--c-dimmed)] group-hover:text-[var(--c-muted)] transition-colors" />
          Configurações
        </Link>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--c-muted)] hover:bg-red-500/10 hover:text-red-500 transition-all duration-150 cursor-pointer group"
        >
          <LogOut size={16} className="flex-shrink-0 text-[var(--c-dimmed)] group-hover:text-red-500 transition-colors" />
          Sair
        </button>
      </div>
    </aside>
  )
}
