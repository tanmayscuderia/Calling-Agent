/**
 * Eval Guard Rails
 *
 * Prevents accidental cost overruns from running eval tests against production API.
 *
 * Usage in eval files:
 *   import { evalGuard, evalLlm } from './evalGuard';
 *   await evalGuard();  // Call once before any LLM calls
 *   const res = await evalLlm.generateText(...);  // Uses eval-specific key if configured
 *
 * Env vars:
 *   DEEPSEEK_EVAL_KEY   — If set, evals use this key instead of production key
 *   EVAL_CONFIRM=true   — If set, evals run without confirmation prompt
 *   EVAL_DRY_RUN=true   — If set, evals skip ALL real API calls (mock mode)
 */

// Simple counter to track total API calls made during this eval run
let evalCallCount = 0;

export function getEvalCallCount(): number {
  return evalCallCount;
}

export function incrementEvalCallCount(): void {
  evalCallCount++;
}

/**
 * Guard function — call at the top of every eval file before making LLM calls.
 * - Warns loudly about cost
 * - Checks for dry-run mode
 * - In CI/non-interactive mode, respects EVAL_CONFIRM=true
 */
export async function evalGuard(label?: string): Promise<void> {
  const tag = label ? `[${label}]` : '[eval]';

  // Dry-run mode: no API calls at all
  if (process.env.EVAL_DRY_RUN === 'true') {
    console.warn(`⚠️  ${tag} EVAL_DRY_RUN=true — all LLM calls will be skipped (mock mode)`);
    return;
  }

  // Check if a separate eval key is configured
  const hasEvalKey = !!process.env.DEEPSEEK_EVAL_KEY || !!process.env.OPENAI_EVAL_KEY;
  if (!hasEvalKey) {
    console.warn('');
    console.warn(`⚠️  ${tag} WARNING: Running evals with PRODUCTION API key.`);
    console.warn(`   Each full eval run makes ~50-100 API calls (~$0.01-0.05).`);
    console.warn(`   Set DEEPSEEK_EVAL_KEY to use a separate key for evals.`);
    console.warn('');
  }

  // Non-interactive mode (CI): require EVAL_CONFIRM=true
  if (process.env.CI && process.env.EVAL_CONFIRM !== 'true') {
    throw new Error(
      `${tag} Eval blocked in CI mode. Set EVAL_CONFIRM=true to allow eval API calls.`
    );
  }
}

/**
 * Get the API key to use for eval calls.
 * Uses eval-specific key if configured, otherwise falls back to production key.
 */
export function getEvalApiKey(): string | undefined {
  const provider = process.env.LLM_PROVIDER || 'deepseek';
  if (provider === 'deepseek') {
    return process.env.DEEPSEEK_EVAL_KEY || process.env.DEEPSEEK_API_KEY;
  }
  if (provider === 'openai') {
    return process.env.OPENAI_EVAL_KEY || process.env.OPENAI_API_KEY;
  }
  return undefined;
}

/**
 * Print a summary of API calls made during this eval run.
 * Call this at the end of eval files.
 */
export function printEvalSummary(label?: string): void {
  const tag = label ? `[${label}]` : '[eval]';
  console.log('');
  console.log(`📊 ${tag} Total LLM API calls made: ${evalCallCount}`);
  if (evalCallCount > 50) {
    console.warn(`⚠️  ${tag} High call count (${evalCallCount}). Consider reducing test cases or using EVAL_DRY_RUN=true.`);
  }
  console.log('');
}