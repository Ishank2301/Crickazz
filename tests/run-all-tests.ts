import { runSqliteWasmTests } from './sqlite-wasm.test';
import { runLatencyBenchmarkTests } from './latency-benchmarks.test';
import { runThreeJsPitchTests } from './threejs-pitch.test';
import { runCricbuzzApiTests } from './cricbuzz-api.test';
import { runThemeTests } from './theme.test';

async function main() {
  console.log('\n===============================================================');
  console.log('   CRICKAZZ FULL-STACK TEST & DIAGNOSTICS SUITE');
  console.log('===============================================================\n');

  const suiteStart = performance.now();
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  const runCategory = async (title: string, testFn: () => Promise<any[]>) => {
    console.log(`\n--- Running [${title}] ---`);
    const results = await testFn();
    for (const r of results) {
      totalTests++;
      if (r.passed) {
        passedTests++;
        console.log(`  [PASS] ${r.name} (${r.durationMs}ms)`);
        if (r.details) {
          console.log(`         Details: ${JSON.stringify(r.details)}`);
        }
      } else {
        failedTests++;
        console.error(`  [FAIL] ${r.name} (${r.durationMs}ms)`);
        console.error(`         Error: ${r.error}`);
      }
    }
  };

  await runCategory('SQLite WASM Binary & In-Memory Execution', runSqliteWasmTests);
  await runCategory('Latency Benchmarks & Query Memoization', runLatencyBenchmarkTests);
  await runCategory('Three.js 3D Pitch & PCFShadowMap Compliance', runThreeJsPitchTests);
  await runCategory('Cricbuzz Live API & Fallback Contracts', runCricbuzzApiTests);
  await runCategory('Theme System & LocalStorage Persistence', runThemeTests);

  const totalDuration = (performance.now() - suiteStart).toFixed(2);
  console.log('\n===============================================================');
  console.log(`   SUMMARY: ${passedTests}/${totalTests} Tests Passed in ${totalDuration}ms`);
  if (failedTests > 0) {
    console.log(`   STATUS: ${failedTests} FAILED`);
  } else {
    console.log('   STATUS: ALL SYSTEMS HEALTHY & OPERATIONAL');
  }
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
