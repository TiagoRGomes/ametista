import { createClient } from '@supabase/supabase-js'

const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

function isUsableSupabaseUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

const hasPlaceholder = (value) => /SEU-PROJETO|SUA_CHAVE|COLE_SUA_CHAVE|PLACEHOLDER/i.test(value)

export const isSupabaseConfigured = Boolean(
  url && anonKey && isUsableSupabaseUrl(url) && !hasPlaceholder(url) && !hasPlaceholder(anonKey),
)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
