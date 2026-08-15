// localStorage-backed personal saved list (no accounts — per-device).
const KEY = 'tabelog-saved';

export const getSaved = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
};

export const isSaved = (slug: string): boolean => getSaved().includes(slug);

/** Returns the new state: true = now saved. */
export const toggleSaved = (slug: string): boolean => {
  const s = getSaved();
  const i = s.indexOf(slug);
  if (i >= 0) s.splice(i, 1);
  else s.push(slug);
  localStorage.setItem(KEY, JSON.stringify(s));
  return i < 0;
};
