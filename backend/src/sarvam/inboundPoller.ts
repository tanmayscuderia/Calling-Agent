/**
 * Sarvam inbound call-logs poller — webhook fallback.
 *
 * Dashboard-configured inbound deployments deliver result webhooks, but
 * local dev (behind tunnels) or webhook outages can drop them. This poller
 * periodically pulls the analytics `attempts` list (channel_direction =
 * 'inbound'), and ingests any attempt we don't already have.
 *
 * `ingestInboundAttempt` dedupes on (org_id, external_call_id), so running
 * BOTH the webhook and this poller is safe — the second writer sees
 * 'duplicate' and stops.
 *
 * Enabled via SARVAM_INBOUND_POLLER=true (+ SARVAM_DEFAULT_ORG_ID).
 * Plan: docs/SARVAM_CALLING_PLAN.md (Phase S5)
 */

import { config } from '../config';
import { logger } from '../utils/logger';
import { isSarvamConfigured, listAttempts } from './sarvamClient';
import { ingestInboundAttempt } from './callResultService';

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

/** One poll cycle: last 24h of inbound attempts → ingest new ones. */
export async function pollInboundOnce(): Promise<{ checked: number; ingested: number }> {
  // Guard: poller only makes sense with an org to attribute to
  const orgId = config.sarvam.defaultOrgId;
  if (!orgId) return { checked: 0, ingested: 0 };

  const now = new Date();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const page = await listAttempts({
    startDatetime: start.toISOString(),
    endDatetime: now.toISOString(),
    limit: 50,
    sortBy: 'start_datetime',
    sortOrder: 'desc',
    filterConditions: [
      { id: '1', field: 'channel_direction', operator: 'equals', value: 'inbound' },
    ],
  });

  const items = page?.items ?? [];
  let ingested = 0;
  for (const att of items) {
    try {
      const r = await ingestInboundAttempt(orgId, att);
      if (r === 'processed') ingested++;
    } catch (err: any) {
      logger.error({ attemptId: att.attempt_id, err: err?.message }, '[SarvamPoller] Inbound ingest failed');
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