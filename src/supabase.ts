import { createClient } from '@supabase/supabase-js'

const fallbackUrl = 'https://stprrkvkenbasxlblacy.supabase.co'
const fallbackKey = 'sb_publishable_t8S2XhUpXjvWMIv3iqo49A_9uQWtTHq'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || fallbackUrl
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || fallbackKey

export const cloudEnabled = Boolean(url && key)
// Resolve the app directory, keeping the GitHub Pages subpath but excluding
// index.html, query parameters and auth fragments from confirmation redirects.
export const getAuthRedirectUrl = () => new URL(import.meta.env.BASE_URL, window.location.href).href

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
