const MAX_TEXTO = 5000
const MAX_NOME = 200
const MAX_TOPICO = 500
const MAX_TAG = 60
const LETRAS = new Set(['A', 'B', 'C', 'D', 'E'])
const DIFICULDADES = new Set(['facil', 'medio', 'dificil'])

type Objeto = Record<string, unknown>

function objeto(valor: unknown): Objeto | null {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor)
    ? valor as Objeto
    : null
}

function texto(valor: unknown, max: number): string {
  return typeof valor === 'string' ? valor.trim().slice(0, max) : ''
}

export interface FlashcardGerado {
  frente: string
  verso: string
}

export function validarFlashcardsGerados(valor: unknown): FlashcardGerado[] {
  const raiz = objeto(valor)
  const itens = Array.isArray(raiz?.flashcards) ? raiz.flashcards.slice(0, 12) : []
  return itens.flatMap(item => {
    const card = objeto(item)
    const frente = texto(card?.frente, MAX_TEXTO)
    const verso = texto(card?.verso, MAX_TEXTO)
    return frente && verso ? [{ frente, verso }] : []
  })
}

export interface AlternativaGerada {
  letra: string
  texto: string
}

export interface QuestaoGerada {
  enunciado: string
  alternativas: AlternativaGerada[]
  correta: string
  explicacao: string | null
  dificuldade: 'facil' | 'medio' | 'dificil'
  tags: string[]
}

function validarAlternativas(valor: unknown): AlternativaGerada[] {
  if (!Array.isArray(valor)) return []
  const vistas = new Set<string>()
  return valor.slice(0, 6).flatMap(item => {
    const alternativa = objeto(item)
    const letra = texto(alternativa?.letra, 1).toUpperCase()
    const conteudo = texto(alternativa?.texto, MAX_TEXTO)
    if (!LETRAS.has(letra) || !conteudo || vistas.has(letra)) return []
    vistas.add(letra)
    return [{ letra, texto: conteudo }]
  })
}

export function validarQuestoesGeradas(valor: unknown): QuestaoGerada[] {
  const raiz = objeto(valor)
  const itens = Array.isArray(raiz?.questoes) ? raiz.questoes.slice(0, 8) : []
  return itens.flatMap(item => {
    const questao = objeto(item)
    const enunciado = texto(questao?.enunciado, MAX_TEXTO)
    const alternativas = validarAlternativas(questao?.alternativas)
    const correta = texto(questao?.correta, 1).toUpperCase()
    if (!enunciado || alternativas.length < 2 || !alternativas.some(a => a.letra === correta)) return []

    const dificuldadeRaw = texto(questao?.dificuldade, 10)
    const dificuldade = DIFICULDADES.has(dificuldadeRaw)
      ? dificuldadeRaw as QuestaoGerada['dificuldade']
      : 'medio'
    const tags = Array.isArray(questao?.tags)
      ? questao.tags.map(tag => texto(tag, MAX_TAG)).filter(Boolean).slice(0, 10)
      : []

    return [{
      enunciado,
      alternativas,
      correta,
      explicacao: texto(questao?.explicacao, MAX_TEXTO) || null,
      dificuldade,
      tags,
    }]
  })
}

export interface DisciplinaGerada {
  nome: string
  topicos: string[]
}

export interface ResumoGerado {
  titulo: string
  conteudo: string
}

export function validarResumoGerado(valor: unknown): ResumoGerado | null {
  const resumo = objeto(valor)
  const titulo = texto(resumo?.titulo, MAX_NOME)
  const conteudo = texto(resumo?.conteudo, 30_000)
  return titulo && conteudo ? { titulo, conteudo } : null
}

export function normalizarChave(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function validarPlanoGerado(valor: unknown): DisciplinaGerada[] {
  const raiz = objeto(valor)
  const itens = Array.isArray(raiz?.disciplinas) ? raiz.disciplinas.slice(0, 80) : []
  const nomes = new Set<string>()

  return itens.flatMap(item => {
    const disciplina = objeto(item)
    const nome = texto(disciplina?.nome, MAX_NOME)
    const chave = normalizarChave(nome)
    if (!nome || nomes.has(chave)) return []
    nomes.add(chave)

    const topicosVistos = new Set<string>()
    const topicos = Array.isArray(disciplina?.topicos)
      ? disciplina.topicos.slice(0, 300).flatMap(itemTopico => {
          const topico = texto(itemTopico, MAX_TOPICO)
          const chaveTopico = normalizarChave(topico)
          if (!topico || topicosVistos.has(chaveTopico)) return []
          topicosVistos.add(chaveTopico)
          return [topico]
        })
      : []

    return topicos.length ? [{ nome, topicos }] : []
  })
}
