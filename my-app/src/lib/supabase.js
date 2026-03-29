import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[PawSwap] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and paste your Supabase Project URL and anon key (Settings → API).'
  )
}

/** Single Supabase client for the app — use for Auth, Database, Storage, etc. */
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')
