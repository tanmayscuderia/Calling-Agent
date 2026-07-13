import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // In eval mode, load the cache + guard setup file automatically
    setupFiles: process.env.VITEST_EVAL_MODE
      ? ['./tests/evals/evalSetup.ts']
      : [],
    // By default, only run unit tests (0 API calls, instant).
    // Evals are opt-in via `npm run test:evals`.
    include: process.env.VITEST_EVAL_MODE
      ? ['tests/evals/**/*.eval.ts']
      : ['tests/unit/**/*.test.ts'],
    // Eval tests are slower (real LLM calls) — give generous timeouts
    testTimeout: 60_000,
    hookTimeout: 30_000,
    globals: false,
    // Eval tests make real LLM API calls — running them in parallel
    // causes rate-limit (429) failures. fileParallelism:false ensures
    // test files run sequentially.
    fileParallelism: false,
  },
});
