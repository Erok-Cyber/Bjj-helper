import type { AppData, Flow, Profile, Session, Technique } from './types'
import { cloudEnabled, supabase } from './supabase'

const STORAGE_KEY = 'bjj-helper:data:v1'
const PROFILE_KEY = 'bjj-helper:local-profile-id'

const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()

const sampleFlow = (): Flow => ({
  id: uid(),
  name: 'Starter gameplan',
  description: 'A neutral example. Replace every node with your own preferred positions and reactions.',
  createdAt: now(),
  updatedAt: now(),
  nodes: [
    { id: 'start', position: { x: 0, y: 80 }, data: { label: 'Standing', kind: 'position' } },
    { id: 'react', position: { x: 240, y: 0 }, data: { label: 'Opponent reaction', kind: 'reaction' } },
    { id: 'attack', position: { x: 500, y: 0 }, data: { label: 'Your best response', kind: 'technique' } },
    { id: 'top', position: { x: 500, y: 160 }, data: { label: 'Top position', kind: 'position' } },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'react', label: 'engage' },
    { id: 'e2', source: 'react', target: 'attack', label: 'read & react' },
    { id: 'e3', source: 'attack', target: 'top', label: 'finish on top' },
  ],
})

function seed(): AppData {
  const localId = localStorage.getItem(PROFILE_KEY) || uid()
  localStorage.setItem(PROFILE_KEY, localId)
  return {
    profile: { id: localId, displayName: 'Local athlete', belt: 'White', stripes: 0, gym: '', createdAt: now() },
    techniques: [],
    sessions: [],
    flows: [sampleFlow()],
  }
}

export function loadLocal(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const data = seed(); saveLocal(data); return data
  }
  try { return JSON.parse(raw) as AppData } catch { const data = seed(); saveLocal(data); return data }
}

export function saveLocal(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export async function loadCloud(userId: string): Promise<AppData> {
  if (!supabase) throw new Error('Cloud is not configured')
  const [profileRes, techniquesRes, sessionsRes, flowsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('techniques').select('*').order('updated_at', { ascending: false }),
    supabase.from('sessions').select('*').order('trained_at', { ascending: false }),
    supabase.from('flows').select('*').order('updated_at', { ascending: false }),
  ])
  const err = profileRes.error || techniquesRes.error || sessionsRes.error || flowsRes.error
  if (err) throw err
  const p = profileRes.data
  const profile: Profile = p ? {
    id: p.id, displayName: p.display_name || 'Athlete', belt: p.belt || 'White', stripes: p.stripes || 0,
    gym: p.gym || '', createdAt: p.created_at,
  } : { id: userId, displayName: 'Athlete', belt: 'White', stripes: 0, gym: '', createdAt: now() }
  const techniques: Technique[] = (techniquesRes.data || []).map((t) => ({
    id: t.id, name: t.name, category: t.category, position: t.position || '', giMode: t.gi_mode,
    notes: t.notes || '', videoUrl: t.video_url || '', tags: t.tags || [], confidence: t.confidence || 1,
    drillingCount: t.drilling_count || 0, createdAt: t.created_at, updatedAt: t.updated_at,
  }))
  const sessions: Session[] = (sessionsRes.data || []).map((s) => ({
    id: s.id, trainedAt: s.trained_at, mode: s.mode, durationMin: s.duration_min, rounds: s.rounds,
    submissions: s.submissions, taps: s.taps, rating: s.rating, notes: s.notes || '',
    techniqueIds: s.technique_ids || [], partners: s.partners || [], createdAt: s.created_at,
  }))
  const flows: Flow[] = (flowsRes.data || []).map((f) => ({
    id: f.id, name: f.name, description: f.description || '', nodes: f.nodes || [], edges: f.edges || [],
    createdAt: f.created_at, updatedAt: f.updated_at,
  }))
  return { profile, techniques, sessions, flows: flows.length ? flows : [sampleFlow()] }
}

export async function cloudUpsert(kind: 'profile' | 'technique' | 'session' | 'flow', value: Profile | Technique | Session | Flow) {
  if (!cloudEnabled || !supabase) return
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return
  if (kind === 'profile') {
    const p = value as Profile
    const { error } = await supabase.from('profiles').upsert({ id: userId, display_name: p.displayName, belt: p.belt, stripes: p.stripes, gym: p.gym })
    if (error) throw error
  }
  if (kind === 'technique') {
    const t = value as Technique
    const { error } = await supabase.from('techniques').upsert({ id: t.id, user_id: userId, name: t.name, category: t.category, position: t.position, gi_mode: t.giMode, notes: t.notes, video_url: t.videoUrl, tags: t.tags, confidence: t.confidence, drilling_count: t.drillingCount, updated_at: now() })
    if (error) throw error
  }
  if (kind === 'session') {
    const s = value as Session
    const { error } = await supabase.from('sessions').upsert({ id: s.id, user_id: userId, trained_at: s.trainedAt, mode: s.mode, duration_min: s.durationMin, rounds: s.rounds, submissions: s.submissions, taps: s.taps, rating: s.rating, notes: s.notes, technique_ids: s.techniqueIds, partners: s.partners })
    if (error) throw error
  }
  if (kind === 'flow') {
    const f = value as Flow
    const { error } = await supabase.from('flows').upsert({ id: f.id, user_id: userId, name: f.name, description: f.description, nodes: f.nodes, edges: f.edges, updated_at: now() })
    if (error) throw error
  }
}

export async function cloudDelete(kind: 'techniques' | 'sessions' | 'flows', id: string) {
  if (!cloudEnabled || !supabase) return
  const { error } = await supabase.from(kind).delete().eq('id', id)
  if (error) throw error
}
