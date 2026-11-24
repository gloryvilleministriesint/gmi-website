// Cloudflare Pages Function: GET /api/youtube
// Reads the latest uploads from the GMI YouTube channel's public feed and returns them as JSON.
// Cached at Cloudflare's edge for 10 minutes, so a new upload appears on the website within minutes.
import { FEED_URL, parseFeed } from '../../src/lib/youtube';

export const onRequestGet = async (ctx: { request: Request; waitUntil: (p: Promise<unknown>) => void }) => {
  const cache = (caches as unknown as { default: Cache }).default;
  const key = new Request(new URL('/api/youtube', ctx.request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  try {
    const res = await fetch(FEED_URL, { headers: { 'user-agent': 'GMI website' }, cf: { cacheTtl: 300 } } as RequestInit);
    if (!res.ok) throw new Error(`YouTube feed returned ${res.status}`);
    const videos = parseFeed(await res.text());
    if (!videos.length) throw new Error('Empty feed');
    const out = new Response(JSON.stringify({ updated: new Date().toISOString(), videos }), {
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=600' },
    });
    ctx.waitUntil(cache.put(key, out.clone()));
    return out;
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 502, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }
};
