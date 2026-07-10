/* Carrossel infinito com as bancas cujos logos OFICIAIS temos em arquivo
   (public/bancas). Cada logo vai num "chip" branco uniforme, para que marcas
   com fundo branco ou transparente fiquem legíveis tanto no tema claro quanto
   no escuro. Puro CSS (globals.css: .marquee-track) — roda como Server Component.

   Créditos: FGV e Cesgranrio via Wikimedia Commons (CC BY-SA). Cebraspe e IBFC
   dos sites oficiais. Todas as marcas pertencem aos seus respectivos titulares
   e aparecem aqui apenas como referência às bancas cobertas pelo app. */

type Banca = { nome: string; logo: string; alt: string }

const bancas: Banca[] = [
  { nome: 'Cebraspe',   logo: '/bancas/cebraspe.png',   alt: 'Cebraspe' },
  { nome: 'FGV',        logo: '/bancas/fgv.png',        alt: 'Fundação Getulio Vargas (FGV)' },
  { nome: 'Cesgranrio', logo: '/bancas/cesgranrio.png', alt: 'Cesgranrio' },
  { nome: 'IBFC',       logo: '/bancas/ibfc.png',       alt: 'IBFC' },
]

// Sequência longa o bastante para o loop -50% cobrir a viewport sem falhas.
const seq = Array(3).fill(bancas).flat()

function Chip({ b }: { b: Banca }) {
  return (
    <span className="inline-flex h-14 flex-shrink-0 items-center justify-center rounded-xl border border-black/[0.06] bg-white px-6 shadow-sm transition-transform duration-300 hover:-translate-y-0.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={b.logo}
        alt={b.alt}
        loading="lazy"
        className="h-7 w-auto max-w-[140px] object-contain"
      />
    </span>
  )
}

export default function BancasMarquee() {
  return (
    <section aria-label="Bancas de concurso cobertas" className="relative py-14">
      <p className="mb-8 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-[#6E6E7A]">
        Feito para as bancas que mais caem
      </p>

      <div className="marquee-viewport marquee-mask relative w-full overflow-hidden">
        {/* track duplicada: -50% = exatamente um ciclo → loop perfeito */}
        <div className="marquee-track gap-4 pr-4">
          {[...seq, ...seq].map((b, i) => (
            <Chip key={`${b.nome}-${i}`} b={b} />
          ))}
        </div>
      </div>

      <p className="mt-6 text-center font-mono text-[9px] tracking-wide text-[#6E6E7A]/70">
        Logos de FGV e Cesgranrio via Wikimedia Commons (CC BY-SA). Marcas de seus respectivos titulares.
      </p>
    </section>
  )
}
