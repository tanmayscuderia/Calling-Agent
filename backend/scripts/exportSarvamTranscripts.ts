/**
 * exportSarvamTranscripts.ts
 *
 * Pulls call transcripts from Sarvam Analytics API and saves them locally.
 * Also cross-references sarvam-tool-calls.log to detect turns where the caller
 * asked about inventory but the agent NEVER called the tool ("skip detector").
 *
 * Usage:
 *   npx tsx scripts/exportSarvamTranscripts.ts              # last 24h
 *   npx tsx scripts/exportSarvamTranscripts.ts --days 7       # last 7 days
 *   npx tsx scripts/exportSarvamTranscripts.ts --from 2026-08-20 --to 2026-08-25
 *   npx tsx scripts/exportSarvamTranscripts.ts --interaction <id>  # single call
 *
 * Output:
 *   backend/logs/sarvam-transcripts/<date>__<interaction_id>.json   (raw API response)
 *   backend/logs/sarvam-transcripts/<date>__<interaction_id>.txt    (readable turn-by-turn)
 *   backend/logs/sarvam-transcripts/<date>__<interaction_id>.skip.json  (skip analysis)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

// Load .env from project root (backend/scripts/ → ../../.env)
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ── Env (loaded directly, no config.ts dependency) ───────────────────────

function env(key: string, fallback?: string): string {
  const v = process.env[key];
  if (!v && !fallback) throw new Error(`Missing env: ${key}`);
  return v ?? fallback!;
}

const API_KEY = env('SARVAM_API_KEY');
const ORG_ID = env('SARVAM_ORG_ID');
const WS_ID = env('SARVAM_WORKSPACE_ID');
const APP_ID = env('SARVAM_APP_ID');
const BASE_URL = env('SARVAM_BASE_URL', 'https://apps.sarvam.ai');
const API_BASE = `${BASE_URL}/api/analytics/v1/${ORG_ID}/${WS_ID}/${APP_ID}`;

const OUT_DIR = path.resolve(__dirname, '../logs/sarvam-transcripts');
const TOOL_LOG = path.resolve(__dirname, '../logs/sarvam-tool-calls.log');

// ── CLI arg parsing ──────────────────────────────────────────────────────

const args = process.argv.slice(2);
function argVal(flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
}
const DAYS = Number(argVal('--days') ?? 1);
const FROM = argVal('--from');
const TO = argVal('--to');
const SINGLE_ID = argVal('--interaction');

let startDt: string;
let endDt: string;

if (SINGLE_ID) {
  startDt = '2025-01-01T00:00:00Z';
  endDt = new Date().toISOString();
} else if (FROM && TO) {
  startDt = new Date(FROM).toISOString();
  endDt = new Date(TO + 'T23:59:59Z').toISOString();
} else {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - DAYS);
  startDt = from.toISOString();
  endDt = now.toISOString();
}

// ── HTTP helpers ─────────────────────────────────────────────────────────

async function sarvamGet<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { 'X-API-Key': API_KEY },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`  \u2717 ${res.status} ${url.slice(0, 120)} \u2192 ${body.slice(0, 200)}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err: any) {
    console.error(`  \u2717 fetch failed: ${err.message}`);
    return null;
  }
}

// ── Types ────────────────────────────────────────────────────────────────

interface InteractionRecord {
  interaction_id: string;
  user_identifier?: string | null;
  duration_in_seconds?: number | null;
  start_datetime?: string | null;
  end_datetime?: string | null;
  channel_direction?: string | null;
  num_messages?: number | null;
  ended_by?: string | null;
  is_debug_call?: number | null;
  [k: string]: unknown;
}

interface InteractionsPage {
  items: InteractionRecord[];
  total: number;
  limit: number;
  offset: number;
  next_page_uri?: string | null;
}

type TranscriptResponse = Record<string, unknown>;

// ── Page through interactions ────────────────────────────────────────────

async function fetchAllInteractions(): Promise<InteractionRecord[]> {
  const all: InteractionRecord[] = [];
  let offset = 0;
  const limit = 500;

  while (true) {
    const qs = new URLSearchParams({
      start_datetime: startDt,
      end_datetime: endDt,
      sort_by: 'start_datetime',
      sort_order: 'desc',
      limit: String(limit),
      offset: String(offset),
    });
    const url = `${API_BASE}/interactions?${qs}`;
    const page = await sarvamGet<InteractionsPage>(url);
    if (!page?.items) {
      console.error(`  \u2717 interactions page failed at offset ${offset}`);
      break;
    }
    all.push(...page.items);
    console.log(`  \u2192 fetched ${page.items.length} interactions (offset ${offset}, total ${page.total})`);
    if (offset + limit >= page.total || !page.next_page_uri) break;
    offset += limit;
  }

  if (SINGLE_ID) {
    const match = all.find((i) => i.interaction_id === SINGLE_ID);
    return match ? [match] : [];
  }
  return all;
}

// ── Fetch + save a single transcript ─────────────────────────────────────

function safeFileName(id: string): string {
  return id.replace(/[/\\]/g, '_');
}

function datePrefix(startDt?: string | null): string {
  if (!startDt) return 'unknown-date';
  return startDt.slice(0, 10);
}

/**
 * Extract turn text from raw transcript response.
 * The API docs show `{}` so we handle multiple known shapes:
 *   - { transcript: [{role, text}, ...] }
 *   - { transcript: [{role, en_text}, ...] }
 *   - { turns: [{speaker, text}, ...] }
 *   - { messages: [{role, content}, ...] }
 *   - { transcription: "..." }  (flat string)
 */
