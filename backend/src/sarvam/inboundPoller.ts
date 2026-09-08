/**
 * Sarvam inbound call-logs poller — webhook fallback.
 *
 * Dashboard-configured inbound deployments deliver result webhooks, but
 * local dev (behind tunnels) or webhook outages can drop them. This poller
 * periodically pulls the analytics INTERACTIONS list (channel_direction =
 * 'inbound') and ingests anything new.
 *
 * WHY interactions (not attempts): the interactions endpoint returns
 * `user_contact` — the caller's REAL phone — while the attempts endpoint
 * only returns a hashed/anonymized identifier, and dashboard-placed calls
 * have attempt_id = 'NO_JOB_ID'. Ingestion dedupes on (org_id,
 * external_call_id) where external_call_id = interaction_id (unique per
 * call), so running BOTH the webhook and this poller is safe — the second
 * writer sees 'duplicate' and stops.
 *
 * Enabled via SARVAM_INBOUND_POLLER=true (+ SARVAM_DEFAULT_ORG_ID).
 * Plan: docs/SARVAM_CALLING_PLAN.md (Phase S5)
 */

import { config } from '../config';
import { logger } from '../utils/logger';
import { isSarvamConfigured, listInteractions } from './sarvamClient';
import { ingestInboundAttempt } from './callResultService';

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

/** One poll cycle: last 24h of inbound interactions → ingest new ones. */
export async function pollInboundOnce(): Promise<{ checked: number; ingested: number }> {
  // Guard: poller only makes sense with an org to attribute to
  const orgId = config.sarvam.defaultOrgId;
  if (!orgId) return { checked: 0, ingested: 0 };

  const now = new Date();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const page = await listInteractions({
    startDatetime: start.toISOString(),
    endDatetime: now.toISOString(),
    limit: 50,
    sortBy: 'start_datetime',
    sortOrder: 'desc',
    filterConditions: [
      { id: '1', field: 'channel_direction', operator: 'equals', value: 'inbound' },
    ],
  });

  const items = (page?.items ?? []) as any[];
  let ingested = 0;
  for (const it of items) {
    // Map interaction → ingest input. attempt_id is intentionally empty:
    // dashboard calls carry attempt_id='NO_JOB_ID', and ingest falls back to
    // the unique interaction_id. user_contact is the RAW caller phone.
    const att = {
      attempt_id: '',
      user_identifier: it.user_contact ?? it.user_identifier ?? '',
      interaction_id: it.interaction_id,
      connectivity_status: null,
      duration_in_seconds: it.duration_in_seconds,
      start_datetime: it.start_datetime,
      agent_variables: it.agent_variables ?? null,
      failure_reason: it.failure_reason ?? null,
      audio_url: it.audio_url ?? null,
      ended_by: it.ended_by ?? null,
    };
    try {
      const r = await ingestInboundAttempt(orgId, att as any);
      if (r === 'processed') ingested++;
    } catch (err: any) {
      logger.error({ interactionId: it.interaction_id, err: err?.message }, '[SarvamPoller] Inbound ingest failed');
    }
  }
  return { checked: items.length, ingested };
}

export function startInboundPoller(): void {
  if (!config.sarvam.inboundPollerEnabled) return;
  if (!isSarvamConfigured()) {
    logger.warn('[SarvamPoller] SARVAM_INBOUND_POLLER=true but Sarvam not configured — not starting');
    return;
  }
  if (!config.sarvam.defaultOrgId) {
    logger.warn('[SarvamPoller] SARVAM_INBOUND_POLLER=true but SARVAM_DEFAULT_ORG_ID not set — not starting');
    return;
  }

  const intervalMs = Math.max(30, config.sarvam.inboundPollIntervalSec) * 1000;
  timer = setInterval(async () => {
    if (running) return; // previous cycle still going — skip
    running = true;
    try {
      const { checked, ingested } = await pollInboundOnce();
      if (ingested > 0) {
        logger.info({ checked, ingested }, '[SarvamPoller] Inbound attempts ingested');
      }
    } catch (err: any) {
      logger.error({ err: err?.message }, '[SarvamPoller] Poll cycle failed');
    } finally {
      running = false;
    }
  }, intervalMs);

  logger.info({ intervalSec: config.sarvam.inboundPollIntervalSec }, '[SarvamPoller] Inbound poller started');
}

export function stopInboundPoller(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
    logger.info('[SarvamPoller] Inbound poller stopped');
  }
}