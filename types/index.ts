export interface Concurso {
  id: string
  user_id: string
  nome: string
  cargo: string | null
  ano: string | null
  banca: string | null
  /** Documento que originou o plano. */
  fonte?: 'manual' | 'edital' | 'prova' | null
  created_at: string
}

export interface Disciplina {
  id: string
  concurso_id: string
  nome: string
  ordem: number
  /** Nº de questões que a banca cobra da disciplina; null quando não deu para saber. */
  peso?: number | null
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

// Public shape sent to client — server withholds `correta` and `explicacao`
// until the user submits an answer via /api/responder.
export interface Questao {
  id: string
  disciplina_id: string
  enunciado: string
  alternativas: Alternativa[]
  dificuldade?: 'facil' | 'medio' | 'dificil'
  tags?: string[]
  /** 'prova' = transcrita de prova oficial; 'ia' = gerada pelo modelo. */
  origem?: 'prova' | 'ia' | null
  /** Número na prova original, quando origem = 'prova'. */
  numero?: number | null
  topico?: string | null
  created_at: string
}

export interface Resposta {
  id: string
  user_id: string
  questao_id: string
  acertou: boolean
  respondido_em: string
}

export interface Resumo {
  id: string
  disciplina_id: string
  titulo: string
  conteudo: string
  created_at: string
}

export interface DisciplinaComStats extends Disciplina {
  topicos: Topico[]
  flashcards: Flashcard[]
  questoes: Questao[]
}
