// Teste do loteamento de disciplinas (components/NovoConcursoForm.tsx).
//
// É lógica pura e é a peça que decide quantas requisições a importação faz e
// se alguma delas estoura o limite de tokens do modelo. Vale um teste.
//
//   node scripts/testar-lotes.mjs

const QUESTOES_POR_LOTE = 10
const MAX_DISCIPLINAS_POR_LOTE = 4
const PESO_PADRAO = 8

// Cópia da regra de NovoConcursoForm.tsx — mantenha as duas em sincronia.
function montarLotes(disciplinas) {
  const lotes = []
  let atual = []
  let acumulado = 0
  for (const d of disciplinas) {
    const cheio = acumulado >= QUESTOES_POR_LOTE || atual.length >= MAX_DISCIPLINAS_POR_LOTE
    if (atual.length && cheio) { lotes.push(atual); atual = []; acumulado = 0 }
    atual.push(d)
    acumulado += d.peso > 0 ? d.peso : PESO_PADRAO
  }
  if (atual.length) lotes.push(atual)
  return lotes
}

const d = (nome, peso) => ({ id: nome, nome, peso })
const questoesDe = (lote) => lote.reduce((n, x) => n + (x.peso > 0 ? x.peso : PESO_PADRAO), 0)

let falhas = 0
function verificar(titulo, condicao, detalhe) {
  if (condicao) { console.log(`  ✓ ${titulo}`) }
  else { console.log(`  ✗ ${titulo}${detalhe ? ` — ${detalhe}` : ''}`); falhas++ }
}

// ── Caso real: prova da FUNCAB/PRF, 9 disciplinas, 60 questões ──────────────
console.log('\nprova FUNCAB/PRF (12,6,6,6,6,6,6,6,6):')
const prf = [
  d('Português', 12), d('Ética', 6), d('RLM', 6), d('Constitucional', 6),
  d('Administrativo', 6), d('Administração', 6), d('Arquivologia', 6),
  d('Informática', 6), d('Legislação PRF', 6),
]
const lotesPrf = montarLotes(prf)
console.log(`    ${lotesPrf.length} lotes: ${lotesPrf.map(questoesDe).join(', ')} questões`)
verificar('não perde nenhuma disciplina',
  lotesPrf.flat().length === prf.length, `${lotesPrf.flat().length} de ${prf.length}`)
verificar('preserva a ordem',
  lotesPrf.flat().map(x => x.nome).join() === prf.map(x => x.nome).join())
verificar('menos requisições do que uma por disciplina',
  lotesPrf.length < prf.length, `${lotesPrf.length} lotes`)
verificar('nenhum lote passa de 20 questões (teto de tokens)',
  lotesPrf.every(l => questoesDe(l) <= 20), `máximo ${Math.max(...lotesPrf.map(questoesDe))}`)
verificar('respeita o máximo de disciplinas por lote da rota',
  lotesPrf.every(l => l.length <= MAX_DISCIPLINAS_POR_LOTE))

// ── Bordas ───────────────────────────────────────────────────────────────────
console.log('\nbordas:')
verificar('lista vazia devolve nenhum lote', montarLotes([]).length === 0)

const gigante = montarLotes([d('Português', 40)])
verificar('disciplina maior que o alvo vira um lote sozinha',
  gigante.length === 1 && gigante[0].length === 1)

const semPeso = montarLotes([d('A', 0), d('B', 0), d('C', 0), d('D', 0), d('E', 0)])
verificar('sem peso conhecido, usa o padrão e ainda agrupa',
  semPeso.length > 0 && semPeso.every(l => l.length <= MAX_DISCIPLINAS_POR_LOTE),
  `${semPeso.length} lotes de ${semPeso.map(l => l.length)}`)

const muitasPequenas = montarLotes(Array.from({ length: 12 }, (_, i) => d(`D${i}`, 1)))
verificar('12 disciplinas de 1 questão respeitam o teto de 4 por lote',
  muitasPequenas.every(l => l.length <= MAX_DISCIPLINAS_POR_LOTE),
  `${muitasPequenas.map(l => l.length)}`)

console.log(falhas === 0 ? '\n✓ todos os casos passaram\n' : `\n✗ ${falhas} falha(s)\n`)
process.exit(falhas === 0 ? 0 : 1)
