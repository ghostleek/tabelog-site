/**
 * GET /api/postal?code=069184 → { lat, lng } | 404
 * OneMap proxy (avoids browser CORS uncertainty). Cached 7 days.
 */
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const code = (url.searchParams.get('code') ?? '').trim();
  if (!/^\d{6}$/.test(code)) return new Response('need a 6-digit postal code', { status: 400 });

  const cache = caches.default;
  const cacheKey = new Request(new URL(`/api/postal?code=${code}`, url.origin));
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const om = await fetch(
    `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${code}&returnGeom=Y&getAddrDetails=N`
  );
  const data = await om.json();
  const first = data?.results?.[0];
  if (!first) return new Response('postal code not found', { status: 404 });

  const res = Response.json(
    { lat: parseFloat(first.LATITUDE), lng: parseFloat(first.LONGITUDE) },
    { headers: { 'Cache-Control': 'public, max-age=604800' } }
  );
  await cache.put(cacheKey, res.clone());
  return res;
}
