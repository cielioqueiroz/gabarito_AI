import { ImageResponse } from 'next/og'

export const runtime     = 'edge'
export const alt         = 'gabarito_AI — console de estudos para concursos públicos'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0F1117',
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(#2A2D3E 1px, transparent 1px), linear-gradient(90deg, #2A2D3E 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            opacity: 0.3,
          }}
        />

        {/* Blue glow top-left */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: -80,
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, #2563EB22 0%, transparent 70%)',
          }}
        />

        {/* Amber glow bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: -100,
            right: 100,
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, #F59E0B11 0%, transparent 70%)',
          }}
        />

        {/* Top border accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #2563EB, #6366F1, transparent)',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '72px 80px',
            width: '100%',
          }}
        >
          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
            {/* Icon */}
            <div
              style={{
                width: 72,
                height: 72,
                background: 'linear-gradient(135deg, #1C1F2E, #252836)',
                borderRadius: 16,
                border: '1px solid #2A2D3E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 40px #2563EB33',
              }}
            >
              <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
                <defs>
                  <linearGradient id="ogcheck" x1="16" y1="20" x2="48" y2="46" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="100%" stopColor="#2563EB" />
                  </linearGradient>
                </defs>
                <path d="M18 33.5 L28 43 L47 21.5" stroke="url(#ogcheck)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="18" y="49" width="16" height="3.5" rx="1.75" fill="#3B82F6" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 56, fontWeight: 800, color: '#F1F5F9', letterSpacing: -2 }}>gabarito</span>
                <span style={{ fontFamily: 'monospace', fontSize: 56, fontWeight: 800, color: '#3B82F6', letterSpacing: -2 }}>_AI</span>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: 16, color: '#475569', letterSpacing: 4, textTransform: 'uppercase' }}>
                CONSOLE DE ESTUDOS PARA CONCURSOS
              </span>
            </div>
          </div>

          {/* Tagline */}
          <p style={{ fontSize: 26, color: '#94A3B8', margin: '0 0 52px', lineHeight: 1.5, maxWidth: 680, fontFamily: 'sans-serif' }}>
            Suba o edital — a IA organiza suas disciplinas,{'\n'}
            gera flashcards e cria questões para você praticar.
          </p>

          {/* Feature chips */}
          <div style={{ display: 'flex', gap: 14 }}>
            {[
              { label: 'Plano de Estudos', color: '#1e3a8a', border: '#2563EB33', text: '#60A5FA' },
              { label: 'Flashcards Leitner', color: '#14532d', border: '#16a34a33', text: '#4ADE80' },
              { label: 'Questões com IA', color: '#3b0764', border: '#7c3aed33', text: '#A78BFA' },
              { label: 'Upload de Edital', color: '#7c2d12', border: '#ea580c33', text: '#FB923C' },
            ].map(f => (
              <div
                key={f.label}
                style={{
                  background: f.color,
                  borderRadius: 10,
                  padding: '10px 18px',
                  color: f.text,
                  fontSize: 15,
                  border: `1px solid ${f.border}`,
                  fontFamily: 'monospace',
                  letterSpacing: 0.5,
                }}
              >
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Right side decorative card */}
        <div
          style={{
            position: 'absolute',
            right: 60,
            top: '50%',
            transform: 'translateY(-50%) rotate(6deg)',
            width: 220,
            background: '#1C1F2E',
            border: '1px solid #2A2D3E',
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 20px 60px #00000066',
          }}
        >
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#475569', marginBottom: 8, letterSpacing: 2, textTransform: 'uppercase' }}>Plano de estudos</div>
          {['Direito Constitucional', 'Matemática', 'Informática', 'Raciocínio Lógico'].map((d, i) => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: i < 2 ? '#2563EB' : '#252836', border: '1px solid #2A2D3E', flexShrink: 0 }} />
              <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: i < 2 ? '#94A3B8' : '#475569', textDecoration: i < 2 ? 'line-through' : 'none' }}>{d}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, background: '#252836', borderRadius: 6, height: 4, overflow: 'hidden' }}>
            <div style={{ width: '50%', height: '100%', background: '#2563EB', borderRadius: 6 }} />
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#3B82F6', marginTop: 4 }}>50% concluído</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
