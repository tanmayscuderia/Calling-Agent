# Deployment — Hostinger VPS (target machine)

> **Target:** Hostinger KVM VPS · Ubuntu 24.04 · 16 GB RAM · **budget for this
> stack: 8 GB** (rest stays free for OS, builds, and growth).
> **DB stays on Supabase** (managed Postgres) — the VPS runs only the app
> containers. Written 2026-09-07.

## Resource budget (docker-compose `mem_limit`, already wired)

| Service | Limit | Typical RSS | Notes |
|---|---|---|---|
| backend (API + Baileys + poller) | 1.5 GB | 300–600 MB | `NODE_OPTIONS=--max-old-space-size=1024` |
| worker (job queue) | 1.5 GB | 200–500 MB | same heap cap |
| frontend (Next.js) | 512 MB | 120–300 MB | |
| redis (KV layer) | 512 MB | < 50 MB | `maxmemory 448mb allkeys-lru` |
| caddy (TLS reverse proxy) | ~128 MB | ~20 MB | installed on host, not compose |
| OS + dockerd | ~600 MB | | |
| **Committed** | **≈ 4.8 GB** | | **≈ 3.2 GB headroom** for build spikes + growth |

## Why the VPS changes things for the better

- **No ngrok.** The VPS has public ports. Sarvam hits `https://api.<your-domain>`
  directly (Caddy terminates TLS). Update all Sarvam dashboard URLs
  (Hook #1, Hook #2, on_end webhook) after DNS cutover, and set
  `PUBLIC_BASE_URL=https://api.<your-domain>` in `.env`.
- **WhatsApp session persists** via the `wa-sessions` compose volume —
  redeploys do NOT require re-scanning the QR (only a fresh server does).
- **Redis comes alive** — compose sets `REDIS_URL=redis://redis:6379`, so the
  KV layer (rate-limit counters, LLM semaphore, caches) is shared across the
  api/worker split with zero code changes.

## One-time setup

```bash
# 1. DNS (Hostinger DNS panel) — A records pointing at the VPS IP:
#    api.<your-domain>  →  <VPS-IP>
#    app.<your-domain>  →  <VPS-IP>

# 2. Base packages (on the VPS, as root)
apt update && apt -y upgrade
curl -fsSL https://get.docker.com | sh          # Docker + compose plugin
apt -y install caddy postgresql-client          # TLS proxy + migrate runner

# 3. Firewall — only what must be public
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable

# 4. Code + env
git clone https://github.com/tanmayscuderia/Calling-Agent.git /opt/calling-agent
cd /opt/calling-agent
cp .env.example .env                            # then edit (next step)
```

`.env` on the VPS — same values as local, EXCEPT:

```bash
PUBLIC_BASE_URL=https://api.<your-domain>       # no ngrok anymore
REDIS_URL=                                      # leave unset — compose injects it
```

## Migrations (once, then per release)

`DATABASE_URL` works from anywhere — run from your dev machine OR the VPS
(needs `postgresql-client`, installed above):

```bash
cd backend
npm run migrate -- --baseline   # FIRST TIME ONLY: records the 14 legacy files
npm run migrate                 # applies anything pending (e.g. do_not_call)
```

## Launch

```bash
docker compose up -d --build    # builds backend/worker/frontend, starts redis
docker compose ps               # all healthy?
curl -s localhost:4000/health   # {"ok":true,...}
```

## TLS (Caddy, automatic Let's Encrypt)

`/etc/caddy/Caddyfile`:

```
api.<your-domain> {
    reverse_proxy 127.0.0.1:4000
}
app.<your-domain> {
    reverse_proxy 127.0.0.1:3000
}
```

```bash
systemctl reload caddy          # certificates issue automatically on first hit
```

## Post-deploy cutover checklist

- [ ] `curl https://api.<your-domain>/health` → `{"ok":true}`
- [ ] `https://app.<your-domain>` → login works
- [ ] **Sarvam dashboard:** update Hook #1, Hook #2 and the on_end webhook
      URLs from the ngrok URL to `https://api.<your-domain>/...` (same paths
      and secrets — only the host changes)
- [ ] WhatsApp: dashboard → connect → scan QR (fresh server = fresh session)
- [ ] Send one WhatsApp message + place one test call → verify CRM rows
- [ ] `docker compose logs worker | grep KV` → `mode=redis`

## Update flow (per release)

```bash
cd /opt/calling-agent
git pull
cd backend && npm run migrate && cd ..     # apply new SQL, if any
docker compose up -d --build               # rebuild + rolling-recreate
docker image prune -f                      # keep disk tidy
```

WhatsApp survives the restart (volume). Downtime ≈ the build + container
restart window (a few minutes; use `docker compose build` first, then
`up -d`, for near-zero downtime).

## Backups & ops

- **Database:** Supabase (managed) — enable their daily backups in the
  dashboard; the VPS holds no DB state.
- **WhatsApp session** (only real VPS state):
  `docker run --rm -v calling-agent_wa-sessions:/data -v $PWD:/backup alpine \
   tar czf /backup/wa-sessions-$(date +%F).tgz -C /data .`
- **Logs:** `docker compose logs -f backend` (or `worker` / `frontend`);
  `docker stats` for live memory. `/health` and `/api/system/status` are the
  probe endpoints (uptime monitor optional).
- **Rollback:** `git checkout <previous-tag> && docker compose up -d --build`.
