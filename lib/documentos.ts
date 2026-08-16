// Ingestão de documentos (editais e provas) para a camada de IA.
//
// Decisão de arquitetura (2026-08-14): o documento vai INTEIRO e NATIVO para o
// Gemini como `inlineData`, em vez de ser convertido em texto por pdf.js antes.
// Medido com uma prova real da FUNCAB/PRF (18 páginas, 4 MB, escaneada):
//
//   extração de texto (unpdf) + corte em 12k chars → 22% do documento,
//     parava na questão 06 de 60 e enxergava 1 disciplina de 9;
//   PDF nativo no Gemini → as 18 páginas, 9 disciplinas, 60 questões.
//
// O PDF escaneado é o caso comum em provas antigas: não tem camada de texto,
// então nenhum extrator resolve — só visão de documento (OCR do próprio modelo).
// A extração de texto continua existindo, mas só como caminho de degradação
// para quando o arquivo é grande demais para trafegar inteiro.

import type { GeminiPart } from './anthropic'
import { logger } from './logger'

export type { GeminiPart }

/** Teto de ingresso de uma Vercel Function é 4,5 MB — ficamos abaixo com folga. */
export const MAX_FILE_BYTES = 4 * 1024 * 1024

/**
 * Abaixo desta densidade de texto por página o PDF é tratado como escaneado.
 * Uma página de prova ou edital com camada de texto passa de 1.000 caracteres
 * (a prova da FUNCAB/PRF usada nos testes dá ~3.000); uma página que é só
 * imagem dá perto de zero, às vezes um punhado de lixo de cabeçalho.
 */
const MIN_CHARS_POR_PAGINA = 200

export type MimeAceito =
  | 'application/pdf'
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'text/plain'

export class ArquivoInvalidoError extends Error {
  constructor(message: string, readonly dica?: string) {
    super(message)
    this.name = 'ArquivoInvalidoError'
  }
}

// ─── Validação por conteúdo, não por extensão ────────────────────────────────
// O `file.type` vem do navegador e a extensão vem do nome: os dois são
// controlados por quem envia. A assinatura nos primeiros bytes, não.
const ASSINATURAS: { mime: MimeAceito; bytes: number[]; offset?: number }[] = [
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },              // %PDF
  { mime: 'image/png',       bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/jpeg',      bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/webp',      bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },   // "WEBP" após RIFF
]

function casa(bytes: Uint8Array, assinatura: number[], offset = 0): boolean {
  if (bytes.length < offset + assinatura.length) return false
  return assinatura.every((b, i) => bytes[offset + i] === b)
}

/** Detecta o tipo real pelo conteúdo. `null` quando não é um formato aceito. */
export function detectarMime(bytes: Uint8Array): MimeAceito | null {
  for (const a of ASSINATURAS) {
    if (casa(bytes, a.bytes, a.offset)) return a.mime
  }
  return null
}

/** Heurística de texto puro: sem bytes de controle e decodificável como UTF-8. */
function pareceTexto(bytes: Uint8Array): boolean {
  const amostra = bytes.subarray(0, 1024)
  for (const b of amostra) {
    if (b === 0) return false
    if (b < 0x09 || (b > 0x0d && b < 0x20)) return false
  }
  return true
}

export interface DocumentoLido {
  /** Partes prontas para o Gemini — nativas quando possível. */
  partes: GeminiPart[]
  mime: MimeAceito
  bytes: number
  /** `nativo` = visão de documento (lê escaneado); `texto` = degradação. */
  modo: 'nativo' | 'texto'
  /** Preenchido só no modo texto, para diagnóstico. */
  chars?: number
}

// ─── Extração de texto (caminho de degradação) ───────────────────────────────
// unpdf é um build do pdf.js seguro para serverless: não referencia DOMMatrix,
// que não existe no runtime da Vercel e quebrava o pdf-parse em PDFs com imagem.
async function extrairTextoPdf(bytes: Uint8Array): Promise<{ texto: string; paginas: number }> {
  const { extractText, getDocumentProxy } = await import('unpdf')
  // Cópia nova a cada chamada: reusar o buffer dá "detached ArrayBuffer".
  const pdf = await getDocumentProxy(new Uint8Array(bytes))
  const { text, totalPages } = await extractText(pdf, { mergePages: true })
  return {
    texto: (Array.isArray(text) ? text.join('\n') : text) ?? '',
    paginas: totalPages || 1,
  }
}

/**
 * Lê o arquivo enviado e devolve as partes para o modelo.
 * Lança `ArquivoInvalidoError` com mensagem exibível ao usuário.
 */
export async function lerDocumento(file: File): Promise<DocumentoLido> {
  if (file.size === 0) {
    throw new ArquivoInvalidoError('O arquivo está vazio.')
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ArquivoInvalidoError(
      `O arquivo tem ${(file.size / 1024 / 1024).toFixed(1)} MB e o limite é 4 MB.`,
      'PDFs escaneados costumam passar disso. Comprima o PDF ou envie só as páginas do conteúdo programático.',
    )
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const mime = detectarMime(bytes) ?? (pareceTexto(bytes) ? 'text/plain' : null)

  if (!mime) {
    throw new ArquivoInvalidoError(
      'Formato não reconhecido.',
      'Envie o edital ou a prova em PDF, imagem (JPG/PNG/WebP) ou TXT.',
    )
  }

  if (mime === 'text/plain') {
    const texto = new TextDecoder().decode(bytes).trim()
    if (!texto) throw new ArquivoInvalidoError('O arquivo de texto está vazio.')
    return { partes: [{ text: texto }], mime, bytes: file.size, modo: 'texto', chars: texto.length }
  }

  const nativo = (): DocumentoLido => ({
    partes: [{ inlineData: { mimeType: mime, data: Buffer.from(bytes).toString('base64') } }],
    mime,
    bytes: file.size,
    modo: 'nativo',
  })

  // Foto da prova: só existe o caminho visual.
  if (mime !== 'application/pdf') return nativo()

  // Num PDF a escolha não é por tamanho, é por ter ou não camada de texto:
  //
  //   com camada  → o texto extraído é fiel e sai muito mais barato (18 páginas
  //                 = 9,5k tokens de imagem contra ~1,5k de texto);
  //   sem camada  → extrair devolve vazio e só a visão do modelo lê o documento.
  //
  // Antes disso aqui existia um corte por tamanho, que mandava para o caminho
  // errado justamente a prova escaneada e pesada — o caso que mais precisa de OCR.
  let extraido: { texto: string; paginas: number } | null = null
  try {
    extraido = await extrairTextoPdf(bytes)
  } catch (err) {
    logger.warn('documentos', 'extracao-falhou-usando-nativo', { err: String(err) })
    return nativo()
  }

  const texto = extraido.texto.trim()
  const densidade = texto.length / extraido.paginas
  if (densidade < MIN_CHARS_POR_PAGINA) {
    logger.info('documentos', 'pdf-escaneado-modo-nativo', {
      paginas: extraido.paginas, chars: texto.length, densidade: Math.round(densidade),
    })
    return nativo()
  }

  return { partes: [{ text: texto }], mime, bytes: file.size, modo: 'texto', chars: texto.length }
}
