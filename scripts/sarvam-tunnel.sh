#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Sarvam tunnel — stable public URL for the backend (webhooks + live-call tools)
#
# WHY: the free `cloudflared tunnel --url` quick tunnel (trycloudflare.com) is
# test-only and Cloudflare rate-limits its edge. Symptom: live calls where the
# first 2-3 tool requests work, then tools "break" — while backend logs show
# every request that ARRIVED returned 200 (the throttled ones never reach us).
#
# DEFAULT PROVIDER: ngrok FREE static domain (no domain purchase, no card).
#   Static URL forever, ~1 req/sec sustained limit (our peak: 5 req/min).
#   Non-browser traffic (Sarvam webhooks / python-httpx, curl) never sees the
#   ngrok browser-warning page.
#
# Usage:
#   ./scripts/sarvam-tunnel.sh start    # ngrok on the static domain (default)
#   ./scripts/sarvam-tunnel.sh stop     # stop ngrok
#   ./scripts/sarvam-tunnel.sh url      # print the stable public URL
#   ./scripts/sarvam-tunnel.sh status   # is it running?
#
#   ./scripts/sarvam-tunnel.sh cf-setup # LATER: named Cloudflare tunnel on
#   ./scripts/sarvam-tunnel.sh cf-start #   your own domain (zero rate limits)
#   (cf-url / cf-stop / cf-status also exist)
#
# After `start`, the URL goes into:
#   1. .env  → PUBLIC_BASE_URL=https://<static-domain>  (+ restart backend)
#   2. Sarvam dashboard → agent webhook URL + both tool URLs
# The URL NEVER changes across restarts.
#
# One-time ngrok setup (already done 2026-08-21):
#   ngrok config add-authtoken <token-from-dashboard>
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── ngrok (default) ─────────────────────────────────────────────────────────
NGROK_DOMAIN="${SARVAM_NGROK_DOMAIN:-pumice-craving-outweigh.ngrok-free.dev}"
LOCAL_PORT="${SARVAM_TUNNEL_PORT:-4000}"
NGROK_PID_FILE="/tmp/sarvam-ngrok.pid"
NGROK_LOG_FILE="/tmp/sarvam-ngrok.log"
NGROK_API="http://127.0.0.1:4040"   # ngrok's local inspection API

# ── cloudflared (optional, own domain later) ────────────────────────────────
TUNNEL_NAME="calling-agent"
CF_DIR="$HOME/.cloudflared"
CONFIG_FILE="$CF_DIR/config.yml"
PID_FILE="/tmp/sarvam-tunnel.pid"
LOG_FILE="/tmp/cloudflared-named.log"
SUBDOMAIN="${SARVAM_TUNNEL_SUBDOMAIN:-}"

PUBLIC_URL="https://$NGROK_DOMAIN"

print_usage_hints() {
  echo "  webhook: $PUBLIC_URL/webhooks/sarvam/\$SARVAM_WEBHOOK_SECRET"
  echo "  tools:   $PUBLIC_URL/api/tools/sarvam/{lead-context,inventory-search}"
}

cmd_start() {
  command -v ngrok >/dev/null 2>&1 || {
    echo "❌ ngrok not found. Install: brew install ngrok"
    exit 1
  }
  if curl -s -o /dev/null --max-time 2 "$NGROK_API/api/tunnels"; then
    echo "✅ ngrok already running"
    cmd_url
    exit 0
  fi
  echo "🚀 Starting ngrok → localhost:$LOCAL_PORT on static domain $NGROK_DOMAIN (log: $NGROK_LOG_FILE)"
  nohup ngrok http --url="$NGROK_DOMAIN" "$LOCAL_PORT" --log=stdout > "$NGROK_LOG_FILE" 2>&1 &
  echo $! > "$NGROK_PID_FILE"
  # wait for the local API to come up (tunnel established)
  for _ in $(seq 1 15); do
    curl -s -o /dev/null --max-time 2 "$NGROK_API/api/tunnels" && break
    sleep 1
  done
  if curl -s -o /dev/null --max-time 2 "$NGROK_API/api/tunnels"; then
    echo "✅ Running (pid $(cat "$NGROK_PID_FILE"))"
    cmd_url
  else
    echo "❌ Tunnel did not come up — check $NGROK_LOG_FILE"
    exit 1
  fi
}

