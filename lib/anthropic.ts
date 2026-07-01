import Anthropic from '@anthropic-ai/sdk'
import { env } from './env'
import { logger } from './logger'

export const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929'
export const MAX_EDITAL_CHARS = 12000

let _client: Anthropic | null = null
export function anthropicClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY() })
  return _client
}

interface ToolUseInput<T> { schema: Record<string, unknown>; toolName: string; toolDescription: string; maxTokens?: number; system: string; user: string }

async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < tries; i++) {
    try { return await fn() }
    catch (err) {
      lastErr = err
      const wait = 500 * Math.pow(2, i)
      logger.warn('anthropic', 'retry', { attempt: i + 1, waitMs: wait })
      await new Promise(r => setTimeout(r, wait))
    }
  }
  throw lastErr
}

export async function callClaudeStructured<T>({ schema, toolName, toolDescription, maxTokens = 4096, system, user }: ToolUseInput<T>): Promise<T> {
  const client = anthropicClient()
  const res = await withRetry(() => client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system,
    tools: [{ name: toolName, description: toolDescription, input_schema: schema as Anthropic.Tool.InputSchema }],
    tool_choice: { type: 'tool', name: toolName },
    messages: [{ role: 'user', content: user }],
  }))

  const block = res.content.find(b => b.type === 'tool_use') as Anthropic.ToolUseBlock | undefined
  if (!block) throw new Error('Claude did not return a tool_use block')
  return block.input as T
}
