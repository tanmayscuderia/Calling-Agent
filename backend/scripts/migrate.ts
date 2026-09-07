/**
 * Migration runner — applies supabase/migrations/*.sql in filename order,
 * tracking applied files in a `schema_migrations` table.
 *
 * Replaces the old "paste every file into psql and pray it's idempotent"
 * workflow (run_missing_migrations.sql was a symptom of that pain).
 *
 * Each migration runs inside a SINGLE transaction (psql -1) together with
 * its bookkeeping insert — a failed migration rolls back completely and
 * is retried on the next run.
 *
 * Requires: DATABASE_URL (Supabase pooler/connection string) + psql on PATH.
 * Usage: npm run migrate
 */
import { execFileSync } from 'child_process';
import { readdirSync } from 'fs';
import { join, resolve } from 'path';
import dotenv from 'dotenv';

// backend/scripts/migrate.ts → supabase/migrations lives two levels up
const MIGRATIONS_DIR = join(__dirname, '..', '..', 'supabase', 'migrations');
dotenv.config({ path: resolve(__dirname, '../../.env') });
dotenv.config();
const DB_URL = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;

// --baseline: record every existing migration as applied WITHOUT executing it.
// Use once when adopting the runner on a database that predates it (re-running
// old migrations could duplicate seed data).
const BASELINE = process.argv.includes('--baseline');

if (!DB_URL) {
  console.error('✗ DATABASE_URL (or SUPABASE_DB_URL) is required — the Postgres connection string, e.g. postgresql://postgres:...@db.<ref>.supabase.co:5432/postgres');
  process.exit(1);
}

function psql(args: string[], capture = false): string {
  return execFileSync('psql', [DB_URL!, '-v', 'ON_ERROR_STOP=1', ...args], {
    stdio: capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
  }) as unknown as string;
}

function main() {
  // 1. Bookkeeping table
  psql([
    '-q',
    '-c',
    `create table if not exists schema_migrations (
       filename   text primary key,
       applied_at timestamptz not null default now()
     );`,
  ]);

  // 2. What's already applied?
  const appliedOut = psql(['-t', '-A', '-c', 'select filename from schema_migrations;'], true);
  const applied = new Set(appliedOut.split('\n').map((s) => s.trim()).filter(Boolean));

  // 3. Pending files, in deterministic order
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql') && f !== 'run_missing_migrations.sql')
    .sort();

  if (files.length === 0) {
    console.log('No migration files found.');
    return;
  }

  let appliedCount = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  = ${file} (already applied)`);
      continue;
    }
    if (BASELINE) {
      psql(['-q', '-c', `insert into schema_migrations (filename) values ('${file}');`]);
      console.log(`  ⚑ ${file} (baselined — NOT executed)`);
      appliedCount++;
      continue;
    }
    console.log(`  → Applying ${file} ...`);
    // -1 = whole file + bookkeeping insert in ONE transaction
    psql([
      '-1',
      '-f',
      join(MIGRATIONS_DIR, file),
      '-c',
      `insert into schema_migrations (filename) values ('${file}');`,
    ]);
    appliedCount++;
    console.log(`  ✓ ${file}`);
  }

  console.log(`\nDone: ${appliedCount} ${BASELINE ? 'baselined' : 'applied'}, ${files.length - appliedCount} skipped (already applied).`);
}

try {
  main();
} catch (err: any) {
  console.error('\n✗ Migration failed:', err?.message ?? err);
  process.exit(1);
}