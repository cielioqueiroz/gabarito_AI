type Level = 'info' | 'warn' | 'error'

function log(level: Level, scope: string, message: string, meta?: Record<string, unknown>) {
  const payload = { level, scope, message, ts: new Date().toISOString(), ...meta }
  const line = JSON.stringify(payload)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  info:  (scope: string, msg: string, meta?: Record<string, unknown>) => log('info', scope, msg, meta),
  warn:  (scope: string, msg: string, meta?: Record<string, unknown>) => log('warn', scope, msg, meta),
  error: (scope: string, msg: string, meta?: Record<string, unknown>) => log('error', scope, msg, meta),
}
