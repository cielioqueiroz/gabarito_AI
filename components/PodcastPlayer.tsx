'use client'

import { useRef, useState, useEffect } from 'react'
import { Play, Pause, Loader2, Download, AlertCircle } from 'lucide-react'

const SPEEDS = [0.75, 1, 1.25, 1.5, 2]

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// Neural-voice narration (pt-BR) generated on demand by /api/podcast/[id] via
// Microsoft Edge TTS — free, no API key. The MP3 is browser-cached, so replays
// don't regenerate.
export function PodcastPlayer({ resumoId }: { resumoId: string }) {
  const ref = useRef<HTMLAudioElement>(null)
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [cur, setCur] = useState(0)
  const [dur, setDur] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [error, setError] = useState(false)

  const src = `/api/podcast/${resumoId}`

  useEffect(() => {
    if (ref.current) ref.current.playbackRate = speed
  }, [speed, started])

  async function toggle() {
    const a = ref.current
    if (!a) return
    if (!started) {
      setStarted(true)
      setLoading(true)
      setError(false)
      a.src = src
      try {
        await a.play()
      } catch {
        // Autoplay can reject mid-load; onplay/onerror handle the real state.
      }
      return
    }
    if (playing) a.pause()
    else a.play().catch(() => setError(true))
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const a = ref.current
    if (a && dur) { a.currentTime = Number(e.target.value); setCur(a.currentTime) }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-elevated/50 px-3 py-2">
      <audio
        ref={ref}
        preload="none"
        onCanPlay={() => setLoading(false)}
        onLoadedMetadata={e => { setDur(e.currentTarget.duration); e.currentTarget.playbackRate = speed }}
        onTimeUpdate={e => setCur(e.currentTarget.currentTime)}
        onPlay={() => { setPlaying(true); setLoading(false) }}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCur(0) }}
        onError={() => { setError(true); setLoading(false); setPlaying(false) }}
      />

      <button
        onClick={toggle}
        disabled={loading}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:opacity-70 cursor-pointer"
        title={error ? 'Tentar novamente' : playing ? 'Pausar' : 'Ouvir resumo'}
        aria-label={playing ? 'Pausar' : 'Ouvir'}
      >
        {loading ? <Loader2 size={16} className="animate-spin" />
          : error ? <AlertCircle size={16} />
          : playing ? <Pause size={16} />
          : <Play size={16} className="ml-0.5" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {error ? 'erro ao gerar áudio' : loading ? 'gerando narração…' : started ? 'podcast do resumo' : 'ouvir em voz neural'}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">{fmt(cur)} / {fmt(dur)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={dur || 0}
          step={0.1}
          value={cur}
          onChange={seek}
          disabled={!dur}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-border accent-blue-500 disabled:cursor-default"
          aria-label="Progresso"
        />
      </div>

      <button
        onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
        className="flex-shrink-0 rounded-md border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-blue-500/30 hover:text-blue-400 cursor-pointer"
        title="Velocidade"
      >
        {speed}×
      </button>

      {started && !error && (
        <a
          href={src}
          download="resumo.mp3"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-blue-500/30 hover:text-blue-400"
          title="Baixar MP3"
        >
          <Download size={14} />
        </a>
      )}
    </div>
  )
}
