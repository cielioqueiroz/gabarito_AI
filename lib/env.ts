function required(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required env: ${key}`)
  return value
}

export const env = {
  SUPABASE_URL: () => required('NEXT_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: () => required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  GEMINI_API_KEY: () => required('GEMINI_API_KEY'),
}
