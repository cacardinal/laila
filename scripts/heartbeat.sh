#!/bin/bash
# Laila-OS Heartbeat wrapper.
# Runs scripts/heartbeat.py every 30 minutes (see launchagents/), routes alerts
# to Telegram, and pings the healthchecks.io dead-man switch.
#
# State: state/active-tasks.json, state/heartbeat-last.json
set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────
LAILA_OS_ROOT="${LAILA_OS_ROOT:-$HOME/laila-os}"
LOG_FILE="/tmp/lailaos-heartbeat.log"

# Source env for the Telegram token and healthcheck URL (see .env.example).
# shellcheck disable=SC1091
source "$LAILA_OS_ROOT/.env" 2>/dev/null || true
export LAILA_OS_ROOT

# ─── Logging ─────────────────────────────────────────────────────────────────
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Rotate log (keep last ~1000 lines once it passes 2000)
if [ -f "$LOG_FILE" ] && [ "$(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)" -gt 2000 ]; then
    tail -1000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi

log "=== Heartbeat starting ==="
trap 'log "ERROR: script failed at line $LINENO"' ERR

# ─── Nothing to do? Still ping the dead-man switch. ─────────────────────────
if [ ! -f "$LAILA_OS_ROOT/state/active-tasks.json" ]; then
    log "No active-tasks.json — nothing to check"
    if [ -n "${HC_HEARTBEAT_URL:-}" ]; then
        curl -fsS -m 10 --retry 3 "$HC_HEARTBEAT_URL" > /dev/null 2>&1 || true
    fi
    exit 0
fi

# ─── Main ────────────────────────────────────────────────────────────────────
HEARTBEAT_FAILED=0
RESULT=$(python3 "$LAILA_OS_ROOT/scripts/heartbeat.py" 2>> "$LOG_FILE") || {
    log "ERROR: heartbeat.py failed (exit $?)"
    RESULT="SCRIPT_FAILED"
}

# ─── Process results ─────────────────────────────────────────────────────────
if [[ "$RESULT" == CHECKED:* ]]; then
    log "Heartbeat: ${RESULT#CHECKED:}"
elif [[ "$RESULT" == ALERT:* ]]; then
    alert="${RESULT#ALERT:}"
    log "ALERT: $alert"
    # Route to the Telegram group for the alerting domain ([DOMAIN] prefix).
    ALERT_DOMAIN=$(echo "$alert" | sed -n 's/^\[\([^]]*\)\].*/\1/p' | tr '[:upper:]' '[:lower:]' 2>/dev/null || echo "default")
    [ -z "$ALERT_DOMAIN" ] && ALERT_DOMAIN="default"
    "$LAILA_OS_ROOT/scripts/telegram-notify.sh" "$ALERT_DOMAIN" "*Heartbeat Alert*
$alert" 2>> "$LOG_FILE" || true
elif [[ "$RESULT" == "NONE" ]]; then
    log "No active tasks to check."
elif [[ "$RESULT" == "SCRIPT_FAILED" ]]; then
    # The core failed — alert and hit the /fail endpoint so the
    # monitor-of-monitors cannot fail silently.
    HEARTBEAT_FAILED=1
    log "ERROR: heartbeat.py failed — alerting Telegram, pinging /fail"
    "$LAILA_OS_ROOT/scripts/telegram-notify.sh" default "*Heartbeat Alert*
heartbeat.py failed — check $LOG_FILE" 2>> "$LOG_FILE" || true
else
    log "Heartbeat result: $RESULT"
fi

# ─── Healthcheck (dead-man switch) ───────────────────────────────────────────
if [ -n "${HC_HEARTBEAT_URL:-}" ]; then
    if [ "$HEARTBEAT_FAILED" -eq 1 ]; then
        curl -fsS -m 10 --retry 3 "$HC_HEARTBEAT_URL/fail" > /dev/null 2>&1 || true
    else
        curl -fsS -m 10 --retry 3 "$HC_HEARTBEAT_URL" > /dev/null 2>&1 || true
    fi
fi

log "=== Heartbeat complete ==="
