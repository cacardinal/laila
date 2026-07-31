---
name: laila-ops-debugging
description: Symptom-to-fix triage runbook for the Laila operational stack — the scheduled jobs (launchd/cron), the Telegram notify pipe and command-channel bot, headless agent sessions, OAuth-backed mail/calendar reads, the dashboard server, the self-hosted CRM container, and the healthchecks.io dead-man switches. Use when infrastructure is broken or behaving strangely — "the daily brief didn't arrive", "the bot stopped responding", "a scheduled job isn't firing", "notifications stopped", "the dashboard is down", "hc-ping alerted", "headless sessions are failing", "every loop died at once", "token expired / invalid_grant", "the CRM is unreachable". NOT /os-audit (scored structural health assessment when nothing is on fire). NOT laila-headless-conduct (how headless sessions BEHAVE — this skill fixes the machinery they run on, always from an interactive session). NOT laila-judgment (general working discipline; §8 here only applies its evidence bar to outages).
---

# /laila-ops-debugging — symptom → fix triage for the operational stack

Run this from an INTERACTIVE session on the always-on machine. Headless sessions never repair their own infrastructure (laila-headless-conduct §6). Job inventory: `docs/background-monitoring.md` + `state/loops-registry.json`. Mechanics of the sessions themselves: `docs/headless-sessions.md`.

Commands below are launchd (macOS). Cron equivalents where they exist: `crontab -l` for "is it installed", `grep CRON /var/log/syslog` (or `journalctl`) for "did it fire", and the wrapper's own log for everything else — the wrapper logs in `/tmp/lailaos-*.log` are platform-neutral and are usually the fastest path on either OS.

**Where things live** (the five artifacts every section reads):

| Artifact | Path |
|---|---|
| Job definitions (source of truth) | `launchagents/*.plist.template` in the repo; installed copies in `~/Library/LaunchAgents/` (or your crontab) |
| Scheduler-captured stdout/stderr | `/tmp/lailaos-*` — the templates use two shapes (`lailaos-<name>-std{out,err}.log`, or `lailaos-<name>.log` + `lailaos-<name>.err.log`), and nightly-consolidation logs as `lailaos-consolidation-*`, not its job label — check the plist's `StandardOutPath`/`StandardErrorPath` keys |
| Wrapper's own rotating log | `/tmp/lailaos-<name>.log` — richer than the scheduler capture; read this one first |
| Secrets + ping URLs + `AGENT_RUN` | `.env` at the repo root (untracked; sourced by wrappers, never baked into plists) |
| Loop inventory + last-run state | `state/loops-registry.json` (generated — a finding here points at a loop, never gets hand-edited) |

## When NOT to use this

- Nothing is broken and you want a scored health assessment → **`/os-audit`**. Stale domain status files → a hygiene pass, not an outage.
- You ARE a headless/scheduled session wondering how to behave (send rules, credential path, failure conduct) → **laila-headless-conduct**. If that's you, also note its §6: you never repair, restart, or reload the machinery you run on — report the symptom and stop.
- General working discipline — evidence bars, tier gating, what counts as "done" → **laila-judgment**. §8 below borrows its evidence bar for outages; the rest lives there.
- The failure is in a SKILL's logic or a domain workflow, not the plumbing (the job ran, delivered, and was wrong) → debug that skill/workflow directly.

## Quick triage

| Symptom | First check | Section |
|---|---|---|
| The daily brief didn't arrive | `launchctl list \| grep lailaos`, then `/tmp/lailaos-*-stderr.log` | §1, then §3/§4 |
| A scheduled job isn't firing | Is it loaded? When did its log last change? | §1 |
| Notifications stopped (no Telegram) | One-line test send (§2) | §2 |
| Bot stopped responding to messages | Is the bot process alive? Then its `.err.log` | §1, §3 |
| EVERY headless job failing at once | Agent CLI auth (`Not logged in` in any job log) | §3 |
| A job "ran fine" but changed nothing | Missing tool grants in the headless invocation | §3 |
| Brief arrived but mail/calendar sections empty | Provider token (`invalid_grant` in the log) | §4 |
| Dashboard URL dead | `curl -s http://127.0.0.1:5175/` (your `DASHBOARD_PORT`) | §5 |
| CRM reads failing | `curl -s http://localhost:3000` → refused vs 401-ish | §6 |
| healthchecks.io alerted | Machine awake? → job loaded? → log → `HC_*` var | §7 |
| Reminders/calendar reads hang or come back empty in a job | TCC / permission barrier | §1 (TCC) |

## 1. A scheduled job didn't fire

