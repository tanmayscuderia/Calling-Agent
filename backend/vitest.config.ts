import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Both unit and eval tests live under tests/
    // Scripts control which dir runs via --dir flag
    include: ['tests/**/*.test.ts', 'tests/**/*.eval.ts'],
    // Eval tests are slower (real LLM calls) — give generous timeouts
    testTimeout: 60_000,
    hookTimeout: 30_000,
    // Prevent vitest from running eval tests during unit test runs
    // (controlled by npm scripts passing --dir)
    globals: false,
    // Eval tests make real LLM API calls — running them in parallel
    // causes rate-limit (429) failures. fileParallelism:false ensures
    // test files run sequentially. Combined with LLM_MAX_CONCURRENT=1
    // and LLM_MIN_DELAY_MS=2000 in npm scripts, this prevents bursts.
    fileParallelism: false,
  },
});