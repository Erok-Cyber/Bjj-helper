import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
const headers = {
  'Access-Control-Allow-Origin': 'https://erok-cyber.github.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status, headers});
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, {status:204,headers});
  if (req.method !== 'POST') return json({error:'Method not allowed'},405);
  try {
    const raw = await req.text();
    if (raw.length > 4096) return json({error:'Invalid request'},400);
    const body = JSON.parse(raw);
    const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    if (!/^[a-z0-9_]{3,32}$/.test(username) || typeof body.password !== 'string' || !body.password || body.password.length > 1024) {
      return json({error:'Invalid username or password'},401);
    }
    const url = Deno.env.get('SUPABASE_URL')!;
    const options = {auth:{persistSession:false,autoRefreshToken:false}};
    const server = createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,options);
    const {data:alias,error:aliasError} = await server.from('admin_login_aliases').select('user_id').eq('username',username).maybeSingle();
    if (aliasError) return json({error:'Sign-in is temporarily unavailable'},503);
    if (!alias) return json({error:'Invalid username or password'},401);
    const {data:{user},error:userError} = await server.auth.admin.getUserById(alias.user_id);
    if (userError || !user?.email || user.app_metadata?.grapplelog_admin !== true || user.app_metadata?.grapplelog_admin_only !== true) {
      return json({error:'Invalid username or password'},401);
    }
    // A separate, non-persistent client performs normal password authentication.
    // Supabase Auth verifies the password and applies its sign-in rate limits.
    const auth = createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,options);
    const {data,error} = await auth.auth.signInWithPassword({email:user.email,password:body.password});
    if (error || !data.session || data.user.id !== alias.user_id) {
      return json({error:error?.status === 429 ? 'Too many attempts. Try again later.' : 'Invalid username or password'},error?.status === 429 ? 429 : 401);
    }
    return json({session:{access_token:data.session.access_token,refresh_token:data.session.refresh_token}});
  } catch { return json({error:'Could not sign in'},400); }
});
