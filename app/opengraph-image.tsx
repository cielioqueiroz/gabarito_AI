import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'gabarito_AI — transforme o edital em plano de estudos'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const itens = [
  ['01', 'edital lido e organizado'],
  ['02', 'plano no ritmo da prova'],
  ['03', 'revisão antes de esquecer'],
]

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#EFEEEA', color: '#1E1F22', padding: '58px 64px', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 43px, #D5D4CE 44px)', opacity: 0.38 }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 42, width: 2, display: 'flex', background: '#27408B55' }} />
        <div style={{ position: 'absolute', top: 24, right: 28, display: 'flex', fontFamily: 'monospace', fontSize: 13, letterSpacing: 3, color: '#6B6C73' }}>
          EDIÇÃO 2026 / CONCURSOS
        </div>

        <div style={{ width: 690, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 58, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F8F6', border: '2px solid #1E1F22', boxShadow: '5px 5px 0 #27408B' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8.5" fill="none" stroke="#1E1F22" strokeWidth="2" />
                <circle cx="12" cy="12" r="4.4" fill="#27408B" />
              </svg>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', fontFamily: 'serif', fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
              <span>gabarito</span>
              <div style={{ width: 11, height: 11, borderRadius: 11, background: '#27408B', margin: '0 6px', display: 'flex' }} />
              <span style={{ fontFamily: 'monospace', fontSize: 19, fontWeight: 700, color: '#27408B', letterSpacing: 1 }}>AI</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontFamily: 'serif', fontSize: 74, fontWeight: 700, lineHeight: 0.96, letterSpacing: -3 }}>O edital vira plano.</div>
            <div style={{ display: 'flex', marginTop: 11, fontFamily: 'serif', fontSize: 74, fontWeight: 700, lineHeight: 0.96, letterSpacing: -3, color: '#6B6C73' }}>O plano vira rotina.</div>
            <div style={{ width: 276, height: 11, display: 'flex', marginTop: 18, marginLeft: 286, background: '#27408B', transform: 'rotate(-1.5deg)' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'monospace', fontSize: 16, color: '#55565C', letterSpacing: 1 }}>
            <span style={{ color: '#27408B', fontWeight: 700 }}>PDF ENTRA</span><span>→</span><span>PLANO · QUESTÕES · FLASHCARDS · PODCAST</span>
          </div>
        </div>

        <div style={{ width: 350, height: 486, marginLeft: 'auto', marginTop: 14, display: 'flex', flexDirection: 'column', background: '#F8F8F6', border: '2px solid #1E1F22', boxShadow: '10px 10px 0 #D5D4CE', transform: 'rotate(1.5deg)', padding: '28px 28px 24px', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 18, borderBottom: '1px solid #D5D4CE', fontFamily: 'monospace', fontSize: 13, color: '#6B6C73', letterSpacing: 2 }}>
            <span>DOSSIÊ DE ESTUDO</span><span style={{ color: '#27408B' }}>01/01</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 27 }}>
            <div style={{ display: 'flex', fontSize: 15, color: '#6B6C73' }}>Analista Judiciário</div>
            <div style={{ display: 'flex', marginTop: 4, fontFamily: 'serif', fontSize: 34, fontWeight: 700, lineHeight: 1.05 }}>Plano em ação</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 34 }}>
            {itens.map(([numero, texto], index) => (
              <div key={numero} style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{ width: 31, height: 31, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${index < 2 ? '#27408B' : '#D5D4CE'}`, background: index < 2 ? '#DCE3F2' : '#F8F8F6', fontFamily: 'monospace', fontSize: 12, color: index < 2 ? '#1C2F66' : '#6B6C73' }}>{numero}</div>
                <span style={{ fontSize: 16, color: index < 2 ? '#1E1F22' : '#6B6C73' }}>{texto}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #D5D4CE' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 12, color: '#6B6C73' }}>
              <span>PROGRESSO DO EDITAL</span><span style={{ color: '#27408B' }}>64%</span>
            </div>
            <div style={{ height: 8, display: 'flex', marginTop: 9, background: '#E4E3DD' }}>
              <div style={{ width: '64%', display: 'flex', background: '#27408B' }} />
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
