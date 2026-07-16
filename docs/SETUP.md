# Setup Guide — Multi-Industry WhatsApp AI + Calling Agent Platform

Complete setup from scratch to running demo.

---

## Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| **Node.js** | 18+ | `node --version` |
| **npm** | 9+ | `npm --version` |
| **Supabase account** | Free tier OK | https://supabase.com |
| **DeepSeek API key** | — | https://platform.deepseek.com/api_keys |
| **WhatsApp** | Active number | For testing (different from bridge) |

---

## Step 1: Clone & Install

```bash
git clone <repo-url> "Calling Agent"
cd "Calling Agent"

# Install all dependencies (root + backend + frontend)
npm run install:all
```

This runs:
```bash
npm install                    # Root
cd backend && npm install      # Backend
cd frontend && npm install     # Frontend (includes framer-motion for animations)
```

---

## Step 2: Database Setup

### Create a Supabase Project

1. Go to https://supabase.com → New Project
2. Note your **Project URL** and **Database Password**
3. Wait for project to provision (~2 min)

### Get Your Keys

Go to **Settings → API**:
- `Project URL` → this is your `SUPABASE_URL`
- `service_role` key → this is your `SUPABASE_SERVICE_ROLE_KEY`
- `anon` key → this is your `SUPABASE_ANON_KEY`

> **⚠️ IMPORTANT:** Never put the `service_role` key in frontend code or expose it to the browser. It bypasses Row Level Security. Backend only.

### Run Migrations

Run all 10 migration files in order:

```bash
# Option A: via psql
psql "$DATABASE_URL" -f supabase/migrations/20260101_0001_real_estate_ai_prototype.sql
psql "$DATABASE_URL" -f supabase/migrations/20260101_0002_demo_seed.sql
psql "$DATABASE_URL" -f supabase/migrations/20260102_0001_multi_tenant_production.sql
psql "$DATABASE_URL" -f supabase/migrations/20260102_0001a_job_queue_base.sql
psql "$DATABASE_URL" -f supabase/migrations/20260102_0002_queue_hardening.sql
psql "$DATABASE_URL" -f supabase/migrations/20260103_0001_agent_configs_templates.sql
psql "$DATABASE_URL" -f supabase/migrations/20260103_0002_lead_dedup_unique_indexes.sql
psql "$DATABASE_URL" -f supabase/migrations/20260104_0001_more_industry_templates.sql
psql "$DATABASE_URL" -f supabase/migrations/20260105_0001_fix_dequeue_rpc_ambiguous.sql
psql "$DATABASE_URL" -f supabase/migrations/20260106_0001_generic_inventory_items.sql

# Option B: via Supabase SQL Editor (paste each file and Run)
```

**What they create:**
| Migration | Purpose |
|-----------|---------|
| `0001_real_estate_ai_prototype` | Core CRM, WhatsApp, AI, call, inventory tables |
| `0002_demo_seed` | 5 sample properties |
| `0001_multi_tenant_production` | Usage limits + auth cache |
| `0001a_job_queue_base` | Durable job queue + RPCs |
| `0002_queue_hardening` | Queue locking, retry, stale recovery |
| `0001_agent_configs_templates` | Per-org agent config + 8 industry templates |
| `0002_lead_dedup_unique_indexes` | Unique constraints on leads (phone/WhatsApp) |
| `0001_more_industry_templates` | 4 more templates (legal, automotive, salon, insurance) |
| `0001_fix_dequeue_rpc_ambiguous` | Fix column ambiguity in dequeue RPC |
| `0001_generic_inventory_items` | Generic inventory table for non-real-estate industries + `inventory_schema` on agent_configs |

> **Total: 10 migrations.** All are idempotent (`CREATE TABLE IF NOT EXISTS`) — safe to re-run.

---

## Step 3: Create a Login User

You need a Supabase Auth user to log into the dashboard.

1. Go to **Supabase Dashboard → Authentication → Users**
2. Click **Add user → Create new user**
3. Set:
   - **Email:** `demo@example.com` (or any email)
   - **Password:** `demo1234` (or any password)
   - **Auto Confirm:** ✅ Yes (check this so you can login immediately)
4. Click **Create user**

You'll use these credentials at `/login`.

---

## Step 4: Link User to Organization

The user you just created needs to be linked to an org and have a member record.

Check if your org already has a member record for this user:

```sql
-- Run in Supabase SQL Editor
-- First, get your user ID from Auth → Users
SELECT id, email FROM auth.users;

-- Then check if a member exists
SELECT * FROM public.organization_members
WHERE user_id = 'YOUR-USER-ID-HERE';
```

If no member exists, create one:

```sql
-- Replace the UUIDs with your actual values
INSERT INTO public.organization_members (org_id, user_id, role, full_name)
VALUES (
  'YOUR-ORG-ID',           -- from organizations table
  'YOUR-USER-ID',          -- from auth.users
  'admin',
  'Demo User'
);
```

---

## Step 5: Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# ---- Server ----
PORT=4000

# ---- Supabase ----
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# ---- Organization ----
DEFAULT_ORG_ID=your-org-uuid-from-database

# ---- LLM Provider ----
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=your-deepseek-key
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_BASE_URL=https://api.deepseek.com

