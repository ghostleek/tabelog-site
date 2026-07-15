import { getCollection, type CollectionEntry } from 'astro:content';

export type Restaurant = CollectionEntry<'restaurants'>;

/** The only accessor pages should use. Re-asserts the privacy filters that
 *  sync-vault.mjs and the zod schema already enforce — defense in depth. */
export async function getPublicRestaurants(): Promise<Restaurant[]> {
  const all = await getCollection('restaurants');
  return all
    .filter((r) => r.data.public === true && (r.data.rating as string) !== 'do_not_recommend')
    .sort((a, b) => a.data.name.localeCompare(b.data.name));
}

export const totalVisits = (r: Restaurant): number =>
  (r.data.prior_visits ?? 0) + r.data.visits.length;

export const lastVisit = (r: Restaurant): Date | undefined =>
  r.data.visits.map((v) => v.date).sort((a, b) => a.getTime() - b.getTime()).at(-1);

export const slugifyArea = (area: string): string =>
  area.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const priceBand = (price?: number): string | undefined =>
  price === undefined || price === 0 ? undefined : price <= 15 ? '$' : price <= 40 ? '$$' : '$$$';

/** Google Maps deep link — stored URL or a name+address search (v2 behavior). */
export const mapsUrl = (r: Restaurant): string | undefined =>
  r.data.google_maps ??
  (r.data.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.data.name} ${r.data.address}`)}`
    : undefined);
