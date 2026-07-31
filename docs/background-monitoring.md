# Background Monitoring — Full Reference

Every background job in Laila-OS runs as a macOS LaunchAgent (see
`launchagents/README.md` for install + headless gotchas). This doc covers the
three patterns that keep those loops honest — the loops registry, the
dead-man switch, and the heartbeat — then describes the sample loops.

## Pattern 1: The loops registry

`state/loops-registry.json` is a machine-readable inventory of every installed
loop: label, script, schedule, last run, status. Anything that wants a
system-overview (a dashboard tab, the daily brief's infrastructure section, a
watchdog) reads this one file instead of re-deriving state from launchd.

Two rules make it work:

- **It is generated, never hand-edited.** A small generator script enumerates
  the installed `com.lailaos.*` plists, cross-references each loop's
  `state/<loop>-last.json` (or log mtime) for last-run info, and rewrites the
  registry. Run it at the end of the heartbeat so the registry refreshes every
  30 minutes for free. (This example repo ships the registry with sample data;
  the generator is yours to write against your installed plists.)
- **Registry drift is itself a finding.** A plist installed under
  `~/Library/LaunchAgents/` with no matching template in `launchagents/` means
  the repo no longer describes the machine — flag it.

A useful extension is a **loop watchdog**: a check (run inside the heartbeat)
that walks the registry and alerts when any loop's status is `not_loaded`,
`error`, or its last run is far beyond its schedule. Without this, a loop that
silently dies stays dead until a human happens to notice its output missing.

## Pattern 2: The healthchecks.io dead-man switch

A broken loop produces no error — it produces *silence*. Local logs can't
catch silence, so every scheduled script ends by pinging a
[healthchecks.io](https://healthchecks.io) check URL:

```bash
if [ -n "${HC_HEARTBEAT_URL:-}" ]; then
    curl -fsS -m 10 --retry 3 "$HC_HEARTBEAT_URL" > /dev/null 2>&1 || true
fi
```

- One check per loop, each with a grace period slightly longer than its
  schedule. If the ping stops arriving, healthchecks.io emails/notifies you.
- Ping URLs live in `.env` as `HC_*` variables (see `.env.example`). Scripts
  no-op the ping when the variable is empty, so the system runs fine without
  healthchecks — you just lose external coverage.
- **Ping semantics matter.** Decide per loop whether the ping means "the
  script ran" (ping always, append `/fail` on failure — a missed ping means
  the loop itself died) or "the system is healthy" (ping only on success — a
  missed ping means the loop died OR the thing it watches is down). Document
  the choice; it changes how you read an alert at 6am.

## Pattern 3: The heartbeat

The heartbeat is the monitor-of-monitors: a 30-minute loop that checks
*work*, not infrastructure.

**LaunchAgent:** `com.lailaos.heartbeat` — **Script:** `scripts/heartbeat.sh`
+ `scripts/heartbeat.py` — **State:** `state/active-tasks.json`,
`state/heartbeat-last.json`

Each task in `state/active-tasks.json` has an `owner` (`alex` = Alex works,
Laila reminds; `laila` = Laila monitors/executes) and a `check_method`
(`manual` staleness, `git_branch` commit activity — extensible). Stale or
completed work raises an alert that:

1. routes to the right Telegram group via `scripts/telegram-notify.sh`
   (the `[DOMAIN]` prefix on the alert picks the group), and
2. is appended to today's daily note so the next interactive session sees it.

Design details worth copying:

- **Corrupt state quarantines, never crash-loops.** A corrupt JSON state file
  is renamed aside with a timestamp (`active-tasks.json.20260731-090000.corrupt`)
  and the run continues with defaults — but skips the save so the evidence is
  never overwritten by an empty default.
- **Atomic writes.** All state saves go temp-file-then-rename so a crash
  mid-write never truncates state.
- **Completed tasks are archived, not deleted.** Terminal tasks move to a
  `completed` array with a `completed_at` stamp, so IDs are never reused and
  "what finished today" is answerable.
- **Alerts outrank NONE.** The output protocol (`CHECKED:` / `ALERT:` /
  `NONE`) prints alerts first — an alert must never be swallowed by an
  empty-task-list shortcut.

## The sample loops

| Loop | Schedule | Script | Purpose |
| --- | --- | --- | --- |
| Daily Brief | daily 7:00am | `scripts/daily-brief.sh` (yours — see `docs/headless-sessions.md`) | Headless Claude session assembles the morning brief and sends it to Telegram |
| Nightly Consolidation | daily 2:00am | `scripts/nightly-consolidation.sh` | Headless Claude reviews daily notes, updates `knowledge/`, commits + pushes |
| Task Heartbeat | every 30 min | `scripts/heartbeat.sh` | Active-task staleness/completion checks, Telegram alerts |
| Comms Poll | every 10 min | `scripts/comms-poll.sh` (yours) | Fetch new email/message metadata, triage, update the comms queue |
| Security Audit | monthly (1st, 06:30) | `scripts/security-audit.sh` | Diff-scan commits since the last audited base for secret patterns (hex 32-64, sk-*, long base64); env hygiene; verify the pre-push hook is installed. Findings hold the audited base and page the command channel |

Registry: `state/loops-registry.json`. Healthcheck vars: `HC_HEARTBEAT_URL`,
`HC_NIGHTLY_CONSOLIDATION_URL`, `HC_DAILY_BRIEF_URL` in `.env`.

## Adding a loop — checklist

1. Write the script pair: a `scripts/<name>.sh` wrapper (env sourcing, logging,
   log rotation, result handling, healthcheck ping) around a
   `scripts/<name>.py` core with a strict stdout protocol
   (`OK:`/`ALERT:`/`NONE`/`ERROR:`). The wrapper owns side effects; the core
   stays testable.
2. Add `launchagents/com.lailaos.<name>.plist.template`; install per
   `launchagents/README.md`.
3. Create a healthchecks.io check; add `HC_<NAME>_URL` to `.env` and
   `.env.example`.
4. Regenerate (or update) `state/loops-registry.json`.
5. Document it here.
