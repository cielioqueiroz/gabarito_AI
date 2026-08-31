import { NextRequest, NextResponse } from 'next/server'
import { callClaudeStructured, wrapDocumento } from '@/lib/anthropic'
import { QUESTOES_SCHEMA, SISTEMA_QUESTOES, pedidoQuestoes, limparEnunciado, type QuestaoExtraida } from '@/lib/extracao'
import { lerDocumento, ArquivoInvalidoError } from '@/lib/documentos'
import { requireAuth, checkRateLimit, assertConcursoOwnership } from '@/lib/apiHelpers'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
// Ver a nota sobre 300 s em criar-com-edital: a latência do modelo oscila
// demais para caber com segurança nos 60 s padrão.
export const maxDuration = 300

/**
 * Fase 2 da ingestão: transcreve as questões reais da prova.
 *
 * O cliente chama uma vez por LOTE, reenviando o mesmo arquivo. Fatiar não é
 * preferência, é necessidade: pedir as 60 questões de uma vez estoura o teto de
 * tokens de saída do modelo e devolve JSON cortado, que perde o lote inteiro.
 * O lote é dimensionado em QUESTÕES (~10), não em disciplinas — quem enche a
 * resposta é o volume transcrito, e uma disciplina pode ter 6 ou 20 questões.
 *
 * Cada lote é independente: um que falhe não derruba os outros nem o plano,
 * que já foi salvo na fase 1.
 */

