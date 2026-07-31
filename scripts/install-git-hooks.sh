#!/bin/bash
# Installs the pre-push secret-scan hook into .git/hooks.
# The hook applies laila-judgment §7 at the last possible boundary: it scans
# every commit about to leave the machine and blocks the push on a hit.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK="$ROOT/.git/hooks/pre-push"

cat > "$HOOK" <<'HOOK_EOF'
#!/bin/bash
# pre-push: scan outgoing commits for secret patterns (hex 32-64, sk-*, long
# base64). Blocks the push on any hit. Bypass ONLY for a verified false
# positive: git push --no-verify (and consider excluding the file below).
SECRET_RE='[a-fA-F0-9]{32,64}|sk-[A-Za-z0-9_-]{16,}|[A-Za-z0-9+/]{60,}={0,2}'
# Git's null SHA, built without a literal 40-hex run so this hook's own
# installer survives the scan it performs.
Z=$(printf '0%.0s' {1..40})
fail=0
while read -r _local_ref local_sha _remote_ref remote_sha; do
  [ "$local_sha" = "$Z" ] && continue            # branch deletion
  if [ "$remote_sha" = "$Z" ]; then range="$local_sha"; else range="$remote_sha..$local_sha"; fi
  hits=$(git diff "$range" -U0 -- . ':!*package-lock.json' ':!state/security-audit-last.json' 2>/dev/null | grep "^+" \
    | grep -IoE "$SECRET_RE" | sort -u)
  if [ -n "$hits" ]; then
    echo "pre-push BLOCKED: secret-shaped strings in outgoing commits:" >&2
    echo "$hits" | while IFS= read -r h; do echo "  ${h:0:12}…" >&2; done
    echo "Verify each hit. Real secret → remove, rewrite history, ROTATE the key." >&2
    fail=1
  fi
done
exit $fail
HOOK_EOF

chmod +x "$HOOK"
echo "Installed $HOOK"
