#!/bin/bash
# Send a notification to the appropriate Telegram group.
# Used by heartbeat, nightly consolidation, and other background scripts.
#
# Usage: telegram-notify.sh <domain> <message>
#   domain:  a key in config/telegram-groups.json (career, health, ...) or "default"
#   message: text to send (Telegram Markdown supported)
#
# Chat IDs never live in the repo. config/telegram-groups.json maps each domain
# to the NAME of an environment variable; this script resolves that name against
# the environment (loaded from .env). Unknown domains fall back to "default",
# which resolves to $TELEGRAM_CHAT_ID.
set -euo pipefail

LAILA_OS_ROOT="${LAILA_OS_ROOT:-$HOME/laila}"
CONFIG="$LAILA_OS_ROOT/config/telegram-groups.json"

# Source env for the bot token + chat IDs (see .env.example).
# shellcheck disable=SC1091
source "$LAILA_OS_ROOT/.env" 2>/dev/null || true

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
    echo "ERROR: TELEGRAM_BOT_TOKEN not set" >&2
    exit 1
fi

DOMAIN="${1:-default}"
MESSAGE="${2:-}"

if [ -z "$MESSAGE" ]; then
    echo "Usage: telegram-notify.sh <domain> <message>" >&2
    exit 1
fi

# Resolve domain -> env var name -> chat id. Missing config file just means
# everything routes to the default chat.
ENV_VAR="TELEGRAM_CHAT_ID"
if [ -f "$CONFIG" ]; then
    ENV_VAR=$(python3 - "$CONFIG" "$DOMAIN" <<'PY'
import json, sys
config = json.load(open(sys.argv[1]))
domain = sys.argv[2]
entry = config.get(domain) or config.get("default") or {}
print(entry.get("chat_id_env", "TELEGRAM_CHAT_ID"))
PY
    ) || ENV_VAR="TELEGRAM_CHAT_ID"
fi

CHAT_ID="${!ENV_VAR:-${TELEGRAM_CHAT_ID:-}}"

if [ -z "$CHAT_ID" ]; then
    echo "WARNING: no chat id configured for domain '$DOMAIN' (env $ENV_VAR unset)" >&2
    exit 0  # notification is best-effort — never fail the caller
fi

# Send via the Telegram Bot API. --data-urlencode protects & and % in the
# message; check .ok in the response so API errors (e.g. Markdown parse
# failures) are not reported as sent. On failure, retry once without
# parse_mode — a Markdown parse failure is the common cause.
send() {
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        --data-urlencode "chat_id=${CHAT_ID}" \
        --data-urlencode "text=${MESSAGE}" \
        "$@" 2>/dev/null || true
}

RESPONSE=$(send --data-urlencode "parse_mode=Markdown")
OK=$(printf '%s' "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('ok', False))" 2>/dev/null || echo "False")

if [ "$OK" != "True" ]; then
    RESPONSE=$(send)
    OK=$(printf '%s' "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('ok', False))" 2>/dev/null || echo "False")
fi

if [ "$OK" = "True" ]; then
    echo "Sent to ${DOMAIN}"
else
    echo "ERROR: Telegram send failed for ${DOMAIN}: $(printf '%s' "$RESPONSE" | head -c 200)" >&2
    exit 1
fi
