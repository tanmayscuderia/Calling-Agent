import { supabaseAdmin } from '../db/supabase';
import { logger } from '../utils/logger';

/**
 * List organization members for a given org.
 * Returns id, full_name, role, title, mobile_number, whatsapp_number, status.
 */
export async function listMembers(orgId: string) {
  const { data, error } = await supabaseAdmin()
    .from('organization_members')
    .select('id, full_name, role, title, mobile_number, whatsapp_number, status, initials')
    .eq('org_id', orgId)
    .order('full_name', { ascending: true });
  if (error) {
    logger.error({ error }, 'memberService.listMembers failed');
    throw error;
  }
  return data ?? [];
}

/**
 * Get a single member by id.
 */
export async function getMember(orgId: string, memberId: string) {
  const { data, error } = await supabaseAdmin()
    .from('organization_members')
    .select('id, full_name, role, title, mobile_number, whatsapp_number, status')
    .eq('org_id', orgId)
    .eq('id', memberId)
    .maybeSingle();
  if (error) throw error;
  return data;
}