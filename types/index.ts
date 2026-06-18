export interface Concurso {
  id: string
  user_id: string
  nome: string
  cargo: string | null
  ano: string | null
  banca: string | null
  created_at: string
}

export interface Disciplina {
  id: string
  concurso_id: string
  nome: string
  ordem: number
}

export interface Topico {
  id: string
  disciplina_id: string
  texto: string
  estudado: boolean
  ordem: number
}

export interface Alternativa {
  letra: string
  texto: string
}

export interface Flashcard {
  id: string
  disciplina_id: string
  frente: string
  verso: string
  box: number
  prox_revisao: string
  created_at: string
}

export interface Questao {
  id: string
  disciplina_id: string
  enunciado: string
  alternativas: Alternativa[]
  correta: string
  explicacao: string | null
  created_at: string
}

export interface Resposta {
  id: string
  user_id: string
  questao_id: string
  acertou: boolean
  respondido_em: string
}

export interface DisciplinaComStats extends Disciplina {
  topicos: Topico[]
  flashcards: Flashcard[]
  questoes: Questao[]
}
