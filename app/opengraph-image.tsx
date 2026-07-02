import { ImageResponse } from 'next/og'

export const runtime     = 'edge'
export const alt         = 'gabarito_AI — console de estudos para concursos públicos'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Every element with more than one child MUST declare display:flex — Satori
// (next/og) throws "failed to pipe response" otherwise, yielding an empty PNG.
export default function Image() {
  const chips = [
    { label: 'Plano de estudos', bg: '#3A3413', border: '#F2D53C55', text: '#F8E97E' },
    { label: 'Flashcards Leitner', bg: '#14532d', border: '#16a34a55', text: '#86EFAC' },
    { label: 'Questões com IA', bg: '#1B2B24', border: '#3B554799', text: '#C2CBBE' },
    { label: 'Upload de edital', bg: '#14201B', border: '#F2D53C44', text: '#F2D53C' },
  ]

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#0D1512',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* subtle grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            backgroundImage:
              'linear-gradient(#293D33 1px, transparent 1px), linear-gradient(90deg, #293D33 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            opacity: 0.28,
          }}
        />
        {/* blue glow */}
        <div
          style={{
            position: 'absolute',
            top: -140,
            left: -100,
            width: 560,
            height: 560,
            display: 'flex',
            background: 'radial-gradient(circle, #F2D53C22 0%, transparent 70%)',
          }}
        />
        {/* top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            display: 'flex',
            background: 'linear-gradient(90deg, transparent, #F2D53C, #F8E97E, transparent)',
          }}
        />

        {/* logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 48 }}>
          <div
            style={{
              width: 92,
              height: 92,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 22,
              background: 'linear-gradient(135deg, #1B2B24, #0D1512)',
              border: '1px solid #293D33',
              boxShadow: '0 0 48px #F2D53C33',
            }}
          >
            <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
              <path d="M18 33.5 L28 43 L47 21.5" stroke="#F2D53C" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="18" y="49" width="16" height="3.5" rx="1.75" fill="#F2D53C" />
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <div style={{ display: 'flex', fontFamily: 'monospace', fontSize: 64, fontWeight: 800, color: '#EFEDE3', letterSpacing: -2 }}>gabarito</div>
            <div style={{ display: 'flex', fontFamily: 'monospace', fontSize: 64, fontWeight: 800, color: '#F2D53C', letterSpacing: -2 }}>_AI</div>
          </div>
        </div>

        {/* headline */}
        <div style={{ display: 'flex', fontSize: 30, color: '#C2CBBE', lineHeight: 1.45, maxWidth: 900, marginBottom: 20 }}>
          Suba o edital em PDF e a IA monta seu plano de estudos, flashcards e questões comentadas.
        </div>

        {/* subline */}
        <div style={{ display: 'flex', fontFamily: 'monospace', fontSize: 17, color: '#7F8D82', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 44 }}>
          Console de estudos para concursos públicos
        </div>

        {/* feature chips */}
        <div style={{ display: 'flex', gap: 16 }}>
          {chips.map(c => (
            <div
              key={c.label}
              style={{
                display: 'flex',
                background: c.bg,
                border: `1px solid ${c.border}`,
                color: c.text,
                borderRadius: 12,
                padding: '12px 20px',
                fontSize: 17,
                fontFamily: 'monospace',
              }}
            >
              {c.label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
