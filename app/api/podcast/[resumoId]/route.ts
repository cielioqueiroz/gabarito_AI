import { NextRequest, NextResponse } from 'next/server'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'
import { requireAuth, checkRateLimit } from '@/lib/apiHelpers'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const maxDuration = 60

// Turn the Markdown resumo into clean narration text.
function toNarration(md: string): string {
  return md
    .replace(/^#{1,6}\s*/gm, '')       // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/`([^`]+)`/g, '$1')       // inline code
    .replace(/^[-*]\s*/gm, '')         // bullets
    .replace(/\n{2,}/g, '. ')          // paragraph breaks → pause
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000)
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ resumoId: string }> }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const rl = checkRateLimit(auth.userId, 'podcast', 20)
  if (rl) return rl

  const { resumoId } = await params

  // RLS on `resumos` guarantees the user only reads their own rows.
  const { data: resumo } = await auth.supabase
    .from('resumos').select('conteudo').eq('id', resumoId).single()
  if (!resumo) return NextResponse.json({ error: 'Resumo não encontrado' }, { status: 404 })

  const text = toNarration(resumo.conteudo)
  if (!text) return NextResponse.json({ error: 'Resumo vazio' }, { status: 400 })

  try {
    const tts = new MsEdgeTTS()
    await tts.setMetadata('pt-BR-AntonioNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
    const { audioStream } = tts.toStream(text)

    const buf: Buffer = await new Promise((resolve, reject) => {
      const acc: Buffer[] = []
      audioStream.on('data', (c: Buffer) => acc.push(c))
      audioStream.on('end', () => resolve(Buffer.concat(acc)))
      audioStream.on('error', reject)
      setTimeout(() => reject(new Error('TTS timeout')), 45000)
    })
    if (!buf.length) throw new Error('empty audio')

    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(buf.length),
        // resumos are immutable, so the browser can safely cache the audio
        'Cache-Control': 'private, max-age=86400',
        'Content-Disposition': 'inline; filename="resumo.mp3"',
      },
    })
  } catch (err) {
    logger.error('podcast', 'tts', { resumoId, err: String(err) })
    return NextResponse.json({ error: 'Erro ao gerar áudio' }, { status: 502 })
  }
}
