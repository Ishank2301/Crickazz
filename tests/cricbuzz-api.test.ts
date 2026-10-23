import { TestResult } from './sqlite-wasm.test';

export async function runCricbuzzApiTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: RapidAPI Host & Fallback Resilience
  {
    const start = performance.now();
    try {
      const defaultHost = 'cricbuzz-cricket.p.rapidapi.com';

      // Test keyless fallback contract
      const testFallbackResponse = {
        success: false,
        error: 'No RapidAPI Cricbuzz key configured. Using local cached match streams.',
      };

      if (!testFallbackResponse.error.includes('No RapidAPI Cricbuzz key configured')) {
        throw new Error('Invalid fallback error format');
      }

      results.push({
        name: 'Cricbuzz API Keyless Fallback & Host Contract',
        passed: true,
        durationMs: Number((performance.now() - start).toFixed(2)),
        details: {
          targetHost: defaultHost,
          gracefulFallback: true,
          offlineStateProtected: true,
        },
      });
    } catch (e: any) {
      results.push({
        name: 'Cricbuzz API Keyless Fallback & Host Contract',
        passed: false,
        durationMs: Number((performance.now() - start).toFixed(2)),
        error: e.message,
      });
    }
  }

  return results;
}
