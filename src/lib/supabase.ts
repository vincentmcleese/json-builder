import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file and deployment configuration.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'json-creator',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Add a connection status check
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('system_prompts').select('count').limit(1)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Supabase connection error:', error)
    return false
  }
}