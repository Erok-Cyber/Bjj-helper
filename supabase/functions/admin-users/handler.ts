type User = {
  id: string; email?: string; created_at?: string; last_sign_in_at?: string;
  email_confirmed_at?: string; banned_until?: string;
  app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown>;
}
type Auth = {
  getUser: (token: string) => Promise<{ data: { user: User | null }; error: unknown }>;
  admin: { listUsers: (options: { page: number; perPage: number }) => Promise<{
    data: { users: User[]; total?: number; lastPage?: number }; error: unknown
  }> };
}
const headers = {
  'Access-Control-Allow-Origin': 'https://erok-cyber.github.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'Vary': 'Origin',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })
export async function handleAdminUsers(req: Request, auth: Auth): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const token = req.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1]
  if (!token) return json({ error: 'Sign in required' }, 401)
  try {
    // Always fetch the current server-side user. Never trust client-supplied roles
    // or user_metadata, and do not rely on potentially stale JWT role claims.
    const { data: { user }, error } = await auth.getUser(token)
    if (error || !user || (user.banned_until && Date.parse(user.banned_until) > Date.now())) {
      return json({ error: 'Sign in required' }, 401)
    }
    let body: { action?: string; page?: number }
    try { body = await req.json() } catch { return json({ error: 'Invalid request' }, 400) }
    if (!body || typeof body !== 'object') return json({ error: 'Invalid request' }, 400)
    const isAdmin = user.app_metadata?.grapplelog_admin === true
    if (body.action === 'access') return json({ isAdmin })
    if (!isAdmin) return json({ error: 'Administrator access required' }, 403)
    if (body.action !== 'list') return json({ error: 'Unknown action' }, 400)
    const page = body.page ?? 1
    if (!Number.isInteger(page) || page < 1 || page > 10000) return json({ error: 'Invalid page' }, 400)
    const perPage = 50
    const { data, error: listError } = await auth.admin.listUsers({ page, perPage })
    if (listError) return json({ error: 'Could not load users' }, 502)
    return json({
      users: data.users.map(u => ({
        id: u.id, email: u.email ?? '', createdAt: u.created_at ?? null,
        lastSignInAt: u.last_sign_in_at ?? null, confirmed: Boolean(u.email_confirmed_at),
        banned: Boolean(u.banned_until && Date.parse(u.banned_until) > Date.now()),
        isAdmin: u.app_metadata?.grapplelog_admin === true,
      })),
      page, total: data.total ?? null,
      hasMore: data.lastPage ? page < data.lastPage : data.users.length === perPage,
    })
  } catch { return json({ error: 'Could not load administration' }, 500) }
}