Anatomy first (macOS: `launchagents/README.md`): the repo's `launchagents/*.plist.template` are source of truth; installed copies live in `~/Library/LaunchAgents/`. Each plist names the wrapper script, its schedule, an `EnvironmentVariables > PATH`, and `StandardOutPath`/`StandardErrorPath` — log names come in two shapes across the templates (`/tmp/lailaos-<name>-std{out,err}.log` for the brief/heartbeat/consolidation class; `/tmp/lailaos-<name>.log` + `/tmp/lailaos-<name>.err.log` for dashboard/security-audit/telegram-bot), and nightly-consolidation's logs are named `lailaos-consolidation-*`, not after its job label — so read the plist's `StandardOutPath`/`StandardErrorPath` keys rather than guessing the name. The wrapper additionally keeps its own rotating log at `/tmp/lailaos-<name>.log`. Cron equivalent: the crontab line + wherever you redirect output (redirect it; cron mails or discards otherwise).

Three distinct failure states — identify which BEFORE touching anything:

1. **Never loaded.** `launchctl list | grep lailaos` doesn't show the label (cron: no crontab line). The log files don't exist or are stale. Fix: install per `launchagents/README.md`, `launchctl load ~/Library/LaunchAgents/<label>.plist`. If a plist is installed with no matching template in `launchagents/`, that's registry drift — a separate finding to log, per `docs/background-monitoring.md`.
2. **Loaded but erroring.** `launchctl list` shows the label with a nonzero status in its second column; `launchctl print gui/$(id -u)/<label>` gives the detail (last exit code, run count, the resolved program arguments — useful when you suspect the installed plist drifted from the template). Read the LAST run's stderr first. Classic causes, in observed frequency order:
   - **PATH.** launchd/cron run with a minimal PATH, no shell profile. Exit 127 or `command not found` for `python3`/`node`/the agent CLI means the plist's PATH is wrong — and NVM dirs use a `v` prefix (`.nvm/versions/node/v22.0.0/bin`); a missing `v` is the classic silent version of this. Verify with `which node` in a normal shell and copy the real dirs in.
   - **Env not loaded.** Secrets live in `.env`, sourced by the wrapper — never in the plist. A job that works in your terminal but not under launchd may be inheriting your shell's exports; check the wrapper actually sources `$LAILA_OS_ROOT/.env` and that `LAILA_OS_ROOT` resolves.
   - **Repo path.** Templates assume `~/laila`; if your clone lives elsewhere and you didn't fix the paths inside each plist, the wrapper itself is what's not found.
3. **Ran, but its notify pipe is broken.** The wrapper log shows a clean run at the scheduled time — the job is fine; the DELIVERY failed. Stop debugging the job and go to §2 (Telegram) or §4 (the content source). This state is the one people waste hours on: "the brief didn't arrive" very often means "the brief was built and the send failed".

**The TCC gotcha class (macOS-specific).** Reminders, Calendar, and Messages data sit behind TCC privacy grants, and launchd-spawned processes do not inherit the grant you gave Terminal. Symptoms are hangs or EMPTY results, not errors — a job that "works when I run it manually" but returns nothing on schedule is this. Workarounds, in order: route protected reads through snapshot files written by interactive/permitted paths (e.g. `state/calendar-snapshot.json`) and have background jobs read the snapshot; invoke `python3` directly rather than via a bash wrapper so the permission attributes to the right binary; wrap any call that can hang in a hard `timeout`; keep a no-permission fallback so the job degrades instead of wedging. Linux/cron has no TCC, but D-Bus/session-keyring reads fail similarly outside a login session — the snapshot pattern is the portable fix.