function extractTurns(raw: TranscriptResponse): Array<{ speaker: string; text: string }> {
  const candidates: Array<unknown> | undefined =
    (raw.transcript as Array<unknown> | undefined) ??
    (raw.turns as Array<unknown> | undefined) ??
    (raw.messages as Array<unknown> | undefined);

  if (Array.isArray(candidates)) {
    return candidates
      .map((t: any) => {
        const speaker = String(t.role ?? t.speaker ?? 'unknown').toUpperCase();
        const text = t.text ?? t.en_text ?? t.content ?? '';
        return { speaker, text: String(text) };
      })
      .filter((t) => t.text.length > 0);
  }

  if (typeof raw.transcription === 'string' && raw.transcription) {
    return [{ speaker: 'TRANSCRIPT', text: raw.transcription }];
  }

  // Fallback: dump raw JSON so it's inspectable
  return [{ speaker: 'RAW', text: JSON.stringify(raw, null, 2) }];
}

async function fetchAndSaveTranscript(interaction: InteractionRecord): Promise<void> {
  const id = interaction.interaction_id;
  const prefix = datePrefix(interaction.start_datetime);
  const safe = safeFileName(id);
  const baseName = `${prefix}__${safe}`;

  const jsonPath = path.join(OUT_DIR, `${baseName}.json`);
  const txtPath = path.join(OUT_DIR, `${baseName}.txt`);
  const skipPath = path.join(OUT_DIR, `${baseName}.skip.json`);

  // Skip if already downloaded (idempotent)
  if (fs.existsSync(jsonPath) && fs.existsSync(txtPath)) {
    console.log(`  ⏭  ${baseName} — already exists`);
    return;
  }

  const raw = await sarvamGet<TranscriptResponse>(`${API_BASE}/transcripts/${id}`);
  if (!raw) {
    console.error(`  \u2717 transcript fetch failed: ${id}`);
    return;
  }

  // Save raw JSON (verbatim — don't assume shape)
  fs.writeFileSync(jsonPath, JSON.stringify(raw, null, 2), 'utf-8');

  // Save readable .txt
  const turns = extractTurns(raw);
  const header = [
    `Interaction: ${id}`,
    `Phone: ${interaction.user_identifier ?? '?'}  |  Direction: ${interaction.channel_direction ?? '?'}  |  Duration: ${interaction.duration_in_seconds ?? '?'}s`,
    `Started: ${interaction.start_datetime ?? '?'}  |  Ended: ${interaction.end_datetime ?? '?'}  |  Ended by: ${interaction.ended_by ?? '?'}`,
    `Messages: ${interaction.num_messages ?? '?'}  |  Debug: ${interaction.is_debug_call ? 'yes' : 'no'}`,
    '─'.repeat(80),
  ].join('\n');

  const body = turns.map((t) => `${t.speaker}: ${t.text}`).join('\n\n');
  fs.writeFileSync(txtPath, `${header}\n\n${body}\n`, 'utf-8');

  // Run skip + incident detection
  const skipResult = await detectSkips(interaction, turns);
  const hasSkips = skipResult.skipped.length > 0;
  const hasIncidents = skipResult.incidents.length > 0;
  if (hasSkips || hasIncidents) {
    fs.writeFileSync(skipPath, JSON.stringify(skipResult, null, 2), 'utf-8');
    const parts: string[] = [];
    if (hasSkips) parts.push(`${skipResult.skipped.length} skip(s)`);
    if (hasIncidents) parts.push(`${skipResult.incidents.length} incident(s)`);
    console.log(`  \u26a0\ufe0f  ${baseName} — ${parts.join(', ')}`);
  } else {
    console.log(`  \u2705 ${baseName} — ${turns.length} turns, no skips`);
  }
}