cmd_url() {
  echo "$PUBLIC_URL"
  print_usage_hints
}

cmd_stop() {
  if [[ -f "$NGROK_PID_FILE" ]] && kill "$(cat "$NGROK_PID_FILE")" 2>/dev/null; then
    rm -f "$NGROK_PID_FILE"
    echo "🛑 ngrok stopped."
  else
    rm -f "$NGROK_PID_FILE"
    pkill -f "ngrok http --url=$NGROK_DOMAIN" 2>/dev/null || true
    echo "Not running."
  fi
}

cmd_status() {
  if curl -s -o /dev/null --max-time 2 "$NGROK_API/api/tunnels"; then
    echo "running — $PUBLIC_URL"
    return 0
  fi
  echo "not running"
  return 1
}

# ── cloudflared named-tunnel commands (own domain, later) ───────────────────
get_creds() {
  if [[ ! -f "$CF_DIR/cert.pem" ]]; then
    echo "❌ No Cloudflare credentials at $CF_DIR/cert.pem"
    echo "   Run: ./scripts/sarvam-tunnel.sh cf-setup"
    exit 1
  fi
}

cf_setup() {
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

  echo "👉 Step 3/3: Writing $CONFIG_FILE"
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
  echo "   2. Add the DNS route (one-time):"
  echo "         cloudflared tunnel route dns $TUNNEL_NAME ${SUBDOMAIN:-$TUNNEL_NAME}.YOUR_DOMAIN_HERE"
  echo "   Then: ./scripts/sarvam-tunnel.sh cf-start && ./scripts/sarvam-tunnel.sh cf-url"
}

cf_start() {
  get_creds
  if cf_status >/dev/null 2>&1; then
    echo "✅ Tunnel already running (pid $(cat "$PID_FILE"))"
    exit 0
  fi
  echo "🚀 Starting named tunnel '$TUNNEL_NAME' → localhost:$LOCAL_PORT (log: $LOG_FILE)"
  nohup cloudflared tunnel --config "$CONFIG_FILE" run > "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"
  sleep 3
  if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "✅ Running (pid $(cat "$PID_FILE")). Public URL:"
    cf_url
  else
    echo "❌ Died immediately — check $LOG_FILE"
    exit 1
  fi
}

cf_url() {
  TUNNEL_ID="$(cloudflared tunnel list -o json 2>/dev/null \
    | /usr/bin/python3 -c "import json,sys; ls=json.load(sys.stdin); print(next((t['id'] for t in ls if t['name']=='$TUNNEL_NAME'), ''))" \
    || true)"
  HOST_LINE="$(grep -m1 'hostname:' "$CONFIG_FILE" 2>/dev/null | awk '{print $2}')"
  if [[ -n "$TUNNEL_ID" && -n "$HOST_LINE" && "$HOST_LINE" != *YOUR_DOMAIN_HERE* ]]; then
    echo "https://$HOST_LINE"
    echo "  → webhook: https://$HOST_LINE/webhooks/sarvam/\$SARVAM_WEBHOOK_SECRET"
    echo "  → tools:   https://$HOST_LINE/api/tools/sarvam/{lead-context,inventory-search}"
  else
    echo "⚠️  Hostname not configured yet — run ./scripts/sarvam-tunnel.sh cf-setup" >&2
    exit 1
  fi
}

cf_stop() {
  if [[ -f "$PID_FILE" ]] && kill "$(cat "$PID_FILE")" 2>/dev/null; then
    rm -f "$PID_FILE"
    echo "🛑 Stopped."
  else
    rm -f "$PID_FILE"
    echo "Not running."
  fi
}

cf_status() {
  [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

case "${1:-}" in
  start)    cmd_start ;;
  stop)     cmd_stop ;;
  url)      cmd_url ;;
  status)   cmd_status ;;
  cf-setup)  cf_setup ;;
  cf-start)  cf_start ;;
  cf-url)    cf_url ;;
  cf-stop)   cf_stop ;;
  cf-status) cf_status && echo "running (pid $(cat "$PID_FILE"))" || echo "not running" ;;
  *)        grep '^#' "$0" | sed 's/^# \{0,1\}//;1d' | head -30; exit 1 ;;
esac