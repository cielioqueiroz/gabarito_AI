/* Carrossel infinito com as bancas cujos logos OFICIAIS temos em arquivo
   (public/bancas). Cada logo vai num "chip" branco uniforme, para que marcas
   com fundo branco ou transparente fiquem legíveis tanto no tema claro quanto
   no escuro. Puro CSS (globals.css: .marquee-track) — roda como Server Component.

   Créditos: FGV e Cesgranrio via Wikimedia Commons (CC BY-SA). Cebraspe e IBFC
   dos sites oficiais. Todas as marcas pertencem aos seus respectivos titulares
   e aparecem aqui apenas como referência às bancas cobertas pelo app. */

/* w/h = dimensões intrínsecas do arquivo. Vão no <img> para o browser reservar
   a caixa antes do download (sem isto o carrossel entra no CLS). Os arquivos já
   estão no tamanho de exibição (~2x de h-8); o Cebraspe segue em PNG porque em
   WebP ficava maior que o original. */
type Banca = { nome: string; logo: string; alt: string; w: number; h: number }

const bancas: Banca[] = [
  { nome: 'Cebraspe',   logo: '/bancas/cebraspe.png',   alt: 'Cebraspe',                        w: 212, h: 50 },
  { nome: 'FGV',        logo: '/bancas/fgv.webp',       alt: 'Fundação Getulio Vargas (FGV)',   w: 300, h: 54 },
  { nome: 'Cesgranrio', logo: '/bancas/cesgranrio.webp', alt: 'Cesgranrio',                     w: 206, h: 64 },
  { nome: 'IBFC',       logo: '/bancas/ibfc.webp',      alt: 'IBFC',                            w: 129, h: 64 },
]

// Sequência longa o bastante para o loop -50% cobrir a viewport sem falhas.
const seq = Array(3).fill(bancas).flat()

function Chip({ b }: { b: Banca }) {
  return (
    <span className="inline-flex h-12 flex-shrink-0 items-center justify-center px-7 opacity-90 transition-all duration-300 hover:-translate-y-0.5 hover:opacity-100">
      {/* eslint-disable-next-line @next/next/no-img-element — logos oficiais em public/bancas, fundo transparente */}
      <img
        src={b.logo}
        alt={b.alt}
        width={b.w}
        height={b.h}
        loading="lazy"
        decoding="async"
        className="h-8 w-auto max-w-[150px] object-contain"
      />
    </span>
  )
}

export default function BancasMarquee() {
  return (
    <section aria-label="Bancas de concurso cobertas" className="relative py-14">
      <p className="mb-8 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Feito para as bancas que mais caem
      </p>

      {/* Faixa escura contínua — sem bordas nem cantos: o fundo (paleta do
          projeto: surface → carvão profundo) dissolve nas laterais via
          .band-fade, começando transparente até o tom cheio e sumindo no fim. */}
      <div
        className="band-fade relative w-full overflow-hidden py-7"
        style={{ background: 'linear-gradient(to bottom, #17171D, #0E0E13)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 90% at 50% 0%, rgba(74,114,232,0.10), transparent 70%)' }}
        />
        <div className="marquee-viewport relative w-full overflow-hidden">
          {/* track duplicada: -50% = exatamente um ciclo → loop perfeito */}
          <div className="marquee-track gap-4 pr-4">
            {[...seq, ...seq].map((b, i) => (
              <Chip key={`${b.nome}-${i}`} b={b} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
