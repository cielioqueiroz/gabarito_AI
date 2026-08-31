import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { callClaudeStructured, wrapDocumento } from '@/lib/anthropic'
import { PLANO_SCHEMA, SISTEMA_PLANO, PEDIDO_PLANO, type Plano } from '@/lib/extracao'
import { lerDocumento, ArquivoInvalidoError, MAX_FILE_BYTES } from '@/lib/documentos'
import { requireAuth, checkRateLimit } from '@/lib/apiHelpers'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
// 300 s exige Fluid Compute (padrão em projetos criados a partir de 2025).
// Necessário porque a latência do Gemini para um documento inteiro varia muito:
// medimos 22 s e 82 s para a MESMA prova, dependendo da carga do Google.
export const maxDuration = 300

/**
 * Fase 1 da ingestão: lê o documento e monta a ESTRUTURA do plano.
 *
 * As questões da prova não são transcritas aqui de propósito. Medido numa prova
 * real de 60 questões, extrair estrutura + questões numa passada só leva 54 s —
 * perto demais do teto de 60 s da Vercel. A transcrição fica na fase 2
 * (/api/importar-questoes), em lotes por disciplina e com progresso na tela.
 */

/** Último recurso para o nome: "edital-bb-2023.pdf" → "edital bb 2023". */
function nomeDoArquivo(file: File): string {
  const semExtensao = file.name.replace(/\.[^.]+$/, '')
  const legivel = semExtensao.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
  return (legivel || 'Concurso sem nome').slice(0, 200)
}

function limpar(valor: unknown): string | null {
  const s = typeof valor === 'string' ? valor.trim() : ''
  return s && s.toLowerCase() !== 'desconhecido' ? s.slice(0, 120) : null
}

interface DisciplinaSalva { id: string; nome: string; peso: number }

