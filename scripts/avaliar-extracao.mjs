// Avalia a extração de documentos contra uma prova ou edital REAL, usando os
// mesmos prompts e schemas que as rotas usam em produção (lib/extracao.ts).
//
// Não sobe servidor nem toca no banco: exercita só a parte que decide a
// qualidade do resultado, que é a que costuma regredir sem ninguém perceber.
//
//   node --experimental-strip-types scripts/avaliar-extracao.mjs <arquivo> [--questoes]
//
// Precisa de GEMINI_API_KEY no ambiente (ou em .env.local).

import { readFile } from 'node:fs/promises'
import { extractText, getDocumentProxy } from 'unpdf'
import {
  PLANO_SCHEMA, SISTEMA_PLANO, PEDIDO_PLANO,
  QUESTOES_SCHEMA, SISTEMA_QUESTOES, pedidoQuestoes,
} from '../lib/extracao.ts'

const MIN_CHARS_POR_PAGINA = 200 // precisa acompanhar lib/documentos.ts
const MODELOS = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-2.5-flash'] // igual a lib/anthropic.ts

const arquivo = process.argv[2]
const comQuestoes = process.argv.includes('--questoes')
if (!arquivo) {
  console.error('uso: node --experimental-strip-types scripts/avaliar-extracao.mjs <arquivo> [--questoes]')
  process.exit(1)
}

// .env.local sem dependência externa
let key = process.env.GEMINI_API_KEY
if (!key) {
  try {
    const env = await readFile(new URL('../.env.local', import.meta.url), 'utf8')
    key = env.match(/^GEMINI_API_KEY=(.*)$/m)?.[1]?.trim()
  } catch { /* sem .env.local */ }
}
if (!key) { console.error('GEMINI_API_KEY ausente'); process.exit(1) }

function toGeminiSchema(s) {
  if (!s || typeof s !== 'object') return s
  const out = {}
  if (s.type) out.type = String(s.type).toUpperCase()
  if (s.description) out.description = s.description
  if (s.enum) out.enum = s.enum
  if (s.required) out.required = s.required
  if (s.items) out.items = toGeminiSchema(s.items)
  if (s.properties) {
    out.properties = Object.fromEntries(Object.entries(s.properties).map(([k, v]) => [k, toGeminiSchema(v)]))
    out.propertyOrdering = Object.keys(s.properties)
  }
  return out
}

/** Espelha lib/documentos.ts: PDF com camada de texto vai como texto; sem, vai nativo. */
async function lerDocumento(caminho) {
  const buf = await readFile(caminho)
  const bytes = new Uint8Array(buf)
  if (bytes[0] === 0x25 && bytes[1] === 0x50) { // %PDF
    const pdf = await getDocumentProxy(new Uint8Array(bytes))
    const { text, totalPages } = await extractText(pdf, { mergePages: true })
    const texto = ((Array.isArray(text) ? text.join('\n') : text) ?? '').trim()
    const densidade = texto.length / (totalPages || 1)
    if (densidade >= MIN_CHARS_POR_PAGINA) {
      return { modo: 'texto', paginas: totalPages, chars: texto.length, densidade, partes: [{ text: texto }] }
    }
    return {
      modo: 'nativo', paginas: totalPages, chars: texto.length, densidade,
      partes: [{ inlineData: { mimeType: 'application/pdf', data: buf.toString('base64') } }],
    }
  }
  const mime = bytes[0] === 0xff ? 'image/jpeg' : bytes[0] === 0x89 ? 'image/png' : null
  if (mime) return { modo: 'nativo', partes: [{ inlineData: { mimeType: mime, data: buf.toString('base64') } }] }
  return { modo: 'texto', partes: [{ text: buf.toString('utf8') }] }
}

async function chamar({ schema, system, user, files, maxTokens }) {
  const t0 = Date.now()
  const corpo = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [...(files ?? []), { text: user }] }],
    generationConfig: {
      maxOutputTokens: maxTokens, temperature: 0.2,
      responseMimeType: 'application/json', responseSchema: toGeminiSchema(schema),
    },
  })

  // Mesma estratégia de lib/anthropic.ts: 503 quer dizer modelo saturado, então
  // vale mais trocar de modelo do que esperar no mesmo.
  let r, usado, ultimo
  for (const modelo of MODELOS) {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: corpo,
    })
    if (r.ok) { usado = modelo; break }
    ultimo = `${r.status}: ${(await r.text()).slice(0, 200)}`
    if (r.status >= 400 && r.status < 500 && r.status !== 429) break
    console.log(`   … ${modelo} devolveu ${r.status}, tentando o próximo`)
  }
  if (!usado) throw new Error(`Gemini ${ultimo}`)
  const j = await r.json()
  j.__modelo = usado
  const c = j.candidates?.[0]
  if (c?.finishReason === 'MAX_TOKENS') throw new Error('resposta truncada em MAX_TOKENS')
  return {
    dados: JSON.parse(c.content.parts.map(p => p.text ?? '').join('')),
    segundos: (Date.now() - t0) / 1000,
    tokens: j.usageMetadata,
    modelo: j.__modelo,
  }
}

