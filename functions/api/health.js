/**
 * Cloudflare Pages Function: /api/health
 * Tests edge connectivity directly between Cloudflare Edge and Supabase.
 */
export async function onRequestGet(context) {
  const { env, request } = context;

  const rawUrl = env.SUPABASE_URL || '';
  const rawKey = env.SUPABASE_ANON_KEY || '';

  const cleanUrl = (rawUrl || '').trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  const cleanKey = (rawKey || '').trim().replace(/^['"]|['"]$/g, '');

  if (!cleanUrl || !cleanKey) {
    return new Response(JSON.stringify({
      status: 'unconfigured',
      ok: false,
      message: 'SUPABASE_URL and SUPABASE_ANON_KEY are not configured in Cloudflare Pages Environment Variables.',
      platform: 'Cloudflare Pages'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const t0 = Date.now();
  try {
    const pingRes = await fetch(`${cleanUrl}/auth/v1/health`, {
      method: 'GET',
      headers: {
        'apikey': cleanKey,
        'Authorization': `Bearer ${cleanKey}`
      }
    });

    const latencyMs = Math.max(1, Date.now() - t0);
    const colo = request.cf ? request.cf.colo : 'EDGE';
    const country = request.cf ? request.cf.country : 'GLOBAL';

    return new Response(JSON.stringify({
      status: pingRes.ok || pingRes.status === 200 ? 'online' : 'error',
      ok: pingRes.ok || pingRes.status === 200,
      httpStatus: pingRes.status,
      latencyMs: latencyMs,
      datacenter: colo,
      country: country,
      platform: 'Cloudflare Pages Functions'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      status: 'unreachable',
      ok: false,
      error: err.message,
      latencyMs: Date.now() - t0
    }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
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
