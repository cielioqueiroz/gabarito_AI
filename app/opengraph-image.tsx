import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'gabarito_AI — console de estudos para concursos públicos'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f172a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px 96px',
          fontFamily: 'monospace',
        }}
      >
        {/* Icon + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '36px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              background: '#2563eb',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ color: 'white', fontSize: '44px', lineHeight: 1 }}>✓</div>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ fontSize: '64px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-2px' }}>
              gabarito
            </span>
            <span style={{ fontSize: '64px', fontWeight: 700, color: '#3b82f6', letterSpacing: '-2px' }}>
              _AI
            </span>
          </div>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: '28px',
            color: '#94a3b8',
            margin: '0 0 52px',
            lineHeight: 1.5,
            maxWidth: '760px',
          }}
        >
          Console de estudos para concursos públicos.{'\n'}Suba o edital — a IA monta seu plano.
        </p>

        {/* Feature chips */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { label: '📋 Plano de estudos', bg: '#1e3a8a' },
            { label: '🃏 Flashcards', bg: '#14532d' },
            { label: '❓ Questões com IA', bg: '#4c1d95' },
          ].map(f => (
            <div
              key={f.label}
              style={{
                background: f.bg,
                borderRadius: '12px',
                padding: '14px 24px',
                color: '#e2e8f0',
                fontSize: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {f.label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
