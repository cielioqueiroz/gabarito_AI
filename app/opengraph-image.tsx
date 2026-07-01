import { ImageResponse } from 'next/og'

export const runtime     = 'edge'
export const alt         = 'gabarito_AI — console de estudos para concursos públicos'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Every element with more than one child MUST declare display:flex — Satori
// (next/og) throws "failed to pipe response" otherwise, yielding an empty PNG.
export default function Image() {
  const chips = [
    { label: 'Plano de estudos', bg: '#1e3a8a', border: '#2563EB55', text: '#93C5FD' },
    { label: 'Flashcards Leitner', bg: '#14532d', border: '#16a34a55', text: '#86EFAC' },
    { label: 'Questões com IA', bg: '#3b0764', border: '#7c3aed55', text: '#C4B5FD' },
    { label: 'Upload de edital', bg: '#7c2d12', border: '#ea580c55', text: '#FDBA74' },
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
          background: '#0F1117',
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
              'linear-gradient(#2A2D3E 1px, transparent 1px), linear-gradient(90deg, #2A2D3E 1px, transparent 1px)',
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
            background: 'radial-gradient(circle, #2563EB33 0%, transparent 70%)',
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
            background: 'linear-gradient(90deg, transparent, #2563EB, #6366F1, transparent)',
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
              background: 'linear-gradient(135deg, #1C1F2E, #0F1117)',
              border: '1px solid #2A2D3E',
              boxShadow: '0 0 48px #2563EB44',
            }}
          >
            <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
              <path d="M18 33.5 L28 43 L47 21.5" stroke="#3B82F6" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="18" y="49" width="16" height="3.5" rx="1.75" fill="#3B82F6" />
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <div style={{ display: 'flex', fontFamily: 'monospace', fontSize: 64, fontWeight: 800, color: '#F1F5F9', letterSpacing: -2 }}>gabarito</div>
            <div style={{ display: 'flex', fontFamily: 'monospace', fontSize: 64, fontWeight: 800, color: '#3B82F6', letterSpacing: -2 }}>_AI</div>
          </div>
        </div>

        {/* headline */}
        <div style={{ display: 'flex', fontSize: 30, color: '#CBD5E1', lineHeight: 1.45, maxWidth: 900, marginBottom: 20 }}>
          Suba o edital em PDF e a IA monta seu plano de estudos, flashcards e questões comentadas.
        </div>

        {/* subline */}
        <div style={{ display: 'flex', fontFamily: 'monospace', fontSize: 17, color: '#64748B', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 44 }}>
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
