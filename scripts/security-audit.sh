#!/bin/bash
# Laila security audit loop (monthly by default; also run before any publish).
# Implements the secret-scan discipline from skills/laila-judgment §7:
#   1. Scan the diff against the last-AUDITED base, not just recent commits
#   2. Secret patterns: hex 32-64 INCLUSIVE, sk-*, long base64
#   3. Plus repo hygiene: env files untracked, permissions, private-key material
# State: state/security-audit-last.json records the audited base SHA.
# Exit 0 = clean (advance the base), 1 = findings (base NOT advanced).
set -uo pipefail

ROOT="${LAILA_OS_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$ROOT" || exit 2
STATE_FILE="state/security-audit-last.json"
[ -f ".env" ] && set -a && . ./.env && set +a

SECRET_RE='[a-fA-F0-9]{32,64}|sk-[A-Za-z0-9_-]{16,}|[A-Za-z0-9+/]{60,}={0,2}'
FINDINGS=""
note() { FINDINGS="${FINDINGS}FINDING: $1
"; }

# ── 1. Diff scan vs last-audited base ────────────────────────────────────────
BASE=$(python3 -c "import json;print(json.load(open('$STATE_FILE'))['audited_base'])" 2>/dev/null || echo "")
HEAD_SHA=$(git rev-parse HEAD)
# security-audit-last.json is excluded because it definitionally stores a
# 40-hex commit SHA — the one string this scanner must not flag itself on.
EXCL=(':!*package-lock.json' ':!state/security-audit-last.json')
if [ -z "$BASE" ] || ! git cat-file -e "$BASE" 2>/dev/null; then
  # First run (or base lost): scan the entire current tree instead of a diff.
  HITS=$(git grep -IhoE "$SECRET_RE" -- . "${EXCL[@]}" 2>/dev/null | sort -u)
else
  HITS=$(git diff "$BASE"..HEAD -U0 -- . "${EXCL[@]}" | grep "^+" \
    | grep -IoE "$SECRET_RE" | sort -u)
fi
if [ -n "$HITS" ]; then
  # Cross-check against untracked env values (presence only — never print values).
  while IFS= read -r hit; do
    if [ -f ".env" ] && grep -qF "$hit" .env; then
      note "secret-pattern hit MATCHES a value in .env — treat as a live leak, rotate the key"
    else
      note "secret-pattern hit in commits since audited base: ${hit:0:8}… (verify manually)"
    fi
  done <<< "$HITS"
fi

# ── 2. Env hygiene ───────────────────────────────────────────────────────────
TRACKED_ENV=$(git ls-files | grep -E '(^|/)\.env(\..*)?$' | grep -v '\.example$')
[ -n "$TRACKED_ENV" ] && note "env file is TRACKED by git: $TRACKED_ENV"
git check-ignore -q .env || note ".gitignore does not cover .env"
if [ -f ".env" ]; then
  PERMS=$(stat -f "%Lp" .env 2>/dev/null || stat -c "%a" .env 2>/dev/null)
  [ "$PERMS" != "600" ] && note ".env permissions are $PERMS (want 600: chmod 600 .env)"
fi

# ── 3. Key material in the tree ──────────────────────────────────────────────
# Pattern assembled from two halves so this script's own source never contains
# the contiguous literal and can't flag itself.
KEY_PAT="BEGIN .*PRIVATE K""EY"
KEYS=$(git grep -Il "$KEY_PAT" -- . 2>/dev/null)
[ -n "$KEYS" ] && note "private-key material tracked in: $KEYS"

# ── 4. Guard rails present (skipped in CI — runners never have local hooks) ──
if [ -z "${CI:-}" ]; then
  [ -x ".git/hooks/pre-push" ] || note "pre-push secret-scan hook not installed (scripts/install-git-hooks.sh)"
fi

# ── Report ───────────────────────────────────────────────────────────────────
if [ -n "$FINDINGS" ]; then
  echo "SECURITY AUDIT: findings (base NOT advanced)"
  printf '%s' "$FINDINGS"
  [ -x "scripts/telegram-notify.sh" ] && scripts/telegram-notify.sh default "[SECURITY] Audit findings:
$(printf '%s' "$FINDINGS" | head -c 800)"
  [ -n "${HC_SECURITY_AUDIT_URL:-}" ] && curl -fsS -m 10 "${HC_SECURITY_AUDIT_URL}/fail" >/dev/null 2>&1
  exit 1
fi

python3 - "$STATE_FILE" "$HEAD_SHA" <<'EOF'
import json, sys, datetime
json.dump({"audited_base": sys.argv[2],
           "audited_at": datetime.datetime.now().astimezone().isoformat(timespec="seconds")},
          open(sys.argv[1], "w"), indent=2)
EOF
echo "SECURITY AUDIT: clean — audited base advanced to $HEAD_SHA"
[ -n "${HC_SECURITY_AUDIT_URL:-}" ] && curl -fsS -m 10 "$HC_SECURITY_AUDIT_URL" >/dev/null 2>&1
exit 0
