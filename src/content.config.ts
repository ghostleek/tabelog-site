import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORY_SLUGS } from './lib/taxonomy';

// Mirrors the vault contract in tabelog-vault/_meta/SCHEMA.md — with one deliberate
// difference: `rating` here has NO do_not_recommend and `public` must be literal true.
// scripts/sync-vault.mjs filters those out; if one ever slips through, the build fails.
const restaurants = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/data/restaurants' }),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1),
      rating: z.enum(['highly_recommend', 'recommend']),
      categories: z.array(z.enum(CATEGORY_SLUGS)).default([]),
      address: z.string().optional(),
      postal_code: z.string().optional(),
      area: z.string().optional(),
      country: z.string().default('Singapore'),
      lat: z.number().optional(),
      lng: z.number().optional(),
      price_per_pax: z.number().optional(),
      is_hawker: z.boolean().default(false),
      public: z.literal(true),
      website: z.string().optional(),
      google_maps: z.string().optional(),
      dishes: z
        .array(
          z.object({
            name: z.string(),
            price: z.number().optional(),
            signature: z.boolean().optional(),
            description: z.string().optional(),
          })
        )
        .default([]),
      prior_visits: z.number().int().positive().optional(),
      visits: z
        .array(
          z.object({
            date: z.coerce.date(),
            spend: z.number().optional(),
            note: z.string().optional(),
          })
        )
        .default([]),
      photos: z.array(image()).default([]),
      cover: image().optional(),
      created: z.coerce.date().optional(),
      updated: z.coerce.date().optional(),
    }),
});

export const collections = { restaurants };
