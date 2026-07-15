export const CATEGORY_SLUGS = ['mains', 'desserts', 'coffee', 'cakes', 'alcohol'] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const CATEGORIES: Record<CategorySlug, { label: string; emoji: string }> = {
  mains: { label: 'Mains', emoji: '🍜' },
  desserts: { label: 'Desserts', emoji: '🍦' },
  coffee: { label: 'Coffee', emoji: '☕' },
  cakes: { label: 'Cakes', emoji: '🍰' },
  alcohol: { label: 'Alcohol', emoji: '🍸' },
};

export const RATING_DISPLAY = {
  highly_recommend: { label: 'Highly Recommend', emoji: '⭐' },
  recommend: { label: 'Recommend', emoji: '👍' },
} as const;
