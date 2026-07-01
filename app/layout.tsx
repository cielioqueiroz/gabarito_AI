import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme'
import { ToastProvider } from '@/lib/toast'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://gabarito-ai.vercel.app'),
  title: 'gabarito_AI — console de estudos',
  description: 'Suba o edital e a IA monta seu plano de estudos, flashcards e questões para concursos públicos.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'gabarito_AI',
    description: 'Console de estudos para concursos públicos com inteligência artificial.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'gabarito_AI',
    description: 'Console de estudos para concursos públicos com inteligência artificial.',
  },
}

export const viewport: Viewport = {
  themeColor: '#0F1117',
  width: 'device-width',
  initialScale: 1,
}

const themeInitScript = `(function(){try{var t=localStorage.getItem('gabarito-theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground transition-colors duration-200">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
