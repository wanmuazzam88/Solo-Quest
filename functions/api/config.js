/**
 * Cloudflare Pages Function: /api/config
 * Retrieves Supabase credentials from Cloudflare Pages Environment Variables.
 * This completely eliminates the need for users to manually enter Supabase URLs
 * or Anon keys inside the client app.
 */
export async function onRequestGet(context) {
  const { env, request } = context;

  const rawUrl = env.SUPABASE_URL || '';
  const rawKey = env.SUPABASE_ANON_KEY || '';

  // Clean URL if needed
  let cleanUrl = (rawUrl || '').trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  let cleanKey = (rawKey || '').trim().replace(/^['"]|['"]$/g, '');

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
