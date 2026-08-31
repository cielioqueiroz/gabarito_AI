import assert from 'node:assert/strict'
import {
  validarFlashcardsGerados,
  validarPlanoGerado,
  validarQuestoesGeradas,
  validarResumoGerado,
} from '../lib/geracao.ts'

const flashcards = validarFlashcardsGerados({
  flashcards: [
    { frente: '  O que é vacatio legis?  ', verso: ' Período entre publicação e vigência. ' },
    { frente: '', verso: 'inválido' },
  ],
})
assert.deepEqual(flashcards, [
  { frente: 'O que é vacatio legis?', verso: 'Período entre publicação e vigência.' },
])

const questoes = validarQuestoesGeradas({
  questoes: [{
    enunciado: '  Qual é a alternativa correta? ',
    alternativas: [
      { letra: 'a', texto: ' Primeira ' },
      { letra: 'B', texto: ' Segunda ' },
      { letra: 'B', texto: 'duplicada' },
    ],
    correta: 'b',
    explicacao: ' Porque é a segunda. ',
    dificuldade: 'inventada',
    tags: [' lei ', '', 'x'.repeat(100)],
  }],
})
assert.deepEqual(questoes, [{
  enunciado: 'Qual é a alternativa correta?',
  alternativas: [
    { letra: 'A', texto: 'Primeira' },
    { letra: 'B', texto: 'Segunda' },
  ],
  correta: 'B',
  explicacao: 'Porque é a segunda.',
  dificuldade: 'medio',
  tags: ['lei', 'x'.repeat(60)],
}])

assert.deepEqual(validarQuestoesGeradas({
  questoes: [{
    enunciado: 'Sem alternativa correta válida',
    alternativas: [{ letra: 'A', texto: 'Uma' }, { letra: 'B', texto: 'Duas' }],
    correta: 'C',
  }],
}), [])

const plano = validarPlanoGerado({
  disciplinas: [
    { nome: ' Direito Constitucional ', topicos: [' Direitos fundamentais ', '', 'Direitos fundamentais'] },
    { nome: '', topicos: ['inválido'] },
  ],
})
assert.deepEqual(plano, [{
  nome: 'Direito Constitucional',
  topicos: ['Direitos fundamentais'],
}])

assert.deepEqual(validarResumoGerado({ titulo: '  Princípios ', conteudo: '  Conteúdo objetivo. ' }), {
  titulo: 'Princípios',
  conteudo: 'Conteúdo objetivo.',
})
assert.equal(validarResumoGerado({ titulo: '', conteudo: 'sem título' }), null)

console.log('✓ validação de saída da IA passou')