// ── Skip detector: cross-reference transcript vs tool-call log ──────────

async function loadToolCallTimestamps(): Promise<Array<{ ts: Date; event: string }>> {
  if (!fs.existsSync(TOOL_LOG)) return [];
  const lines: Array<{ ts: Date; event: string }> = [];
  const rl = readline.createInterface({ input: fs.createReadStream(TOOL_LOG, 'utf-8') });
  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.t && obj.event) {
        lines.push({ ts: new Date(obj.t), event: String(obj.event) });
      }
    } catch {
      // skip malformed lines
    }
  }
  return lines.sort((a, b) => a.ts.getTime() - b.ts.getTime());
}

/** Inventory-related keywords (English, Hindi, Hinglish). */
const INVENTORY_KEYWORDS = [
  /(bhk|flat|apartment|property|properties|project|inventory|stock|available|availability)\b/i,
  /(budget|price|rate|crore|lakh|cost|pricing)\b/i,
  /(2bhk|3bhk|4bhk|1bhk|1rk)\b/i,
  /(फ्लैट|प्रॉपर्टी|प्रॉजेक्ट|गृह|मकान|घर|दुकान|शॉप|प्लॉट)/,
  /(बजट|कीमत|दाम|रेट|रुपये|लाख|करोड़)/,
  /(कौन सा|कौनसा|कहाँ|कहां|किस शहर)/,
  /(noida|gurgaon|gurugram|pune|mumbai|bangalore|bengaluru|delhi|faridabad|ghaziabad)\b/i,
  /(dekhna|dikhao|batana|batao|chahiye|chahte|search|find|look)\b/i,
];

function hasInventoryIntent(text: string): boolean {
  return INVENTORY_KEYWORDS.some((re) => re.test(text));
}

function toolCallsInWindow(
  toolCalls: Array<{ ts: Date; event: string }>,
  callStart?: string | null,
  callEnd?: string | null,
): Array<{ ts: Date; event: string }> {
  const start = callStart ? new Date(callStart).getTime() - 60_000 : 0;
  const end = callEnd ? new Date(callEnd).getTime() + 60_000 : Infinity;
  return toolCalls.filter((tc) => tc.ts.getTime() >= start && tc.ts.getTime() <= end);
}

interface SkipAnalysis {
  interaction_id: string;
  call_start: string | null;
  call_end: string | null;
  tool_calls_in_window: number;
  skipped: Array<{
    turn_index: number;
    speaker: string;
    text: string;
    matched_keywords: string[];
  }>;
  incidents: Array<{
    type: 'garbage_phrase' | 'broken_tool_promise';
    turn_index: number;
    speaker: string;
    text: string;
  }>;
}