const MAX_DISCIPLINAS_POR_LOTE = 4

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const rl = await checkRateLimit(auth.supabase, auth.userId, 'importar-questoes', 30)
  if (rl) return rl

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Não consegui receber o arquivo' }, { status: 413 })
  }

  const concursoId = (formData.get('concursoId') as string ?? '').trim()
  const file = formData.get('arquivo') as File | null

  if (!concursoId || !file) {
    return NextResponse.json({ error: 'concursoId e arquivo são obrigatórios' }, { status: 400 })
  }
  if (!(await assertConcursoOwnership(auth.supabase, auth.userId, concursoId))) {
    return NextResponse.json({ error: 'Concurso não encontrado' }, { status: 404 })
  }

  let pedidas: { id: string; nome: string }[]
  try {
    const bruto = JSON.parse((formData.get('disciplinas') as string) ?? '[]')
    if (!Array.isArray(bruto) || !bruto.length) throw new Error('lista vazia')
    // Os ids vão para um `.in()` no Postgres — precisam ser strings, não
    // objetos ou números vindos de um cliente adulterado.
    pedidas = bruto
      .filter((d: unknown): d is { id: string; nome: string } =>
        !!d && typeof (d as { id?: unknown }).id === 'string')
      .map((d) => ({ id: d.id, nome: String(d.nome ?? '') }))
    if (!pedidas.length) throw new Error('nenhum id válido')
  } catch {
    return NextResponse.json({ error: 'disciplinas deve ser uma lista não vazia' }, { status: 400 })
  }
  if (pedidas.length > MAX_DISCIPLINAS_POR_LOTE) {
    return NextResponse.json(
      { error: `Máximo de ${MAX_DISCIPLINAS_POR_LOTE} disciplinas por lote` }, { status: 400 })
  }

  // As disciplinas precisam ser deste concurso — o id vem do cliente e o RLS
  // sozinho não impediria apontar para a disciplina de outro concurso do
  // próprio usuário.
  const { data: validas } = await auth.supabase
    .from('disciplinas').select('id, nome')
    .eq('concurso_id', concursoId)
    .in('id', pedidas.map(d => d.id))

  if (!validas?.length) {
    return NextResponse.json({ error: 'Disciplinas não encontradas neste concurso' }, { status: 404 })
  }
  const porNome = new Map(validas.map(d => [d.nome.toLowerCase().trim(), d.id]))

  let doc
  try {
    doc = await lerDocumento(file)
  } catch (err) {
    if (err instanceof ArquivoInvalidoError) {
      return NextResponse.json({ error: err.message, hint: err.dica }, { status: 400 })
    }
    return NextResponse.json({ error: 'Falha ao ler o arquivo' }, { status: 400 })
  }

  const pedido = pedidoQuestoes(validas.map(d => d.nome))

  let extraido: { questoes: QuestaoExtraida[] }
  try {
    const ehTexto = doc.modo === 'texto'
    extraido = await callClaudeStructured<{ questoes: QuestaoExtraida[] }>({
      schema: QUESTOES_SCHEMA,
      toolName: 'importar_questoes',
      toolDescription: 'Transcreve as questões de uma prova de concurso.',
      system: SISTEMA_QUESTOES,
      user: ehTexto
        ? `${pedido}\n\n${wrapDocumento((doc.partes[0] as { text: string }).text)}`
        : pedido,
      files: ehTexto ? undefined : doc.partes,
      // Uma questão transcrita com texto de apoio passa de 700 tokens; um lote
      // de ~10 pede uns 8k. A folga aqui é barata (só limita, não reserva) e
      // evita devolver JSON cortado, que é perda total do lote.
      maxTokens: 32768,
      temperature: 0.1,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error('importar-questoes', 'gemini', { err: msg, disciplinas: validas.length })
    return NextResponse.json({
      error: 'Erro ao extrair as questões',
      detail: msg,
      hint: /truncada/i.test(msg)
        ? 'Tente importar menos disciplinas por vez.'
        : 'Tente novamente em alguns segundos.',
    }, { status: 502 })
  }

  // Reimportar a mesma prova não pode duplicar nem apagar respostas já dadas,
  // então as questões já existentes são simplesmente puladas.
  const { data: existentes } = await auth.supabase
    .from('questoes').select('disciplina_id, numero')
    .in('disciplina_id', validas.map(d => d.id))
    .eq('origem', 'prova')
  const jaTem = new Set((existentes ?? []).map(q => `${q.disciplina_id}:${q.numero}`))

  // Limites do que o modelo pode devolver. A saída da IA é entrada não
  // confiável como qualquer outra: nada aqui vai para o banco sem ser medido.
  const LETRAS = new Set(['A', 'B', 'C', 'D', 'E'])
  const MAX_ENUNCIADO = 5000
  const MAX_ALTERNATIVAS = 6
  const MAX_QUESTOES = 60
  const novasNoLote = new Set<string>()

  const linhas = (extraido.questoes ?? []).slice(0, MAX_QUESTOES).flatMap(q => {
    const disciplinaId = porNome.get(q.disciplina?.toLowerCase().trim() ?? '')
    if (!disciplinaId) return []
    if (!q.enunciado?.trim() || !Array.isArray(q.alternativas) || q.alternativas.length < 2) return []

    const alternativasVistas = new Set<string>()
    const alternativas = q.alternativas.slice(0, MAX_ALTERNATIVAS).flatMap(a => {
      const letra = (a.letra ?? '').trim().toUpperCase().slice(0, 1)
      const texto = (a.texto ?? '').trim().slice(0, MAX_ENUNCIADO)
      if (!LETRAS.has(letra) || !texto || alternativasVistas.has(letra)) return []
      alternativasVistas.add(letra)
      return [{ letra, texto }]
    })
    if (alternativas.length < 2) return []

    const correta = (q.correta ?? '').trim().toUpperCase().slice(0, 1)
    if (!LETRAS.has(correta)) return []
    if (!alternativas.some(a => a.letra === correta)) return []

    // `numero` vai para uma coluna int: fora da faixa de uma prova real, é lixo.
    const numero = Number.isInteger(q.numero) && q.numero > 0 && q.numero <= 500 ? q.numero : null
    if (numero == null) return []
    const chave = `${disciplinaId}:${numero}`
    if (jaTem.has(chave) || novasNoLote.has(chave)) return []
    novasNoLote.add(chave)

    // O modelo às vezes repete as alternativas dentro do enunciado, mesmo
    // instruído a não fazer — sem isto a tela mostra as opções duas vezes.
    const enunciado = limparEnunciado(q.enunciado, q.alternativas)

    return [{
      disciplina_id: disciplinaId,
      enunciado: enunciado.slice(0, MAX_ENUNCIADO),
      alternativas,
      correta,
      explicacao: q.explicacao?.trim().slice(0, MAX_ENUNCIADO) || null,
      // A coluna tem CHECK: valor inventado pelo modelo quebraria o insert.
      dificuldade: ['facil', 'medio', 'dificil'].includes(q.dificuldade ?? '') ? q.dificuldade : 'medio',
      topico: q.topico?.trim().slice(0, 200) || null,
      numero,
      origem: 'prova' as const,
      tags: q.topico ? [q.topico.trim().slice(0, 60)] : [],
    }]
  })

  if (!linhas.length) {
    return NextResponse.json({ ok: true, importadas: 0, aviso: 'Nenhuma questão nova nestas disciplinas.' })
  }

  const { error } = await auth.supabase.from('questoes').insert(linhas)
  if (error) {
    logger.error('importar-questoes', 'insert', { err: error.message })
    return NextResponse.json({ error: 'Erro ao salvar as questões' }, { status: 500 })
  }

  logger.info('importar-questoes', 'ok', { importadas: linhas.length, disciplinas: validas.length })
  return NextResponse.json({ ok: true, importadas: linhas.length })
}
