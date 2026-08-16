// Testes de limparEnunciado (lib/extracao.ts).
//
// O modelo às vezes devolve as alternativas dentro do enunciado E no array,
// o que faria a tela mostrar as opções duas vezes. Caso real capturado no
// teste end-to-end contra a prova FUNCAB/PRF.
//
//   node --experimental-strip-types scripts/testar-enunciado.mjs

import { limparEnunciado } from '../lib/extracao.ts'

const cinco = ['A','B','C','D','E'].map(letra => ({ letra }))
let falhas = 0
function verificar(titulo, obtido, esperado) {
  const ok = obtido === esperado
  console.log(`  ${ok ? '✓' : '✗'} ${titulo}`)
  if (!ok) { console.log(`      esperado: ${JSON.stringify(esperado)}`); console.log(`      obtido:   ${JSON.stringify(obtido)}`); falhas++ }
}

console.log('\ncorta alternativas repetidas:')

// Caso real, questão 01 da prova da PRF
verificar('caso real da prova',
  limparEnunciado(
`Com relação à crônica, é correto afirmar que o autor:

A) entende ser desnecessária a substituição das referências.
B) deixa espaço para comentários sobre as reais condições.
C) posiciona-se como um transeunte em uma cidade que se construía.
D) objetiva criar uma paisagem, marcando a capacidade do povo.
E) descreve os problemas típicos de uma cidade cosmopolita.`, cinco),
  'Com relação à crônica, é correto afirmar que o autor:')

verificar('aceita "A." e "(A)" como separadores',
  limparEnunciado('Qual a alternativa correta sobre o tema?\n(A). primeira\n(B). segunda\n(C). terceira\n(D). quarta\n(E). quinta', cinco),
  'Qual a alternativa correta sobre o tema?')

console.log('\nnão corta o que não deve:')

verificar('enunciado limpo passa intacto',
  limparEnunciado('Qual é a capital do Brasil?', cinco),
  'Qual é a capital do Brasil?')

const comLista = 'Analise as afirmativas sobre o processo administrativo brasileiro.\na) é regido por lei\nb) admite recurso'
verificar('lista legítima de 2 itens não vira corte (menos que as alternativas)',
  limparEnunciado(comLista, cinco), comLista)

verificar('não engole tudo quando o enunciado é curto demais antes do corte',
  limparEnunciado('Leia:\nA) um\nB) dois\nC) três\nD) quatro\nE) cinco', cinco),
  'Leia:\nA) um\nB) dois\nC) três\nD) quatro\nE) cinco')

verificar('texto com parêntese no meio da frase não confunde',
  limparEnunciado('O item (A) do contrato prevê multa. Assinale a correta:', cinco),
  'O item (A) do contrato prevê multa. Assinale a correta:')

console.log(falhas === 0 ? '\n✓ todos os casos passaram\n' : `\n✗ ${falhas} falha(s)\n`)
process.exit(falhas === 0 ? 0 : 1)
