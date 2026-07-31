---
name: os-audit
description: Scored Four-Cs health audit of Laila. Trigger on "os audit", "audit the OS", "system health score", "four Cs", "how healthy is the OS". NOT the command channel's /audit (that's the autonomy audit log). Read-only except one report file.
bike-method-phase: 2
---

# OS Audit

Score Laila 0-100 across the Four Cs (Context, Connections, Capabilities, Cadence — 25 each), rank the top 5 gaps by leverage, write one report artifact. Structural health only — "is the OS built and running right?", not "what could it do next."

## When to use

- "os audit", "audit the OS", "system health score", "four Cs check"
- Monthly security/health audit companion; after big infra changes
- NOT for: the command channel's `/audit` (autonomy action log), stale-content hygiene passes, or pending-item review

## Steps

1. **Gather inputs (read-only, batch the reads).** `config/integrations.json` (connections[]), `config/domain-triggers.json` (active domains), root `AGENTS.md`, `MEMORY.md` (line count only), `docs/background-monitoring.md`. Count skills via frontmatter-only scan of `skills/*/SKILL.md` — do NOT read skill bodies except where step 4 requires a grep. Count `agents/*.md`.
2. **Score each C** per rubric below. Be honest, not generous — 90+ is a flex; a real setup lands 60-85. Don't penalize non-canonical file names if the intent is captured elsewhere.
3. **Rank gaps:** leverage = points lost × impact multiplier. Output top 5.
4. **Write the artifact** (only write): `state/audits/YYYY-MM-DD-os-audit.md` (`mkdir -p state/audits` first). Same-day rerun overwrites. If a previous audit file exists, append one line: `Δ vs YYYY-MM-DD: {+/-n} total ({per-C deltas})`.
5. **Print the report in chat.** Target under 60 seconds wall-clock.

## Rubric

### Context (25)

| Criterion | Pts | Detection |
|---|---|---|
| Root AGENTS.md is a router, not an archive | 3 | Pointers to domain files/configs, not inline duplication of domain content. Penalize -1 per section that duplicates what a domain AGENTS.md or config file owns; penalize if >~400 lines |
| Registry completeness | 2 | Three diffs, -1 each mismatch (floor 0): domains on disk vs config/domain-triggers.json entries; agents in agents/ vs AGENTS.md router tables; loops in state/loops-registry.json vs the scheduler's actual job definitions |
| Active-domain coverage | 5 | Every `state: active` domain in domain-triggers.json has `domains/<name>/AGENTS.md` + `tracking/status.md`. -1 per missing file, floor 0 |
| Status freshness | 5 | -1 per active domain whose status.md "Last updated" >30 days old AND no git commits touching that domain dir in 30 days (`git log --since="30 days ago" -- domains/<name>/`). Status files may share a bulk-migration timestamp — git activity is the tiebreaker before penalizing. Floor 0 |
| MEMORY.md is a hot cache | 5 | ≤150 lines = 5; 151-250 = 3; >250 = 1. It's a cache, not an archive |
| Three-layer knowledge system live | 5 | `knowledge/entities/` populated, `state/daily-notes/` has note within 3 days, `knowledge/tacit/` exists, nightly consolidation artifact within 7 days |

### Connections (25) — mechanism-agnostic, read `config/integrations.json` connections[]

Seven tier-1 domains: **Comms, Calendar, Tasks, CRM, Finance, Meetings, Knowledge**. "Reachable" = any entry in connections[] for that domain via ANY mechanism (MCP, script, GraphQL, osascript, scrape).

| Criterion | Pts | Detection |
|---|---|---|
| Tier-1 coverage | 18 | ~2.5 pts per reachable tier-1 domain (18/7 each, round total to nearest 0.5, cap 18) |
| Freshness | (deduction) | -0.5 from coverage per connection with `last_verified` >30 days old. Floor 0 |
| Comms routes PROVEN | 2 | If a comms-route health loop exists, read its last-run artifact: `overall: ok` AND `last_run` <48h = 2; `degraded` or stale = 1; `critical`/missing = 0. A declared route is only worth points if a health loop proved it |
| Reference docs | 3 | Start at 3; -1 per connected tool with `reference_doc: null`. Floor 0 |
| Write capability | 2 | ≥1 connection has `can_write: true`. All read-only = viewer, not an OS = 0 |

### Capabilities (25)