**Force a run to verify:** `launchctl start <label>` (cron: run the wrapper script directly, but note that skips cron's environment — §8).

## 2. Notifications stopped

The pipe is `scripts/telegram-notify.sh <domain> "<message>"` → Telegram Bot API. One-line test (the same wiring check as `docs/setup.md` §2):

```bash
bash scripts/telegram-notify.sh default "[TEST] wiring check"
```

Read the script's behavior precisely — it has both loud and deliberately-quiet failure modes:

| Mode | What you see | Fix |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` unset | `ERROR: TELEGRAM_BOT_TOKEN not set`, exit 1 | `.env` missing/unsourced in this context (§1 env), or the var was removed |
| Dead/rotated/revoked token | API returns `ok:false` (401); script retries once then errors | Re-issue via @BotFather, update `.env` |
| Wrong chat id | `ok:false` (400, "chat not found") surfaced by the `.ok` check — the API answers 200-with-failure, which is why the script must parse `ok`, not trust curl's exit code | Re-derive the id per `docs/setup.md` §2 |
| Chat-id env var UNSET for a domain | **Silent**: `WARNING` to stderr, exit **0** — notification is best-effort by design, so a renamed `TELEGRAM_*` var loses a whole domain's alerts without failing any job | Check `config/telegram-groups.json` maps to env-var NAMES that actually exist in `.env` |
| No network egress | Empty response → error after retry | `curl -4 -sS https://api.telegram.org` to isolate DNS/IPv6/firewall |
| Markdown parse failure | First send `ok:false`; script auto-retries without `parse_mode` | Only a bug if the retry also fails — then inspect the message text |

If the test send works but a specific loop's alerts don't arrive, the loop is calling with a domain that routes to an unset var (row 4) — grep its wrapper for the `telegram-notify.sh` call and check that domain key.

The inbound direction (bot not ANSWERING) is a different process: `scripts/telegram-bot.py` under `com.lailaos.telegram-bot` (KeepAlive). Check it's alive, then `/tmp/lailaos-telegram-bot.err.log`. Silence to exactly one sender is correct behavior — it answers only `TELEGRAM_ALLOWED_USER_ID`. Never restart it from inside a session it spawned (laila-headless-conduct §6).

## 3. Headless agent sessions failing

Every judgment-needing loop spawns a non-interactive `$AGENT_RUN` session (`docs/headless-sessions.md`). Three distinct failure signatures:

1. **Everything broke simultaneously = shared credential expired.** Headless runs reuse the agent CLI's stored interactive login. When that auth dies (expiry, keychain hiccup, logout), EVERY job that spawns a session fails at once — brief, consolidation, bot replies, all in the same window. That cluster signature means "re-authenticate the CLI interactively", not "debug each loop". Confirm: any job log showing `Not logged in` (or your CLI's auth error). Fix: log in interactively as the same user the jobs run as; then force-run one job (§8) to confirm the cascade is over. Worth having: a daily auth-health loop that alerts on this specifically, so you learn at 6am from one alert instead of at 9am from five dead loops.
2. **Job "succeeds" but nothing changed = missing tool grants.** A headless run has no one to answer permission prompts; on the reference CLI, `--print` without `--allowedTools` silently denies every tool call. The session runs, produces plausible prose, and edits nothing. Check the wrapper's `AGENT_RUN` line grants what the job needs (and no more — never send-capable tools; that boundary is load-bearing, see laila-headless-conduct §4). Also check the output-protocol line: a wrapper branching on `DONE:`/`NONE` treats prose as failure even when the work happened.
3. **Works in your terminal, fails on schedule = environment delta.** Your shell has your profile, exports, and PATH; the scheduled context has only what the plist/crontab carries plus what the wrapper sources from `.env`. Diff the two deliberately: `command -v claude` inside the wrapper (logged) vs your shell; confirm `WorkingDirectory` is the repo root; confirm `timeout` wraps the call so a hung session can't wedge the loop.

## 4. OAuth / provider token expiry

**Symptom cluster:** the brief arrives but its mail/calendar sections are empty or error out, comms triage returns nothing, yet every other loop is healthy. Logs show `invalid_grant`, `token has been expired or revoked`, or a refresh failure from the provider MCP/scripts. This is a data-source failure, not a job failure — the scheduler and sessions are fine.

**Fix:** re-run that provider's auth flow interactively (whatever minted the token the MCP server or script uses) and store the token in an untracked path. Then force-run the consuming job and confirm the section comes back.

**The durable fix, not the ritual:** an OAuth app left in "Testing"/dev mode expires refresh tokens on a short leash — about 7 days on Google — so re-auth becomes a weekly ceremony that always fails at the worst time. Publish the app to production status (for personal-use scopes, no verification review needed) and mint tokens AFTER publishing; those persist (`docs/setup.md` §3). If you're re-authing the same provider a second time, stop and do the publish step instead of paying weekly forever.

Provider reads can also die per-account while others work — one server per account (`.mcp.json`) means one expired token kills exactly one account's sections. That partial pattern distinguishes token expiry from the everything-at-once CLI-auth cascade in §3.

## 5. Dashboard down

The dashboard is a zero-dependency Node process (`dashboard/server.js`) on `DASHBOARD_PORT` (default 5175), run by `com.lailaos.dashboard` with `KeepAlive` — launchd restarts it after crashes and reboots, so "it's down" usually means crash-LOOPING, not merely crashed.

