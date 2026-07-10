-- ─────────────────────────────────────────────────────────────
-- Lead Deduplication: Unique Constraints on Email, Phone, WhatsApp
-- Ensures no duplicate leads per org based on email OR phone.
-- Uses partial unique indexes (only when value IS NOT NULL).
-- ─────────────────────────────────────────────────────────────

-- Unique email per org (partial — only rows with an email)
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_leads_org_email
ON public.crm_leads (org_id, email)
WHERE email IS NOT NULL;

-- Unique phone per org (partial — only rows with a phone)
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_leads_org_phone
ON public.crm_leads (org_id, phone)
WHERE phone IS NOT NULL;

-- Unique whatsapp_number per org (partial)
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_leads_org_whatsapp
ON public.crm_leads (org_id, whatsapp_number)
WHERE whatsapp_number IS NOT NULL;