# ---- AI Behavior ----
AI_BUSINESS_NAME=Your Realty Name
AI_AUTO_REPLY=true
AI_IGNORE_GROUPS=true
AI_ALLOWED_NUMBERS=

# ---- WhatsApp Bridge ----
WHATSAPP_PROVIDER=baileys
WHATSAPP_SESSION_DIR=.sessions/whatsapp

# ---- Auth (REQUIRED) ----
COOKIE_SECRET=generate-a-random-string-at-least-32-chars
FRONTEND_ORIGIN=http://localhost:3000
```

### Generate a Cookie Secret

```bash
# Generate a strong random secret
openssl rand -base64 32
```

Paste the output as `COOKIE_SECRET`.

---

## Step 6: Configure Frontend Environment

```bash
cp frontend/.env.local.example frontend/.env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Step 7: Run the App

### Option A: Run Both Separately (recommended)

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Option B: Run Both from Root

```bash
npm run dev
```

### Verify It's Running

| Service | URL | Expected |
|---------|-----|----------|
| Backend health | http://localhost:4000/health | `{"ok":true}` |
| Frontend | http://localhost:3000 | Redirects to `/login` |

---

## Step 8: Login

1. Open **http://localhost:3000**
2. You'll be redirected to `/login`
3. Enter the email/password you created in Step 3
4. You should be redirected to `/dashboard`

If login fails:
- Check backend terminal for error logs
- Verify the user exists in Supabase → Authentication → Users
- Verify `COOKIE_SECRET` is set (at least 32 chars)
- Verify `FRONTEND_ORIGIN` matches your frontend URL

---

## Step 9: Start WhatsApp Bridge

1. Go to **Dashboard → WhatsApp**
2. Click **Start Bridge**
3. Look at the **backend terminal** for a QR code
4. Open WhatsApp on your phone → **Settings → Linked Devices → Link a Device**
5. Scan the QR code
6. Status changes to **Connected**

---

## Step 10: Test the AI

### Option A: AI Playground (no WhatsApp needed)

Open **http://localhost:3000/dashboard/playground**:

1. Type: `Hi, I am looking for a 3BHK in Noida around 2 crore`
2. Click **Send**
3. See the AI reply, extracted data, and matched properties

> Fastest way to verify the AI is working — no WhatsApp setup required.

### Option B: WhatsApp (full flow)

From a **different phone**, send a WhatsApp message to the connected number:

```
Hi, I am looking for a 3BHK in Noida around 2 crore
```

Expected AI reply:
```
Yes, we have a 3BHK option in Sector 150 around ₹1.65–2.1 Cr...
```

Check the dashboard:
- **Leads** → new lead created with temperature/status
- **Conversations** → full message history
- **Inventory** → seeded properties visible

---

## Troubleshooting

### Login fails with "Invalid email or password"
- Verify user exists in Supabase → Auth → Users
- Verify email is confirmed (Auto Confirm checked)
- Check backend logs for detailed error

### Backend crashes on startup
- Check `@fastify/cookie` version: must be `^9.4.0` for Fastify 4
- Run: `cd backend && npm install @fastify/cookie@^9.4.0`

### WhatsApp QR doesn't appear
- Check backend terminal output
- Delete `.sessions/whatsapp/` folder and restart
- Try relinking from the WhatsApp dashboard page

### AI replies are generic / not using inventory
- Check `DEEPSEEK_API_KEY` is valid
- Verify inventory is seeded: `GET http://localhost:4000/api/inventory/units`
- Check `ai_agent_runs` table for error logs

### CORS errors in browser
- Verify `FRONTEND_ORIGIN` in `.env` matches your frontend URL
- Verify backend CORS config includes `credentials: true`

### "Token expired" on dashboard
- Access tokens expire in 1 hour
- Refresh by calling `POST /api/auth/refresh`
- Or just login again

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `4000` | Backend port |
| `SUPABASE_URL` | **Yes** | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | — | Service role key (backend only) |
| `SUPABASE_ANON_KEY` | **Yes** | — | Anon key (for auth signIn) |
| `DEFAULT_ORG_ID` | **Yes** | — | Fallback org ID for prototype mode |
| `LLM_PROVIDER` | No | `deepseek` | `deepseek` or `openai` |
| `DEEPSEEK_API_KEY` | If deepseek | — | DeepSeek API key |
| `DEEPSEEK_MODEL` | No | `deepseek-v4-flash` | Model name |
| `DEEPSEEK_BASE_URL` | No | `https://api.deepseek.com` | API base URL |
| `AI_BUSINESS_NAME` | No | `Demo Realty` | Business name in AI prompts |
| `AI_AUTO_REPLY` | No | `true` | Auto-reply to WhatsApp messages |
| `AI_IGNORE_GROUPS` | No | `true` | Ignore group messages |
| `AI_ALLOWED_NUMBERS` | No | — | Comma-separated allowlist |
| `WHATSAPP_SESSION_DIR` | No | `.sessions/whatsapp` | Session storage path |
| `COOKIE_SECRET` | **Yes** | — | Cookie signing secret (32+ chars) |
| `FRONTEND_ORIGIN` | **Yes** | `http://localhost:3000` | Frontend URL for CORS |