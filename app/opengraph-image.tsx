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
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#F2EBDD', color: '#24211D', padding: '58px 64px', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 43px, #D8CDB8 44px)', opacity: 0.38 }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 42, width: 2, display: 'flex', background: '#B33A2B55' }} />
        <div style={{ position: 'absolute', top: 24, right: 28, display: 'flex', fontFamily: 'monospace', fontSize: 13, letterSpacing: 3, color: '#6F665A' }}>
          EDIÇÃO 2026 / CONCURSOS
        </div>

        <div style={{ width: 690, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 58, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#B33A2B', border: '2px solid #7C241D', boxShadow: '5px 5px 0 #24211D' }}>
              <svg width="35" height="35" viewBox="0 0 64 64" fill="none">
                <path d="M18 33.5 L28 43 L47 21.5" stroke="#FFFDF7" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="18" y="49" width="16" height="3.5" rx="1.75" fill="#FFFDF7" />
              </svg>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', fontFamily: 'monospace', fontSize: 34, fontWeight: 800, letterSpacing: -2 }}>
              <span>gabarito</span><span style={{ color: '#9C2F25' }}>_AI</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontFamily: 'serif', fontSize: 74, fontWeight: 700, lineHeight: 0.96, letterSpacing: -3 }}>O edital vira plano.</div>
            <div style={{ display: 'flex', marginTop: 11, fontFamily: 'serif', fontSize: 74, fontWeight: 700, lineHeight: 0.96, letterSpacing: -3, color: '#6F665A' }}>O plano vira rotina.</div>
            <div style={{ width: 276, height: 11, display: 'flex', marginTop: 18, marginLeft: 286, background: '#B33A2B', transform: 'rotate(-1.5deg)' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'monospace', fontSize: 16, color: '#625B51', letterSpacing: 1 }}>
            <span style={{ color: '#9C2F25', fontWeight: 700 }}>PDF ENTRA</span><span>→</span><span>PLANO · QUESTÕES · FLASHCARDS · PODCAST</span>
          </div>
        </div>

        <div style={{ width: 350, height: 486, marginLeft: 'auto', marginTop: 14, display: 'flex', flexDirection: 'column', background: '#FFFDF7', border: '2px solid #24211D', boxShadow: '10px 10px 0 #CFC2AB', transform: 'rotate(1.5deg)', padding: '28px 28px 24px', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 18, borderBottom: '1px solid #CFC2AB', fontFamily: 'monospace', fontSize: 13, color: '#6F665A', letterSpacing: 2 }}>
            <span>DOSSIÊ DE ESTUDO</span><span style={{ color: '#9C2F25' }}>01/01</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 27 }}>
            <div style={{ display: 'flex', fontSize: 15, color: '#6F665A' }}>Analista Judiciário</div>
            <div style={{ display: 'flex', marginTop: 4, fontFamily: 'serif', fontSize: 34, fontWeight: 700, lineHeight: 1.05 }}>Plano em ação</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 34 }}>
            {itens.map(([numero, texto], index) => (
              <div key={numero} style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{ width: 31, height: 31, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${index < 2 ? '#9C2F25' : '#CFC2AB'}`, background: index < 2 ? '#EAD2C7' : '#FFFDF7', fontFamily: 'monospace', fontSize: 12, color: index < 2 ? '#7C241D' : '#6F665A' }}>{numero}</div>
                <span style={{ fontSize: 16, color: index < 2 ? '#24211D' : '#6F665A' }}>{texto}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #CFC2AB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 12, color: '#6F665A' }}>
              <span>PROGRESSO DO EDITAL</span><span style={{ color: '#9C2F25' }}>64%</span>
            </div>
            <div style={{ height: 8, display: 'flex', marginTop: 9, background: '#E8DECB' }}>
              <div style={{ width: '64%', display: 'flex', background: '#B33A2B' }} />
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
