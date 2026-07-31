#!/bin/bash
# Nightly Memory Consolidation
# Reviews recent daily notes, extracts durable insights via a headless Claude
# session, and updates knowledge/ files. Runs at 2am via LaunchAgent
# (launchagents/com.lailaos.nightly-consolidation.plist.template).
#
# Pattern: git pull -> headless `claude --print` over the day's notes ->
# archive old notes -> commit + push -> healthcheck ping.
#
# SECURITY NOTE: this job auto-commits and auto-pushes the checked-out branch.
# Any secret sitting on disk inside a committed path reaches your remote within
# a day. .gitignore is the only control — keep .env ignored and never write
# credentials into state/ or knowledge/.
set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────
LAILA_OS_ROOT="${LAILA_OS_ROOT:-$HOME/laila-os}"
LOG_FILE="/tmp/lailaos-consolidation.log"

# shellcheck disable=SC1091
source "$LAILA_OS_ROOT/.env" 2>/dev/null || true
export LAILA_OS_ROOT

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

if [ -f "$LOG_FILE" ] && [ "$(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)" -gt 2000 ]; then
    tail -1000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi

log "=== Nightly consolidation starting ==="
trap 'log "ERROR: script failed at line $LINENO"' ERR

# ─── Sync from remote (pick up other machines' sessions) ─────────────────────
# Operate on whatever branch is checked out — NOT hardcoded main. If a feature
# branch is left checked out on an always-on node, hardcoding main strands the
# consolidation commits on the feature branch while `push origin main` silently
# no-ops. Use the current branch everywhere.
cd "$LAILA_OS_ROOT"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "main" ]; then
    log "WARNING: not on main (on '$CURRENT_BRANCH') — will commit and push to '$CURRENT_BRANCH'"
fi
git pull --rebase --autostash origin "$CURRENT_BRANCH" >> "$LOG_FILE" 2>&1 \
    || log "WARNING: git pull failed, continuing with local state"

# ─── Anything to consolidate? ────────────────────────────────────────────────
TARGET_DATE="$(date '+%Y-%m-%d')"
NOTE_FILE="$LAILA_OS_ROOT/state/daily-notes/$TARGET_DATE.md"
YESTERDAY_NOTE="$(ls -1 "$LAILA_OS_ROOT/state/daily-notes/"*.md 2>/dev/null | tail -1 || true)"
if [ ! -f "$NOTE_FILE" ] && [ -z "$YESTERDAY_NOTE" ]; then
    log "No daily notes found — nothing to consolidate"
    [ -n "${HC_NIGHTLY_CONSOLIDATION_URL:-}" ] && \
        curl -fsS -m 10 --retry 3 "$HC_NIGHTLY_CONSOLIDATION_URL" > /dev/null 2>&1 || true
    exit 0
fi

# ─── Headless Claude consolidation pass ──────────────────────────────────────
# --allowedTools is REQUIRED: a headless `claude --print` run silently denies
# every tool call without it. See docs/headless-sessions.md.
PROMPT="You are Laila running the nightly memory consolidation for Laila-OS
(repo at $LAILA_OS_ROOT, which is your working directory).

1. Read the most recent daily note(s) in state/daily-notes/.
2. Extract durable facts, decisions, and lessons:
   - entity changes -> update knowledge/entities/<entity>.md
   - decisions -> append to knowledge/decisions/$(date '+%Y-%m').md
   - reusable lessons/preferences -> knowledge/tacit/
3. Do NOT invent content. Only consolidate what the notes actually say.
4. Never write secrets, tokens, or credentials into any file.
5. Finish by printing exactly one line: CONSOLIDATED:<one-line summary>
   or NONE if there was nothing durable to extract."

RESULT=$(claude --print --model sonnet \
    --allowedTools "Read,Glob,Grep,Edit,Write" \
    <<< "$PROMPT" 2>> "$LOG_FILE" | tail -1) || {
    log "ERROR: headless consolidation session failed"
    RESULT="SCRIPT_FAILED"
}

if [[ "$RESULT" == CONSOLIDATED:* ]]; then
    log "Consolidation complete: ${RESULT#CONSOLIDATED:}"
elif [[ "$RESULT" == "NONE" ]]; then
    log "No consolidation needed."
else
    log "WARNING: unexpected result: $RESULT"
fi

# ─── Archive daily notes older than 7 days ───────────────────────────────────
ARCHIVE_DIR="$LAILA_OS_ROOT/state/daily-notes/archive"
mkdir -p "$ARCHIVE_DIR"
find "$LAILA_OS_ROOT/state/daily-notes" -maxdepth 1 -name "*.md" -mtime +7 \
    -exec mv {} "$ARCHIVE_DIR/" \; 2>/dev/null || true

# ─── Commit + push consolidated changes ──────────────────────────────────────
cd "$LAILA_OS_ROOT"
git add knowledge/ state/daily-notes/ 2>/dev/null || true
if ! git diff --cached --quiet 2>/dev/null; then
    git commit -m "Nightly consolidation ($(date '+%Y-%m-%d'))" >> "$LOG_FILE" 2>&1
    git push origin "HEAD:$CURRENT_BRANCH" >> "$LOG_FILE" 2>&1 || log "WARNING: git push failed"
    log "Pushed consolidation changes to $CURRENT_BRANCH"
fi

# ─── Healthcheck (dead-man switch) ───────────────────────────────────────────
if [ -n "${HC_NIGHTLY_CONSOLIDATION_URL:-}" ]; then
    if [ "$RESULT" = "SCRIPT_FAILED" ]; then
        curl -fsS -m 10 --retry 3 "$HC_NIGHTLY_CONSOLIDATION_URL/fail" > /dev/null 2>&1 || true
    else
        curl -fsS -m 10 --retry 3 "$HC_NIGHTLY_CONSOLIDATION_URL" > /dev/null 2>&1 || true
    fi
fi

log "=== Nightly consolidation complete ==="
