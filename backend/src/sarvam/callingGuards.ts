/**
 * Calling-safety guards for real (PSTN) outbound calls.
 *
 * Wires together three protections that start-real enforces BEFORE any
 * Sarvam dispatch (real calls cost money + are regulated):
 *   1. Calling hours (IST window from config, env-toggleable)
 *   2. Do-Not-Call registry (`do_not_call` table, per org + phone)
 *   3. Daily call limits — via checkCallAllowed() in rateLimiter.ts
 *
 * Prior to 2026-08-30 these were documented in the README but never
 * enforced — this module closes that gap.
 */
import { supabaseAdmin } from '../db/supabase';
import { config } from '../config';
import { logger } from '../utils/logger';

/** Current hour (0-23) in IST regardless of server timezone. */
export function istHourNow(now = new Date()): number {
  return Number(
    now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false })
  );
}

/** Is the current IST time inside the configured calling window? */
export function isWithinCallingHours(now = new Date()): { allowed: boolean; istHour: number } {
  const istHour = istHourNow(now);
  const { callingHoursStart, callingHoursEnd } = config.sarvam;
  const allowed = istHour >= callingHoursStart && istHour < callingHoursEnd;
  return { allowed, istHour };
}

/** Is this phone on the org's Do-Not-Call list? (fail-open: a DNC table error must not block revenue calls — it logs loudly instead) */
export async function isDncListed(orgId: string, phone: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('do_not_call')
      .select('phone')
      .eq('org_id', orgId)
      .eq('phone', phone)
      .limit(1);
    if (error) throw error;
    return (data ?? []).length > 0;
  } catch (err: any) {
    // Table might not exist yet (migration not applied) — never block calls on infra failure
    logger.warn({ err: err?.message }, '[DNC] lookup failed — allowing call (fail-open)');
    return false;
  }
}

/** Add a phone to the org's DNC list. */
export async function addToDnc(orgId: string, phone: string, reason?: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from('do_not_call')
    .upsert({ org_id: orgId, phone, reason: reason ?? null }, { onConflict: 'org_id,phone' });
  if (error) throw error;
}

/** Remove a phone from the org's DNC list. */
export async function removeFromDnc(orgId: string, phone: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from('do_not_call')
    .delete()
    .eq('org_id', orgId)
    .eq('phone', phone);
  if (error) throw error;
}

/** List the org's DNC entries (newest first). */
export async function listDnc(orgId: string): Promise<any[]> {
  const { data, error } = await supabaseAdmin()
    .from('do_not_call')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}