| Criterion | Pts | Detection |
|---|---|---|
| Skills cover the top recurring workflows | 10 | Frontmatter-only count, then check coverage of: daily brief, comms check, session wrap, reminders/tasks, CRM, and the household's own recurring routines. ~1.5 pts per covered workflow, cap 10 |
| Subagents defined | 4 | `agents/*.md` ≥2 = 4; 1 = 2; 0 = 0 |
| Delegation actually wired | 4 | `grep -rl "subagent_type\|Task tool\|dispatch" skills/` — ≥3 skills delegate = 4; 1-2 = 2; 0 = 0 (agents that exist but are never dispatched don't count) |
| Review/critic gates exist | 3 | Any adversarial/review pass wired into a skill (e.g. a blind red-team grader, a prose review gate) = 3 |
| Template compliance of new skills | 4 | Sample the 5 most recently modified SKILL.md files: -1 per file missing Verification or Self-improvement sections (per `templates/skill-template.md`). Floor 0. Pre-template legacy skills: note, half-penalty |

### Cadence (25) — scheduled-job count is necessary, NOT sufficient. Score health.

| Criterion | Pts | Detection |
|---|---|---|
| Jobs loaded vs documented | 6 | Scheduler's loaded jobs (e.g. `launchctl list | grep -i <your-prefix>` or `crontab -l`) vs the Background Monitoring table. -1 per documented job not loaded. Floor 0 |
| Jobs actually producing | 8 | Recency of each job's state artifact (`state/*-last.json` files): each within 2× its schedule = healthy. Check your CLI's usage/failure log (e.g. `state/agent-usage.jsonl`, if present) for repeated failures. -2 per scheduled job in known-broken state. Floor 0 |
| Delivery pipeline | 5 | Daily brief has a delivered/sent marker for today or yesterday = 5; brief generated but not sent = 2; neither = 0. If an OAuth token expiry cycle is blocking sends, this is the 4x gap |
| Dead-man's-switch wired | 3 | Presence-only grep of the untracked env file for ping URLs (e.g. `grep -c "^HC_"`) ≥1 — NEVER print values |
| Battle-tested-then-scheduled | 3 | No `bike-method-phase: 1` skill referenced by a scheduled job/routine. Violation = 0 |

## Gap ranking — leverage = points lost × multiplier

| Gap class | Multiplier |
|---|---|
| Broken delivery pipeline (brief not sending, OAuth expiry blown mid-cycle) | 4x |
| Tier-1 data domain unreachable | 3x |
| All connections read-only / no write path | 2x |
| Scheduled job silently broken (stale state artifact, failing runs) | 2x |
| Unregistered domain/agent/loop (registry drift) | 2x |
| Phase-1 skill on a schedule | 2x |
| No delegation wiring / new skill missing Verification+Self-improvement | 1.5x |
| Connected tool missing reference_doc | 1.5x |
| Stale status.md, stale last_verified, MEMORY.md bloat, everything else | 1x |

Sort descending, take top 5, each with a one-line concrete fix pointing at files/skills that actually exist.

## Report format (chat + artifact)

```
# OS Audit — {date}
**Score: {total}/100** ({stage})   Stages: 0-39 Foundation | 40-69 Built | 70-89 Compounding | 90-100 Autonomous

Context        {##bar}  {n}/25   Connections  {##bar}  {n}/25
Capabilities   {##bar}  {n}/25   Cadence      {##bar}  {n}/25
(bar = one # per 5 pts; label per C: Strong ≥20, Solid 15-19, Thin 8-14, Missing <8)

## Strengths
- {2-3 bullets from highest-scoring criteria}

## Top 5 Gaps (by leverage)
1. **{gap}** (-{pts} × {mult}) → {one-line fix}
...

Δ vs {previous audit date}: {+/-n} total ({C deltas})   [omit on first run]
```

## Rules

- **READ-ONLY** except `state/audits/YYYY-MM-DD-os-audit.md`. Never modify AGENTS.md, configs, skills, state files, or knowledge. Never trigger sends, syncs, or scheduled-job restarts.
- Never print secrets — env-file checks are presence-only (`grep -c`).
- Be honest, not generous. Show the math when a C loses points.
- Frontmatter-only skill scans; don't read every skill body.
- Don't recommend tools/skills that don't exist in this repo.

## Verification (MANDATORY)

Before declaring this skill done (and again after edits):
- **Cold test:** fresh session, say "os audit". It must produce the full scoreboard + write `state/audits/{today}-os-audit.md` without nudging, in roughly 60s.
- **Idempotency test:** run twice same day — second run overwrites the same file cleanly (no `-2.md` suffix, no duplicate append) and computes Δ against the prior *different-day* audit only.
- **Spot-check one criterion per C** against ground truth (e.g., count connections[] tier-1 domains by hand and compare).

## Self-improvement (MANDATORY)

- After each run: if Alex corrected a score or a detection misfired (e.g., penalized a bulk-migration status.md timestamp despite git activity), this skill is wrong, not Alex. Propose the rubric edit immediately, or log `{"skill": "os-audit", "correction": "...", "date": "YYYY-MM-DD"}` to `state/skill-feedback.jsonl`.
- If the same correction happens twice, the fix is MANDATORY before the next run.
