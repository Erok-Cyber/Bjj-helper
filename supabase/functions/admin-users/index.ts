import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { handleAdminUsers } from './handler.ts';

// This key is supplied by the Edge runtime and must never enter the browser.
const server = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
// JWTs are verified by Auth.getUser inside the handler on every request.
Deno.serve(req => handleAdminUsers(req, server.auth));