1. `curl -s http://127.0.0.1:5175/` — refused means the process isn't holding the port. Prefer `127.0.0.1` over `localhost` here and everywhere local (IPv6-first resolution burns timeouts against IPv4-only listeners).
2. `/tmp/lailaos-dashboard.err.log` — a KeepAlive job that dies on startup (bad node path after an NVM upgrade — the `v` prefix again — or a port already taken) respawns and re-dies; the log shows the same startup error repeating.
3. Restart: `launchctl kickstart -k gui/$(id -u)/com.lailaos.dashboard` (or unload/load the plist). Non-launchd: kill the node process and rerun `node dashboard/server.js`.
4. **Serving but showing stale/empty data is not a server problem.** It reads `state/*.json` (active-tasks, running-brief, comms-queue, loops-registry) at request time — stale panels mean the LOOP that writes that file is dead. Check the file's mtime, then go to §1 for that loop.

## 6. CRM / container down

The self-hosted CRM (reference: Twenty, `docs/crm-twenty.md`) runs in Docker at `http://localhost:3000`. Two failure modes that look alike from a failing session but have opposite fixes:

- **Connection refused = container down.** `docker ps` (is it running?), then `docker compose ps` in the CRM's compose dir for exit states, `docker compose logs --tail 50` for why, `docker compose up -d` to bring it back. Set `restart: unless-stopped` on the services so power events don't need you. If Docker itself isn't running on a headless machine, that's the §1 class — make the Docker daemon a login/startup item, and consider a watchdog loop.
- **The API answers but auth fails = env var not loaded.** The container is fine; the CALLER's context is missing the API key (`.env` unsourced — §1 env delta — or the key was regenerated in the CRM UI without updating `.env`). Trap to know: an unauthenticated GraphQL request can surface as a bogus schema error ("Cannot query field X") instead of a clean 401 — verify the key actually resolves in the failing context (`printenv | grep -c CRM_API_KEY`, presence only) BEFORE debugging the query.

Degradation note: the system is designed to survive CRM downtime — tracking files still work. A dead CRM at 7am is a fix-today, not a fix-at-7am.

## 7. Dead-man's-switch alerts (hc-ping)

An hc-ping alert means **the check didn't receive its ping** — the JOB failed to report, which is upstream of whether the task failed. Triage in this order, cheapest first:

1. **Was the machine awake?** A sleeping/powered-off host misses every ping at once. Multiple checks going down simultaneously = machine problem, not job problem; check uptime/power settings before touching any loop.
2. **Is the job loaded?** §1 state 1. An unloaded job is the single most common cause of a lone missed ping.
3. **Did the script crash before the ping line?** The ping is the LAST line of each wrapper; any earlier `set -e` exit skips it. The wrapper log shows how far it got. (This ordering is a feature — with "ping on success" semantics, a crash and a hang both read as silence, which is exactly what the switch exists to catch.)
4. **Is the `HC_*` env var set?** Scripts no-op the ping when the var is empty — the loop runs perfectly and healthchecks sees eternal silence. A check that has NEVER pinged since a `.env` edit is this.
5. Only then debug the task itself — and note the semantics per loop (`docs/background-monitoring.md`): a `/fail` ping means "ran and reported failure" (go read the log), a MISSED ping means one of 1-4.

After fixing, force-run the job and watch the check flip green on healthchecks.io — that's the end-to-end verification, not the script exiting 0.

## 8. Diagnosis discipline

The evidence bar from laila-judgment §1 applies with extra force at 7am:

- **Reproduce before fixing.** Read the failing run's log and force the job (`launchctl start <label>`) to see the failure live before changing anything. Running the wrapper by hand in your terminal is a WEAKER reproduction — your shell environment differs from the scheduler's (§1, §3), which is frequently the entire bug.
- **One change at a time.** PATH fix, then re-run. Token re-auth, then re-run. Two changes per run means you don't know which one worked, and the wrong lesson gets written down.
- **Verify the LIVE loop end-to-end.** "The script runs when I run it manually" is not "the job is fixed". Fixed means: the SCHEDULER ran it (force-start counts), the log shows a clean pass, the notification arrived on your phone, and the dead-man check went green. All four, because §1's third state exists precisely in the gap between them.
- **Log the incident** to today's daily note (`state/daily-notes/YYYY-MM-DD.md`): symptom, root cause, fix, verification. Recurring incidents are how this runbook grows a row; a fix that lives only in your memory will be re-derived at the next 7am.

## Provenance and maintenance

Framework doc — re-verify volatile specifics against YOUR deployment: job labels/schedules from your installed plists or crontab (`launchctl list | grep lailaos`), log paths from the plists' `StandardErrorPath` keys, ping vars from `.env` (presence only), ports from `.env` (`DASHBOARD_PORT`) and your CRM compose file, and the notify script's argument contract from `scripts/telegram-notify.sh` itself. When this doc and a script disagree, the script is ground truth — fix the doc.
