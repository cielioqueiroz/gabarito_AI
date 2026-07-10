/* Carrossel infinito com as principais bancas de concurso do Brasil.
   Cada banca aparece com a cor da sua identidade (o "estilo original"),
   discreta em repouso e acesa no hover. Puro CSS (ver globals.css:
   .marquee-track / .card-interactive) — sem JS, roda como Server Component. */

type Banca = { nome: string; cor: string; peso?: string; tracking?: string; italic?: boolean }

const bancas: Banca[] = [
  { nome: 'Cebraspe',   cor: '#1FC0AE', peso: 'font-extrabold', tracking: 'tracking-tight' },
  { nome: 'FGV',        cor: '#5B93F7', peso: 'font-black',      tracking: 'tracking-widest' },
  { nome: 'FCC',        cor: '#6AA5F2', peso: 'font-bold',       tracking: 'tracking-wide' },
  { nome: 'VUNESP',     cor: '#1FBFB4', peso: 'font-bold',       tracking: 'tracking-[0.2em]' },
  { nome: 'Cesgranrio', cor: '#F26A79', peso: 'font-semibold',   tracking: 'tracking-tight' },
  { nome: 'IBFC',       cor: '#6E88F5', peso: 'font-extrabold',  tracking: 'tracking-widest' },
  { nome: 'Quadrix',    cor: '#F59B3C', peso: 'font-bold',       tracking: 'tracking-tight', italic: true },
  { nome: 'IADES',      cor: '#4FB0F0', peso: 'font-semibold',   tracking: 'tracking-wide' },
  { nome: 'AOCP',       cor: '#F26670', peso: 'font-black',      tracking: 'tracking-[0.18em]' },
  { nome: 'Consulplan', cor: '#46D089', peso: 'font-semibold',   tracking: 'tracking-tight' },
  { nome: 'FUNDATEC',   cor: '#5A93E0', peso: 'font-bold',       tracking: 'tracking-wide' },
  { nome: 'IDECAN',     cor: '#57D577', peso: 'font-extrabold',  tracking: 'tracking-tight' },
  { nome: 'FEPESE',     cor: '#7EA6F5', peso: 'font-semibold',   tracking: 'tracking-widest' },
  { nome: 'FUNCAB',     cor: '#F5B24E', peso: 'font-bold',       tracking: 'tracking-tight' },
]

function Item({ b }: { b: Banca }) {
  return (
    <span className="group inline-flex flex-shrink-0 items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.05]">
      <span
        aria-hidden
        className="h-1.5 w-1.5 flex-shrink-0 rounded-full opacity-60 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: b.cor, boxShadow: `0 0 10px 1px ${b.cor}66` }}
      />
      <span
        className={`whitespace-nowrap text-lg ${b.peso ?? 'font-bold'} ${b.tracking ?? ''} ${b.italic ? 'italic' : ''}`}
        style={{ color: b.cor, opacity: 0.82 }}
      >
        {b.nome}
      </span>
    </span>
  )
}

export default function BancasMarquee() {
  return (
    <section aria-label="Principais bancas de concurso do Brasil" className="relative py-14">
      <p className="mb-8 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-[#6E6E7A]">
        Feito para as bancas que mais caem
      </p>

      <div className="marquee-viewport marquee-mask relative w-full overflow-hidden">
        {/* track duplicada: -50% = exatamente um ciclo → loop perfeito */}
        <div className="marquee-track gap-4 pr-4">
          {[...bancas, ...bancas].map((b, i) => (
            <Item key={`${b.nome}-${i}`} b={b} />
          ))}
        </div>
      </div>
    </section>
  )
}
