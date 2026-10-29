/**
 * Cloudflare Worker Entry Point: worker.js
 * Serves Solo Quest PWA, static assets, and handles edge API endpoints
 * (/api/config, /api/health) on Cloudflare Workers and Cloudflare Pages.
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // 2. /api/config endpoint - supplies Supabase credentials from Cloudflare env
    if (url.pathname === '/api/config') {
      const defaultUrl = 'https://ohojtsjuswbsspihrwus.supabase.co';
      const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ob2p0c2p1c3dic3NwaWhyd3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyODA0NzEsImV4cCI6MjEwODg1NjQ3MX0.HdoAT4plJ3fZ2eIdJV_WXDKdwf2xR7SxDyoT_n0n3Jo';

      const rawUrl = env.SUPABASE_URL || defaultUrl;
      const rawKey = env.SUPABASE_ANON_KEY || defaultKey;
      const cleanUrl = rawUrl.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '').replace(/\/(rest|auth)\/v1\/?$/i, '');
      const cleanKey = rawKey.trim().replace(/^['"]|['"]$/g, '').replace(/\s+/g, '');
      const isConfigured = Boolean(cleanUrl && cleanKey);

      return new Response(JSON.stringify({
        configured: isConfigured,
        provider: isConfigured ? 'supabase' : 'unconfigured',
        supabaseUrl: cleanUrl,
        supabaseAnonKey: cleanKey,
        managed: true,
        platform: 'Cloudflare Worker Edge',
        timestamp: Date.now()
      }), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      });
    }

    // 3. /api/health endpoint - ping diagnostic
    if (url.pathname === '/api/health') {
      const rawUrl = env.SUPABASE_URL || '';
      const rawKey = env.SUPABASE_ANON_KEY || '';
      return new Response(JSON.stringify({
        status: 'online',
        ok: true,
        configured: Boolean(rawUrl && rawKey),
        platform: 'Cloudflare Workers',
        timestamp: Date.now()
      }), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 4. Static Asset Serving (HTML, CSS, JS, Images, PWA manifest)
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    // 5. Fallback for static root
    return new Response('Solo Quest System Online. Please link Static Assets or Pages in Cloudflare dashboard.', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
};
