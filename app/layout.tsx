import type { Metadata, Viewport } from 'next'
import { Inter, Fraunces, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme'
import { ToastProvider } from '@/lib/toast'
import { MotionProvider } from '@/lib/motion'
import { ShortcutsProvider } from '@/lib/shortcuts'
import './globals.css'

const inter = Inter({ variable: '--font-sans-c', subsets: ['latin'] })
const fraunces = Fraunces({ variable: '--font-display', subsets: ['latin'], weight: ['400', '600', '700', '900'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://gabarito-lyart.vercel.app'),
  title: {
    default:  'gabarito_AI — console de estudos',
    template: '%s · gabarito_AI',
  },
  description: 'Suba o edital em PDF e a IA monta seu plano de estudos, flashcards Leitner e questões comentadas para concursos públicos.',
  manifest: '/manifest.json',
  applicationName: 'gabarito_AI',
  keywords: ['concurso público', 'estudos', 'flashcards', 'leitner', 'IA', 'edital', 'Claude', 'repetição espaçada', 'gabarito'],
  authors: [{ name: 'cielioqueiroz', url: 'https://github.com/cielioqueiroz' }],
  creator: 'cielioqueiroz',
  openGraph: {
    title: 'gabarito_AI — console de estudos para concursos',
    description: 'Suba o edital, a IA gera plano, flashcards e questões comentadas. Estude com repetição espaçada.',
    type: 'website',
    url: '/',
    siteName: 'gabarito_AI',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'gabarito_AI',
    description: 'Console de estudos para concursos públicos com IA.',
    creator: '@cielioqueiroz',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#0E1B33',
  width: 'device-width',
  initialScale: 1,
}

const themeInitScript = `(function(){try{var t=localStorage.getItem('gabarito-theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${fraunces.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground transition-colors duration-200">
        <ThemeProvider>
          <MotionProvider>
            <ShortcutsProvider>
              <ToastProvider>{children}</ToastProvider>
            </ShortcutsProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
