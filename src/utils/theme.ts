export type ThemeMode = 'slate' | 'emerald';

export const THEME_STORAGE_KEY = 'crickazz_theme';

export function getStoredTheme(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'slate';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'emerald' || saved === 'slate') {
      return saved;
    }
  } catch (e) {
    console.warn('Could not read stored theme from localStorage:', e);
  }
  return 'slate';
}

export function applyTheme(theme: ThemeMode): void {
  try {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    // Dispatch a custom event so other components or tabs can synchronize if in browser
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }
  } catch (e) {
    console.warn('Could not persist theme to localStorage:', e);
  }
}
