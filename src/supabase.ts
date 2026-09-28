import { createClient } from '@supabase/supabase-js'

const fallbackUrl = 'https://stprrkvkenbasxlblacy.supabase.co'
const fallbackKey = 'sb_publishable_t8S2XhUpXjvWMIv3iqo49A_9uQWtTHq'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || fallbackUrl
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || fallbackKey

export const cloudEnabled = Boolean(url && key)
export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
