type User = {
  id: string; email?: string; created_at?: string; last_sign_in_at?: string;
  email_confirmed_at?: string; banned_until?: string;
  app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown>;
}
type Auth = {
  getUser: (token: string) => Promise<{ data: { user: User | null }; error: unknown }>;
  resetPasswordForEmail: (email: string, options: { redirectTo: string }) => Promise<{ error: unknown }>;
  admin: { listUsers: (options: { page: number; perPage: number }) => Promise<{
    data: { users: User[]; total?: number; lastPage?: number }; error: unknown
  }>;
  getUserById: (id: string) => Promise<{ data: { user: User | null }; error: unknown }>;
  updateUserById: (id: string, attributes: { password?: string; ban_duration?: string }) => Promise<{ data: { user: User | null }; error: unknown }>;
  };
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
const visibleUser = (u: User) => ({
  id: u.id, email: u.email ?? '', createdAt: u.created_at ?? null,
  lastSignInAt: u.last_sign_in_at ?? null, confirmed: Boolean(u.email_confirmed_at),
  banned: Boolean(u.banned_until && Date.parse(u.banned_until) > Date.now()),
  isAdmin: u.app_metadata?.grapplelog_admin === true || u.app_metadata?.grapplelog_admin_only === true,
})
const failure = (error: unknown) => {
  const e = error as {status?: number; code?: string} | null
  if(e?.status === 429) return json({error:'Too many requests. Please wait and try again.'},429)
  if(e?.code === 'weak_password') return json({error:'Choose a stronger password.'},400)
  if(e?.code === 'same_password') return json({error:'Choose a password different from the current one.'},400)
  if(e?.code === 'over_email_send_rate_limit') return json({error:'Please wait before sending another reset email.'},429)
  return json({error:'The change could not be completed. Please try again.'},502)
}
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
    let body: { action?: string; page?: number; userId?: string; password?: string; confirmed?: boolean }
    try {
      const raw = await req.text()
      if(raw.length > 4096) return json({error:'Invalid request'},400)
      body = JSON.parse(raw)
    } catch { return json({ error: 'Invalid request' }, 400) }
    if (!body || typeof body !== 'object') return json({ error: 'Invalid request' }, 400)
    const isAdmin = user.app_metadata?.grapplelog_admin === true
    if (body.action === 'access') return json({ isAdmin })
    if (!isAdmin) return json({ error: 'Administrator access required' }, 403)
    if (body.action !== 'list') {
      if(!['send_reset','set_password','block','unblock'].includes(body.action ?? '')) return json({error:'Unknown action'},400)
      if(body.confirmed !== true) return json({error:'Confirm the change before continuing.'},400)
      if(typeof body.userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.userId)) return json({error:'Invalid user'},400)
      if(body.userId.toLowerCase() === user.id.toLowerCase()) return json({error:'Use Account security to change your own password.'},403)
      const {data:{user:target},error:targetError} = await auth.admin.getUserById(body.userId)
      if(targetError) return (targetError as {status?:number}).status === 404 ? json({error:'User not found'},404) : failure(targetError)
      if(!target) return json({error:'User not found'},404)
      // Keep administrator accounts outside routine account management.
      if(target.app_metadata?.grapplelog_admin === true || target.app_metadata?.grapplelog_admin_only === true) return json({error:'Administrator accounts are protected.'},403)
      if(body.action === 'send_reset') {
        if(!target.email) return json({error:'This account has no email address.'},400)
        if(visibleUser(target).banned) return json({error:'Unblock the account before sending a reset email.'},409)
        const {error:resetError} = await auth.resetPasswordForEmail(target.email,{redirectTo:'https://erok-cyber.github.io/Bjj-helper/'})
        return resetError ? failure(resetError) : json({success:true})
      }
      let attributes: {password?:string;ban_duration?:string}
      if(body.action === 'set_password') {
        if(typeof body.password !== 'string' || body.password.length < 8 || new TextEncoder().encode(body.password).length > 72) return json({error:'Use 8–72 characters (at most 72 bytes) for the password.'},400)
        attributes = {password:body.password}
      } else {
        attributes = {ban_duration:body.action === 'block' ? '876000h' : 'none'}
      }
      // Only allowlisted fields are forwarded. Never return passwords or raw metadata.
      const {data:{user:updated},error:updateError} = await auth.admin.updateUserById(target.id,attributes)
      if(updateError) return failure(updateError)
      if(!updated) return json({error:'The change could not be confirmed. Refresh the account list.'},502)
      return json({success:true,user:visibleUser(updated)})
    }
    const page = body.page ?? 1
    if (!Number.isInteger(page) || page < 1 || page > 10000) return json({ error: 'Invalid page' }, 400)
    const perPage = 50
    const { data, error: listError } = await auth.admin.listUsers({ page, perPage })
    if (listError) return json({ error: 'Could not load users' }, 502)
    return json({
      users: data.users.map(visibleUser),
      page, total: data.total ?? null,
      hasMore: data.lastPage ? page < data.lastPage : data.users.length === perPage,
    })
  } catch { return json({ error: 'Could not load administration' }, 500) }
}
