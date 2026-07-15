import type { APIRoute } from 'astro';
import { getPublicRestaurants } from '../../lib/restaurants';

// Static artifact consumed by the map island and proximity search.
export const GET: APIRoute = async () => {
  const restaurants = await getPublicRestaurants();
  const items = restaurants
    .filter((r) => r.data.lat !== undefined && r.data.lng !== undefined)
    .map((r) => ({
      slug: r.id,
      name: r.data.name,
      lat: r.data.lat,
      lng: r.data.lng,
      rating: r.data.rating,
      categories: r.data.categories,
      area: r.data.area ?? null,
      price: r.data.price_per_pax ?? null,
      hawker: r.data.is_hawker,
      country: r.data.country,
    }));
  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json' },
  });
};