// ─── Fase 1 ───────────────────────────────────────────────────────────────────
const doc = await lerDocumento(arquivo)
console.log(`\n📄 ${arquivo}`)
console.log(`   modo=${doc.modo}${doc.paginas ? ` páginas=${doc.paginas} chars=${doc.chars} densidade=${Math.round(doc.densidade)}/pág` : ''}`)

const ehTexto = doc.modo === 'texto'
const fase1 = await chamar({
  schema: PLANO_SCHEMA,
  system: SISTEMA_PLANO,
  user: ehTexto ? `${PEDIDO_PLANO.auto}\n\n<documento>\n${doc.partes[0].text}\n</documento>` : PEDIDO_PLANO.auto,
  files: ehTexto ? undefined : doc.partes,
  maxTokens: 8192,
})

const plano = fase1.dados
console.log(`\n── FASE 1 · plano ── ${fase1.segundos.toFixed(1)}s · ${fase1.tokens.totalTokenCount} tokens · ${fase1.modelo}`)
console.log(`   detectado: ${plano.tipo_detectado} | banca: ${plano.banca || '—'} | cargo: ${plano.cargo || '—'} | ano: ${plano.ano || '—'}`)
console.log(`   ${plano.disciplinas.length} disciplinas, ${plano.disciplinas.reduce((n, d) => n + d.topicos.length, 0)} tópicos`)
for (const d of plano.disciplinas) {
  console.log(`     • ${d.nome} — ${d.topicos.length} tópicos${d.peso ? `, peso ${d.peso}` : ''}`)
}

if (fase1.segundos > 50) console.warn(`   ⚠ ${fase1.segundos.toFixed(0)}s — perto do teto de 60s da Vercel`)

// ─── Fase 2 ───────────────────────────────────────────────────────────────────
if (comQuestoes && plano.tipo_detectado === 'prova') {
  // Mesmo loteamento de components/NovoConcursoForm.tsx: por nº de questões.
  const QUESTOES_POR_LOTE = 10, MAX_DISC = 4, PESO_PADRAO = 8
  const lotes = []
  let atual = [], acc = 0
  for (const d of plano.disciplinas) {
    const peso = d.peso > 0 ? d.peso : PESO_PADRAO
    if (atual.length && (acc + peso > QUESTOES_POR_LOTE || atual.length >= MAX_DISC)) {
      lotes.push(atual); atual = []; acc = 0
    }
    atual.push(d); acc += peso
  }
  if (atual.length) lotes.push(atual)
  console.log(`\n   loteamento: ${lotes.length} lotes — ${lotes.map(l => l.reduce((n, d) => n + (d.peso || PESO_PADRAO), 0)).join(', ')} questões`)

  const lote = lotes[0].map(d => d.nome)
  const pedido = pedidoQuestoes(lote)
  const fase2 = await chamar({
    schema: QUESTOES_SCHEMA,
    system: SISTEMA_QUESTOES,
    user: ehTexto ? `${pedido}\n\n<documento>\n${doc.partes[0].text}\n</documento>` : pedido,
    files: ehTexto ? undefined : doc.partes,
    maxTokens: 32768,
  })
  const qs = fase2.dados.questoes ?? []
  console.log(`\n── FASE 2 · questões (lote de ${lote.length}) ── ${fase2.segundos.toFixed(1)}s · ${fase2.tokens.totalTokenCount} tokens · ${fase2.modelo}`)
  console.log(`   ${qs.length} questões transcritas`)

  // As mesmas validações que a rota aplica antes de gravar.
  const LETRAS = new Set(['A', 'B', 'C', 'D', 'E'])
  const nomes = new Set(lote.map(n => n.toLowerCase()))
  const ruins = qs.filter(q =>
    !nomes.has((q.disciplina ?? '').toLowerCase()) ||
    !q.enunciado?.trim() ||
    !Array.isArray(q.alternativas) || q.alternativas.length < 2 ||
    !LETRAS.has((q.correta ?? '').toUpperCase()) ||
    !q.alternativas.some(a => (a.letra ?? '').toUpperCase() === (q.correta ?? '').toUpperCase())
  )
  console.log(`   ${qs.length - ruins.length} passam na validação da rota, ${ruins.length} seriam descartadas`)
  const numeros = qs.map(q => q.numero).filter(n => n != null).sort((a, b) => a - b)
  console.log(`   numeração: ${numeros[0]}–${numeros.at(-1)}`)

  const amostra = qs[0]
  if (amostra) {
    console.log(`\n   exemplo (questão ${amostra.numero}, ${amostra.disciplina}):`)
    console.log(`     ${amostra.enunciado.slice(0, 160)}…`)
    console.log(`     ${amostra.alternativas.length} alternativas · correta ${amostra.correta} · ${amostra.dificuldade ?? '—'}`)
    if (amostra.explicacao) console.log(`     porquê: ${amostra.explicacao.slice(0, 140)}…`)
  }
  if (fase2.segundos > 50) console.warn(`   ⚠ ${fase2.segundos.toFixed(0)}s — reduza DISCIPLINAS_POR_LOTE`)
}

console.log()
