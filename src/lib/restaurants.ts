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

export const mapsUrl = (r: Restaurant): string | undefined => {
  const { google_maps, address, lat, lng, name } = r.data;
  if (google_maps !== undefined) return google_maps;
  // Some imported notes stored a Google Maps link in the address field.
  if (address?.startsWith('https://www.google.com/maps/')) return address;
  const query = address ? `${name} ${address}` : lat !== undefined && lng !== undefined ? `${lat},${lng}` : undefined;
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : undefined;
};
