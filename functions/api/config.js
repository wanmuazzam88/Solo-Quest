/**
 * Cloudflare Pages Function: /api/config
 * Retrieves Supabase credentials from Cloudflare Pages Environment Variables.
 * This completely eliminates the need for users to manually enter Supabase URLs
 * or Anon keys inside the client app.
 */
export async function onRequestGet(context) {
  const { env, request } = context;

  const defaultUrl = 'https://ohojtsjuswbsspihrwus.supabase.co';
  const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ob2p0c2p1c3dic3NwaWhyd3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyODA0NzEsImV4cCI6MjEwODg1NjQ3MX0.HdoAT4plJ3fZ2eIdJV_WXDKdwf2xR7SxDyoT_n0n3Jo';

  const rawUrl = env.SUPABASE_URL || defaultUrl;
  const rawKey = env.SUPABASE_ANON_KEY || defaultKey;

  // Clean URL if needed
  let cleanUrl = (rawUrl || '').trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '').replace(/\/(rest|auth)\/v1\/?$/i, '');
  let cleanKey = (rawKey || '').trim().replace(/^['"]|['"]$/g, '').replace(/\s+/g, '');

  const isConfigured = Boolean(cleanUrl && cleanKey);

  const payload = {
    configured: isConfigured,
    provider: isConfigured ? 'supabase' : 'unconfigured',
    supabaseUrl: cleanUrl,
    supabaseAnonKey: cleanKey,
    managed: true,
    platform: 'Cloudflare Pages Edge',
    timestamp: Date.now()
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
      'Access-Control-Max-Age': '86400'
    }
  });
}
