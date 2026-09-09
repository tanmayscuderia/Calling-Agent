-- ============================================================================
-- 20260909_0001: Meta Cloud API provider (dual-provider WhatsApp)
--
-- whatsapp_accounts already had a provider CHECK allowing
-- ('baileys', 'meta_cloud_api', 'gupshup', 'wati', 'twilio', 'other').
-- This migration adds the columns the official WhatsApp Business API
-- (Meta Cloud API) path needs, mirroring wacrm migrations 013:
--
--   phone_number_id — Meta's Phone Number ID. UNIQUE where present:
--                     one Meta number can only be claimed by ONE
--                     account row (and the connect route 409s with a
--                     clear message otherwise).
--   waba_id         — WhatsApp Business Account ID (used for
--                     subscribed_apps diagnostics).
-- ============================================================================

ALTER TABLE public.whatsapp_accounts
  ADD COLUMN IF NOT EXISTS phone_number_id text,
  ADD COLUMN IF NOT EXISTS waba_id text;

-- One CRM account per Meta phone number (partial unique index — NULLs
-- exempt, so Baileys rows are unaffected).
CREATE UNIQUE INDEX IF NOT EXISTS uq_whatsapp_accounts_phone_number_id
  ON public.whatsapp_accounts(phone_number_id)
  WHERE phone_number_id IS NOT NULL;

-- Provider-scoped listing (dashboard: QR accounts vs Meta accounts).
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_org_provider
  ON public.whatsapp_accounts(org_id, provider);