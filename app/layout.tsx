import type { Metadata, Viewport } from 'next'
import { Archivo, IBM_Plex_Mono, Newsreader } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme'
import { ToastProvider } from '@/lib/toast'
import { MotionProvider } from '@/lib/motion'
import { ShortcutsProvider } from '@/lib/shortcuts'
import './globals.css'

const archivo = Archivo({ variable: '--font-sans-c', subsets: ['latin'] })
const newsreader = Newsreader({ variable: '--font-display', subsets: ['latin'] })
const plexMono = IBM_Plex_Mono({ variable: '--font-mono-c', subsets: ['latin'], weight: ['400', '500', '600'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://gabarito-lyart.vercel.app'),
  title: {
    default:  'gabarito_AI — console de estudos',
    template: '%s · gabarito_AI',
  },
  description: 'Envie um edital ou prova em PDF, imagem ou TXT e transforme o documento em plano de estudos, questões, flashcards e revisões.',
  manifest: '/manifest.json',
  applicationName: 'gabarito_AI',
  keywords: ['concurso público', 'estudos', 'flashcards', 'leitner', 'IA', 'edital', 'repetição espaçada', 'gabarito'],
  authors: [{ name: 'cielioqueiroz', url: 'https://github.com/cielioqueiroz' }],
  creator: 'cielioqueiroz',
  openGraph: {
    title: 'O edital vira plano. O plano vira rotina.',
    description: 'Do PDF ao plano de estudos, com questões reais, flashcards Leitner e revisões no momento certo.',
    type: 'website',
    url: '/',
    siteName: 'gabarito_AI',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'gabarito_AI',
    description: 'Do PDF ao plano de estudos, com questões reais, flashcards e revisões.',
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
  themeColor: '#F2EBDD',
  width: 'device-width',
  initialScale: 1,
}

const themeInitScript = `(function(){try{var t=localStorage.getItem('gabarito-theme')||'light';document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${newsreader.variable} ${plexMono.variable} h-full antialiased`}
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
