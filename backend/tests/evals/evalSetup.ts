/**
 * Vitest Setup File for Eval Mode
 *
 * Auto-loaded when VITEST_EVAL_MODE=1 is set.
 * Installs the LLM cache wrapper + prints the cost warning before any test runs.
 */

import { evalGuard } from './evalGuard';
import { installEvalCache, isDryRun } from './llmCache';
import { llm } from '../../src/ai/llmClient';

if (isDryRun()) {
  // In dry-run mode, SKIP all eval tests by reporting LLM as unconfigured.
  // Eval tests use `describe.skipIf(!llmConfigured)` — this makes them all skip
  // instead of running with mock data that fails assertions.
  (llm as any).isConfigured = () => false;
  console.log('🧪 EVAL_DRY_RUN=true — all eval tests will be SKIPPED (no API calls, no cost)');
} else {
  // Normal eval mode: install cache + print cost warning
  installEvalCache();

  // Print cost warning
  evalGuard('vitest-setup').then(() => {
    console.log('📦 Eval cache installed — repeated runs will use cached responses.');
    console.log('   Run with EVAL_NO_CACHE=1 to force fresh API calls.');
    console.log('');
  });
}
