interface Bucket { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export function rateLimit(key: string, max = 10, windowMs = 60_000): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfter: 0 }
  }
  if (b.count >= max) return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) }
  b.count++
  return { ok: true, retryAfter: 0 }
}