async function salvarPlano(
  supabase: SupabaseClient,
  concursoId: string,
  disciplinas: Plano['disciplinas'],
): Promise<DisciplinaSalva[]> {
  const linhas = disciplinas.map((d, i) => ({
    concurso_id: concursoId,
    nome: d.nome.slice(0, 200),
    ordem: i,
    peso: d.peso && d.peso > 0 ? d.peso : null,
  }))
  const { data: inseridas, error } = await supabase
    .from('disciplinas').insert(linhas).select('id, nome, ordem, peso')
  if (error || !inseridas) throw new Error(error?.message ?? 'insert disciplinas falhou')

  const topicos = inseridas.flatMap((d: { id: string; ordem: number }) =>
    (disciplinas[d.ordem]?.topicos ?? [])
      .filter(t => t && t.trim())
      .map((texto, j) => ({ disciplina_id: d.id, texto: texto.trim().slice(0, 500), ordem: j }))
  )
  if (topicos.length) {
    const { error: errTopicos } = await supabase.from('topicos').insert(topicos)
    if (errTopicos) throw new Error(errTopicos.message)
  }

  return inseridas
    .sort((a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem)
    .map((d: { id: string; nome: string; peso: number | null }) => ({
      id: d.id, nome: d.nome, peso: d.peso ?? 0,
    }))
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const rl = await checkRateLimit(auth.supabase, auth.userId, 'criar-edital', 5)
  if (rl) return rl

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({
      error: 'Não consegui receber o arquivo',
      hint: `O envio passou do limite da plataforma. O teto é ${MAX_FILE_BYTES / 1024 / 1024} MB.`,
    }, { status: 413 })
  }

  // Tudo que vem do formulário é do usuário: limitar aqui evita linha gigante
  // no banco e nome absurdo na interface.
  const nome = (formData.get('nome') as string ?? '').trim().slice(0, 200)
  const tipoRaw = (formData.get('tipo') as string | null)?.trim()
  const tipo: 'edital' | 'prova' | 'auto' =
    tipoRaw === 'prova' ? 'prova' : tipoRaw === 'edital' ? 'edital' : 'auto'
  const file = (formData.get('edital') as File | null) ?? (formData.get('arquivo') as File | null)

  // Com documento, nada é obrigatório: a IA tira o nome do próprio arquivo.
  // Sem documento não há de onde inferir, então aí sim o nome é exigido.
  const temArquivo = !!file && file.size > 0
  if (!nome && !temArquivo) {
    return NextResponse.json({
      error: 'Dê um nome ao concurso',
      hint: 'Ou envie o edital/prova e a IA preenche tudo sozinha.',
    }, { status: 400 })
  }

  // Sem arquivo: concurso vazio, para montar o plano na mão.
  if (!temArquivo) {
    const { data, error } = await auth.supabase
      .from('concursos')
      .insert({
        user_id: auth.userId, nome,
        cargo: limpar(formData.get('cargo')), banca: limpar(formData.get('banca')),
        ano: limpar(formData.get('ano')), fonte: 'manual',
      })
      .select('id').single()
    if (error || !data) {
      logger.error('criar-edital', 'insert-concurso-vazio', { err: error?.message })
      return NextResponse.json({ error: 'Erro ao criar concurso' }, { status: 500 })
    }
    return NextResponse.json({ id: data.id, gerou: false })
  }

  // ─── 1. Ler o documento ────────────────────────────────────────────────────
  let doc
  try {
    doc = await lerDocumento(file)
  } catch (err) {
    if (err instanceof ArquivoInvalidoError) {
      return NextResponse.json({ error: err.message, hint: err.dica }, { status: 400 })
    }
    const msg = err instanceof Error ? err.message : String(err)
    logger.error('criar-edital', 'ler-documento', { err: msg, fileSize: file.size, fileType: file.type })
    return NextResponse.json({
      error: 'Falha ao ler o arquivo',
      detail: msg,
      hint: 'Verifique se o PDF não está protegido por senha.',
    }, { status: 400 })
  }
  logger.info('criar-edital', 'documento-lido', { modo: doc.modo, mime: doc.mime, bytes: doc.bytes, chars: doc.chars })

  // ─── 2. Extrair a estrutura do plano ───────────────────────────────────────
  let plano: Plano
  try {
    const ehTexto = doc.modo === 'texto'
    plano = await callClaudeStructured<Plano>({
      schema: PLANO_SCHEMA,
      toolName: 'plano_de_estudos',
      toolDescription: 'Organiza um edital ou prova em disciplinas e tópicos.',
      system: SISTEMA_PLANO,
      // No modo texto o conteúdo vai delimitado por tag; no nativo o documento
      // já é uma parte separada da mensagem, o que por si só marca a fronteira.
      user: ehTexto
        ? `${PEDIDO_PLANO[tipo]}\n\n${wrapDocumento((doc.partes[0] as { text: string }).text)}`
        : PEDIDO_PLANO[tipo],
      files: ehTexto ? undefined : doc.partes,
      maxTokens: 8192,
      temperature: 0.2,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error('criar-edital', 'gemini', { err: msg })
    const semChave = /Missing required env: GEMINI_API_KEY/i.test(msg)
    const cota = /\b429\b|quota|RESOURCE_EXHAUSTED/i.test(msg)
    return NextResponse.json({
      error: 'Erro ao gerar plano com IA',
      detail: msg,
      hint: semChave
        ? 'A variável GEMINI_API_KEY não está configurada no ambiente (Vercel → Settings → Environment Variables).'
        : cota
          ? 'A cota da IA foi atingida. Tente de novo em alguns minutos.'
          : 'Verifique a chave da IA e tente novamente em alguns segundos.',
    }, { status: 502 })
  }

  if (plano.tipo_detectado === 'outro' || !plano.disciplinas?.length) {
    return NextResponse.json({
      error: 'Não encontrei um conteúdo programático neste arquivo',
      hint: plano.aviso?.slice(0, 300)
        ?? 'Envie o edital completo (com o anexo de conteúdo programático) ou uma prova com as questões.',
    }, { status: 422 })
  }

  // ─── 3. Persistir ──────────────────────────────────────────────────────────
  const { data: concurso, error: erroConcurso } = await auth.supabase
    .from('concursos')
    .insert({
      user_id: auth.userId,
      // O que o usuário digitou tem prioridade; a IA só preenche o que ficou em
      // branco. Sem nada digitado nem detectado, sobra o nome do arquivo — feio,
      // mas melhor que um concurso sem nome na lista.
      nome: nome || limpar(plano.titulo) || nomeDoArquivo(file),
      cargo: limpar(formData.get('cargo')) ?? limpar(plano.cargo),
      banca: limpar(formData.get('banca')) ?? limpar(plano.banca),
      ano:   limpar(formData.get('ano'))   ?? limpar(plano.ano),
      fonte: plano.tipo_detectado,
    })
    .select('id, nome, cargo, banca, ano').single()

  if (erroConcurso || !concurso) {
    logger.error('criar-edital', 'insert-concurso', { err: erroConcurso?.message })
    return NextResponse.json({ error: 'Erro ao criar concurso' }, { status: 500 })
  }

  let disciplinas: DisciplinaSalva[]
  try {
    disciplinas = await salvarPlano(auth.supabase, concurso.id, plano.disciplinas)
  } catch (err) {
    logger.error('criar-edital', 'insert-plan', { err: String(err) })
    // Sem o plano o concurso não serve para nada — desfaz para não deixar lixo.
    await auth.supabase.from('concursos').delete().eq('id', concurso.id)
    return NextResponse.json({ error: 'Erro ao salvar plano' }, { status: 500 })
  }

  return NextResponse.json({
    id: concurso.id,
    gerou: true,
    fonte: plano.tipo_detectado,
    // Devolvido para a tela poder mostrar o que foi detectado sozinho.
    detectado: { nome: concurso.nome, cargo: concurso.cargo, banca: concurso.banca, ano: concurso.ano },
    disciplinas,
    topicos: plano.disciplinas.reduce((n, d) => n + (d.topicos?.length ?? 0), 0),
    // Só prova tem questões transcritíveis na fase 2.
    podeImportarQuestoes: plano.tipo_detectado === 'prova',
  })
}
