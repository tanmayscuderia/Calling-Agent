#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Sarvam tunnel — named Cloudflare tunnel (STABLE URL, no quick-tunnel throttle)
#
# WHY: the free `cloudflared tunnel --url` quick tunnel (trycloudflare.com) is
# test-only and Cloudflare rate-limits its edge. Symptom: live calls where the
# first 2-3 tool requests work, then tools "break" — while backend logs show
# every request that ARRIVED returned 200 (the throttled ones never reach us).
# A named tunnel (free Cloudflare account + a domain on it) gets a permanent
# hostname and production-grade edge treatment.
#
# Usage:
#   ./scripts/sarvam-tunnel.sh setup    # one-time: login, create tunnel, config
#   ./scripts/sarvam-tunnel.sh start    # run tunnel in background
#   ./scripts/sarvam-tunnel.sh url      # print the stable public URL
#   ./scripts/sarvam-tunnel.sh stop     # stop a running tunnel
#   ./scripts/sarvam-tunnel.sh status   # is it running?
#
# After `setup` + `start`, put the printed URL into:
#   1. .env  → PUBLIC_BASE_URL=https://<your-subdomain>.<your-domain>  (+ restart backend)
#   2. Sarvam dashboard → agent webhook URL + both tool URLs
# The URL NEVER changes across restarts — no more re-pasting after every tunnel
# restart (the quick-tunnel dance documented in SARVAM_GO_LIVE_CHECKLIST.md).
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

TUNNEL_NAME="calling-agent"
CF_DIR="$HOME/.cloudflared"
CONFIG_FILE="$CF_DIR/config.yml"
PID_FILE="/tmp/sarvam-tunnel.pid"
LOG_FILE="/tmp/cloudflared-named.log"
LOCAL_PORT="4000"

# Prefer a subdomain the user can override: SARVAM_TUNNEL_SUBDOMAIN=name ./scripts/…
SUBDOMAIN="${SARVAM_TUNNEL_SUBDOMAIN:-}"

command -v cloudflared >/dev/null 2>&1 || {
  echo "❌ cloudflared not found. Install: brew install cloudflared"
  exit 1
}

get_creds() {
  # cert.pem is created by `tunnel login` — required to create/manage tunnels
  if [[ ! -f "$CF_DIR/cert.pem" ]]; then
    echo "❌ No Cloudflare credentials at $CF_DIR/cert.pem"
    echo "   Run: ./scripts/sarvam-tunnel.sh setup"
    exit 1
  fi
}

cmd_setup() {
  echo "👉 Step 1/3: Cloudflare login (opens browser — pick the domain you want the tunnel on)"
  cloudflared tunnel login

  echo "👉 Step 2/3: Creating tunnel '$TUNNEL_NAME' (idempotent — reuses if it exists)"
  TUNNEL_ID="$(cloudflared tunnel list -o json 2>/dev/null \
    | /usr/bin/python3 -c "import json,sys; ls=json.load(sys.stdin); print(next((t['id'] for t in ls if t['name']=='$TUNNEL_NAME'), ''))" \
    || true)"
  if [[ -z "$TUNNEL_ID" ]]; then
    TUNNEL_ID="$(cloudflared tunnel create "$TUNNEL_NAME" | grep -oE '[0-9a-f-]{36}' | head -1)"
  fi
  [[ -n "$TUNNEL_ID" ]] || { echo "❌ Could not create/find tunnel"; exit 1; }
  echo "   Tunnel ID: $TUNNEL_ID"

  # Stable public hostname: <subdomain>.<domain> — subdomain defaults to tunnel name
  echo "👉 Step 3/3: Writing $CONFIG_FILE"
  echo "   (edit SUBDOMAIN there if you want a different hostname prefix)"
  mkdir -p "$CF_DIR"
  cat > "$CONFIG_FILE" <<EOF
tunnel: $TUNNEL_ID
credentials-file: $CF_DIR/$TUNNEL_ID.json
ingress:
  - hostname: ${SUBDOMAIN:-$TUNNEL_NAME}.YOUR_DOMAIN_HERE
    service: http://localhost:$LOCAL_PORT
  - service: http_status:404
EOF
  echo ""
  echo "✅ Almost done — 2 manual steps:"
  echo "   1. Edit $CONFIG_FILE → replace YOUR_DOMAIN_HERE with your Cloudflare domain"
  echo "      (keep the prefix, e.g. ${SUBDOMAIN:-$TUNNEL_NAME}.example.com)"
  echo "   2. Add the DNS route (one-time):"
  echo "         cloudflared tunnel route dns $TUNNEL_NAME ${SUBDOMAIN:-$TUNNEL_NAME}.YOUR_DOMAIN_HERE"
  echo "   Then: ./scripts/sarvam-tunnel.sh start && ./scripts/sarvam-tunnel.sh url"
}

cmd_start() {
  get_creds
  if cmd_status >/dev/null 2>&1; then
    echo "✅ Tunnel already running (pid $(cat "$PID_FILE"))"
    exit 0
  fi
  echo "🚀 Starting named tunnel '$TUNNEL_NAME' → localhost:$LOCAL_PORT (log: $LOG_FILE)"
  nohup cloudflared tunnel --config "$CONFIG_FILE" run > "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"
  sleep 3
  if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "✅ Running (pid $(cat "$PID_FILE")). Public URL:"
    cmd_url
  else
    echo "❌ Died immediately — check $LOG_FILE"
    exit 1
  fi
}

cmd_url() {
  TUNNEL_ID="$(cloudflared tunnel list -o json 2>/dev/null \
    | /usr/bin/python3 -c "import json,sys; ls=json.load(sys.stdin); print(next((t['id'] for t in ls if t['name']=='$TUNNEL_NAME'), ''))" \
    || true)"
  HOST_LINE="$(grep -m1 'hostname:' "$CONFIG_FILE" 2>/dev/null | awk '{print $2}')"
  if [[ -n "$TUNNEL_ID" && -n "$HOST_LINE" && "$HOST_LINE" != *YOUR_DOMAIN_HERE* ]]; then
    echo "https://$HOST_LINE"
    echo "  → webhook: https://$HOST_LINE/webhooks/sarvam/\$SARVAM_WEBHOOK_SECRET"
    echo "  → tools:   https://$HOST_LINE/api/tools/sarvam/{lead-context,inventory-search}"
  else
    echo "⚠️  Hostname not configured yet — run ./scripts/sarvam-tunnel.sh setup" >&2
    exit 1
  fi
}

cmd_stop() {
  if [[ -f "$PID_FILE" ]] && kill "$(cat "$PID_FILE")" 2>/dev/null; then
    rm -f "$PID_FILE"
    echo "🛑 Stopped."
  else
    rm -f "$PID_FILE"
    echo "Not running."
  fi
}

cmd_status() {
  [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

case "${1:-}" in
  setup)  cmd_setup ;;
  start)  cmd_start ;;
  url)    cmd_url ;;
  stop)   cmd_stop ;;
  status) cmd_status && echo "running (pid $(cat "$PID_FILE"))" || echo "not running" ;;
  *)      grep '^#' "$0" | sed 's/^# \{0,1\}//;1d' | head -25; exit 1 ;;
esac