/**
 * GET /api/embed?q=<query> → { model, dims, embedding: number[384] }
 * Query-time embedding for hybrid search — same bge model as build time,
 * so vectors are directly comparable. Cached 24h per normalized query.
 */
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 200);
  if (!q) return new Response('missing q', { status: 400 });

  const cache = caches.default;
  const cacheKey = new Request(new URL(`/api/embed?q=${encodeURIComponent(q.toLowerCase())}`, url.origin));
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const out = await env.AI.run('@cf/baai/bge-small-en-v1.5', { text: [q] });
  const res = Response.json(
    { model: '@cf/baai/bge-small-en-v1.5', dims: 384, embedding: out.data[0] },
    { headers: { 'Cache-Control': 'public, max-age=86400' } }
  );
  await cache.put(cacheKey, res.clone());
  return res;
}
