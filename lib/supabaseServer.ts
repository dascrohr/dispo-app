
import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client using the Service Role Key.
 * IMPORTANT: This file is only imported by server code (API routes, server components).
 */
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Supabase env missing');
  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  });
}