async function detectSkips(
  interaction: InteractionRecord,
  turns: Array<{ speaker: string; text: string }>,
): Promise<SkipAnalysis> {
  const toolCalls = await loadToolCallTimestamps();
  const windowCalls = toolCallsInWindow(toolCalls, interaction.start_datetime, interaction.end_datetime);
  const hasAnyToolCall = windowCalls.length > 0;
  const skipped: SkipAnalysis['skipped'] = [];

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const speakerLower = turn.speaker.toLowerCase();
    const isCaller =
      speakerLower.includes('user') ||
      speakerLower.includes('caller') ||
      speakerLower.includes('customer') ||
      speakerLower === 'human';
    if (!isCaller) continue;
    if (!hasInventoryIntent(turn.text)) continue;
    const matched = INVENTORY_KEYWORDS.filter((re) => re.test(turn.text)).map((re) => re.source);
    if (!hasAnyToolCall) {
      skipped.push({ turn_index: i, speaker: turn.speaker, text: turn.text, matched_keywords: matched });
    }
  }

  // ── Incident detection ──
  const incidents: SkipAnalysis['incidents'] = [];
  // Hindi regex for "है क्या तू" garbage phrase
  const GARBAGE_RE = /है\s*क्या\s*तू/;
  const TOOL_PROMISE_RE = /[\u090f]\u0915\s*second.*?check\s*[\u0915\u0930\u0924\u093e]/;

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    if (!turn.speaker.includes('ASSISTANT') && !turn.speaker.includes('AGENT')) continue;
    if (GARBAGE_RE.test(turn.text)) {
      incidents.push({ type: 'garbage_phrase', turn_index: i, speaker: turn.speaker, text: turn.text });
    }
    if (TOOL_PROMISE_RE.test(turn.text) && i === turns.length - 1) {
      incidents.push({ type: 'broken_tool_promise', turn_index: i, speaker: turn.speaker, text: turn.text });
    }
  }

  return {
    interaction_id: interaction.interaction_id,
    call_start: interaction.start_datetime ?? null,
    call_end: interaction.end_datetime ?? null,
    tool_calls_in_window: windowCalls.length,
    skipped,
    incidents,
  };
}


// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('Sarvam Transcript Export');
  console.log(`  Date range : ${startDt} → ${endDt}`);
  console.log(`  App ID     : ${APP_ID}`);
  console.log(`  Output dir : ${OUT_DIR}`);
  if (SINGLE_ID) console.log(`  Single ID  : ${SINGLE_ID}`);
  console.log('═'.repeat(60));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const interactions = await fetchAllInteractions();
  console.log();
  console.log(`ℹ️  Found ${interactions.length} interaction(s)`);
  console.log();

  if (interactions.length === 0) {
    console.log('Nothing to export.');
    return;
  }

  for (const interaction of interactions) {
    const dur = interaction.duration_in_seconds ? `${Math.round(interaction.duration_in_seconds)}s` : '?';
    console.log(`── ${interaction.interaction_id}  ${interaction.start_datetime?.slice(0, 19) ?? '?'}  ${dur}  ${interaction.channel_direction ?? '?'} ──`);
    await fetchAndSaveTranscript(interaction);
  }

  // ── Summary ──
  const skipFiles = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.skip.json'));
  let totalIncidents = 0;
  let totalGarbage = 0;
  let totalBroken = 0;
  let totalSkips = 0;
  for (const f of skipFiles) {
    const content = JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), 'utf-8')) as SkipAnalysis;
    totalIncidents += content.incidents.length;
    totalGarbage += content.incidents.filter((i) => i.type === 'garbage_phrase').length;
    totalBroken += content.incidents.filter((i) => i.type === 'broken_tool_promise').length;
    if (content.skipped.length > 0) totalSkips += content.skipped.length;
  }

  console.log();
  console.log('═'.repeat(60));
  console.log(`✅ Done. ${interactions.length} transcript(s) saved to ${OUT_DIR}`);
  if (totalIncidents > 0) {
    console.log(`⚠️  ${totalIncidents} incident(s): ${totalGarbage} garbage phrase(s), ${totalBroken} broken tool promise(s)`);
    console.log('   → Fix: set "If it fails" in Sarvam dashboard tool config + update prompt to v7.2');
  }
  if (totalSkips > 0) {
    console.log(`⚠️  ${totalSkips} caller turn(s) with inventory intent but no tool call (see .skip.json files)`);
  }
  if (totalIncidents === 0 && totalSkips === 0) {
    console.log('🟢 No incidents or skips detected — all clean!');
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
