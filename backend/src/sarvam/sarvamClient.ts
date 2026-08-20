/**
 * Sarvam Voice Agents REST client.
 *
 * Docs: sarvam-voice-agents-md/ (Instant Outbound + Analytics APIs)
 * Plan: docs/SARVAM_CALLING_PLAN.md (Phase S2)
 *
 * Hardening mirrors llmClient.ts:
 *   - X-API-Key auth header
 *   - 15s AbortController timeout
 *   - 3 retries on 429/5xx/network with exponential backoff + jitter
 *   - NEVER throws into the call flow: returns null on failure so the
 *     route can surface a clean 502 and the browser demo stays usable.
 */

import { config } from '../config';
import { logger } from '../utils/logger';

const API_BASE = config.sarvam.baseUrl;
const TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;

export interface OutboundCallRequest {
  /** Lead's phone number in E.164 (e.g. +919876543210) — required */
  userPhoneNumber: string;
  /** Our webhook: {publicUrl}/webhooks/sarvam/{secret} */
  webhookUrl: string;
  /** Correlation data echoed back in the webhook payload */
  metadata?: Record<string, unknown>;
  /** Optional overrides (defaults from config.sarvam) */
  appId?: string;
  appVersion?: number;
  connectionId?: string;
  agentPhoneNumber?: string;
}

export interface OutboundCallResult {
  attempt_id: string;
  [key: string]: unknown;
}

export interface InteractionDetails {
  interaction_id: string;
  transcript?: Array<{ role: string; text?: string; content?: string }>;
  recording_url?: string;
  [key: string]: unknown;
}

export function isSarvamConfigured(): boolean {
  const s = config.sarvam;
  return Boolean(s.apiKey && s.orgId && s.workspaceId && s.appId);
}

/** Build the webhook URL we hand to Sarvam (secret in path = auth). */
export function buildWebhookUrl(): string {
  return `${config.sarvam.publicUrl.replace(/\/$/, '')}/webhooks/sarvam/${config.sarvam.webhookSecret}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function shouldRetry(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * Core request helper with timeout + retry. Returns parsed JSON or null.
 */
async function sarvamRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown
): Promise<T | null> {
  const url = `${API_BASE}${path}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method,
        signal: controller.signal,
        headers: {
          'X-API-Key': config.sarvam.apiKey,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      clearTimeout(timer);

      if (shouldRetry(res.status) && attempt < MAX_RETRIES) {
        const backoff = Math.min(2 ** attempt * 1000, 8000) + Math.random() * 1000;
        logger.warn(
          { url: path, status: res.status, attempt, backoffMs: Math.round(backoff) },
          '[Sarvam] Retryable status, backing off'
        );
        await sleep(backoff);
        continue;
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        logger.error(
          { url: path, status: res.status, errText: errText.slice(0, 500) },
          '[Sarvam] API error (non-retryable or retries exhausted)'
        );
        return null;
      }

      return (await res.json().catch(() => ({}))) as T;
    } catch (err: any) {
      clearTimeout(timer);
      const aborted = err?.name === 'AbortError';
      if (attempt < MAX_RETRIES) {
        const backoff = Math.min(2 ** attempt * 1000, 8000) + Math.random() * 1000;
        logger.warn(
          { url: path, attempt, aborted, err: err?.message },
          '[Sarvam] Request failed, retrying'
        );
        await sleep(backoff);
        continue;
      }
      logger.error(
        { url: path, aborted, err: err?.message },
        '[Sarvam] Request failed after all retries'
      );
      return null;
    }
  }
  return null;
}

/**
 * Trigger an outbound AI voice call via Sarvam Instant Outbound API.
 * POST /api/outbounds/v1/orgs/:org_id/workspaces/:workspace_id/outbounds
 * Returns { attempt_id } or null (caller surfaces 502).
 */
export async function createOutboundCall(
  req: OutboundCallRequest
): Promise<OutboundCallResult | null> {
  const s = config.sarvam;

  const payload = {
    app_config: {
      app_id: req.appId ?? s.appId,
      version: req.appVersion ?? s.appVersion,
      connection: {
        telephony: {
          connection_id: req.connectionId ?? s.connectionId,
          agent_phone_number: req.agentPhoneNumber ?? s.agentPhoneNumber,
        },
      },
    },
    user_config: {
      user_phone_number: req.userPhoneNumber,
    },
    webhook_config: {
      url: req.webhookUrl,
      metadata: req.metadata ?? {},
    },
  };

  const result = await sarvamRequest<OutboundCallResult>(
    'POST',
    `/api/outbounds/v1/orgs/${s.orgId}/workspaces/${s.workspaceId}/outbounds`,
    payload
  );

  if (!result?.attempt_id) {
    logger.error({ result }, '[Sarvam] Outbound call response missing attempt_id');
    return null;
  }
  return result;
}

/**
 * Fetch the transcript for an interaction from the Sarvam Analytics API.
 * Used as a fallback when the webhook transcript is missing.
 * GET /api/analytics/v1/:org_id/:workspace_id/:app_id/transcripts/:interaction_id
 */
export async function getInteractionTranscript(
  interactionId: string
): Promise<InteractionDetails | null> {
  const s = config.sarvam;
  // interaction_id contains slashes (e.g. "20250920/1ae056a30013510b66a6a0") —
  // keep them; Sarvam's path is literally orgs/workspace/app/transcripts/<id-with-slashes>.
  return sarvamRequest<InteractionDetails>(
    'GET',
    `/api/analytics/v1/${s.orgId}/${s.workspaceId}/${s.appId}/transcripts/${interactionId}`
  );
}

// ── Analytics attempts API (inbound caller identity) ──────────────────

export interface AttemptRecord {
  attempt_id: string;
  interaction_id?: string | null;
  /** Caller's phone number (E.164). The ONLY caller-identity source —
   *  the result webhook payload carries no caller number. */
  user_identifier?: string | null;
  connectivity_status?: string | null;
  failure_reason?: string | null;
  duration_in_seconds?: number | null;
  start_datetime?: string | null;
  end_datetime?: string | null;
  /** 'inbound' | 'outbound' — distinguishes dial-in calls from campaigns. */
  channel_direction?: string | null;
  agent_variables?: Record<string, unknown> | null;
  audio_url?: string | null;
  ended_by?: string | null;
}

export interface AttemptsPage {
  items: AttemptRecord[];
  total: number;
  limit: number;
  offset: number;
  next_page_uri?: string | null;
}

/**
 * Analytics attempts API — paginated call log with caller identity
 * (`user_identifier`) and `channel_direction`. Required for inbound:
 * webhook payloads have no caller number, so we look the attempt up here.
 */
export async function listAttempts(opts: {
  startDatetime: string;
  endDatetime: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filterConditions?: Array<{ id: string; field: string; operator: string; value: unknown }>;
}): Promise<AttemptsPage | null> {
  const s = config.sarvam;
  const qs = new URLSearchParams({
    start_datetime: opts.startDatetime,
    end_datetime: opts.endDatetime,
  });
  if (opts.limit != null) qs.set('limit', String(opts.limit));
  if (opts.offset != null) qs.set('offset', String(opts.offset));
  if (opts.sortBy) qs.set('sort_by', opts.sortBy);
  if (opts.sortOrder) qs.set('sort_order', opts.sortOrder);
  if (opts.filterConditions) qs.set('filter_conditions', JSON.stringify(opts.filterConditions));

  return sarvamRequest<AttemptsPage>(
    'GET',
    `/api/analytics/v1/${s.orgId}/${s.workspaceId}/${s.appId}/attempts?${qs.toString()}`
  );
}
