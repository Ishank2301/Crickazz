import { TestResult } from './sqlite-wasm.test';
import { getStoredTheme, applyTheme, THEME_STORAGE_KEY } from '../src/utils/theme';

export async function runThemeTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Mock localStorage for node environment if not present
  if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (k: string) => store.get(k) || null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    };
  }

  // Mock document & documentElement if not present in Node
  if (typeof globalThis.document === 'undefined') {
    const attrs = new Map<string, string>();
    (globalThis as any).document = {
      documentElement: {
        setAttribute: (k: string, v: string) => attrs.set(k, v),
        getAttribute: (k: string) => attrs.get(k) || null,
      },
    };
  }

  // Test 1: Default theme fallback
  {
    const start = performance.now();
    try {
      localStorage.removeItem(THEME_STORAGE_KEY);
      const defaultTheme = getStoredTheme();
      if (defaultTheme !== 'slate') {
        throw new Error(`Expected default theme 'slate', got '${defaultTheme}'`);
      }

      results.push({
        name: 'Theme Default Fallback Verification',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: { defaultTheme },
      });
    } catch (e: any) {
      results.push({
        name: 'Theme Default Fallback Verification',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  // Test 2: Persistence & Emerald High-Contrast Toggle
  {
    const start = performance.now();
    try {
      applyTheme('emerald');
      const savedTheme = getStoredTheme();
      const attr = document.documentElement.getAttribute('data-theme');

      if (savedTheme !== 'emerald' || attr !== 'emerald') {
        throw new Error(`Theme persistence mismatch: saved=${savedTheme}, attr=${attr}`);
      }

      // Switch back to slate
      applyTheme('slate');
      const revertedTheme = getStoredTheme();
      if (revertedTheme !== 'slate') {
        throw new Error(`Theme toggle reversal mismatch: got=${revertedTheme}`);
      }

      results.push({
        name: 'Theme Persistence in localStorage & Attribute Sync',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          emeraldApplied: true,
          slateReverted: true,
          storageKey: THEME_STORAGE_KEY,
        },
      });
    } catch (e: any) {
      results.push({
        name: 'Theme Persistence in localStorage & Attribute Sync',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  return results;
}
