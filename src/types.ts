export type GiMode = 'Gi' | 'No-Gi' | 'Both'
export type Belt = 'White' | 'Blue' | 'Purple' | 'Brown' | 'Black'
export type SessionType = 'Class + Sparring' | 'Open Mat' | 'Positional' | 'Drilling'

export interface Profile {
  id: string
  displayName: string
  belt: Belt
  stripes: number
  gym: string
  weeklySessionGoal: number
  focusPosition: string
  competitionDate: string
  competitionWeight: string
  onboardingCompleted: boolean
  createdAt: string
}

export interface Technique {
  id: string
  name: string
  category: 'Takedown' | 'Guard' | 'Pass' | 'Sweep' | 'Escape' | 'Submission' | 'Control' | 'Other'
  position: string
  giMode: GiMode
  notes: string
  videoUrl: string
  tags: string[]
  confidence: number
  drillingCount: number
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  trainedAt: string
  mode: Exclude<GiMode, 'Both'>
  sessionType: SessionType
  durationMin: number
  rounds: number
  positionalRounds: number
  submissions: number
  taps: number
  rating: number
  focusPosition: string
  notes: string
  techniqueIds: string[]
  partners: string[]
  createdAt: string
}

export interface FlowNodeData {
  label: string
  kind: 'position' | 'reaction' | 'technique' | 'submission'
  note?: string
  [key: string]: unknown
}

export interface FlowNode {
  id: string
  position: { x: number; y: number }
  data: FlowNodeData
  type?: string
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface Flow {
  id: string
  name: string
  description: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  createdAt: string
  updatedAt: string
}

export interface AppData {
  profile: Profile
  techniques: Technique[]
  sessions: Session[]
  flows: Flow[]
}
