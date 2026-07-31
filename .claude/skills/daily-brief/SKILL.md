---
name: daily-brief
description: Full cross-domain morning briefing. Checks all channels, calendar, reminders, news, pipeline, and generates formatted brief.
argument-hint: [full|quick]
---

# Daily Brief Skill

Generates a comprehensive morning briefing across all life domains. Saved to `state/briefs/daily/YYYY-MM-DD.md`.

## Core Rules (every run, non-negotiable)

- **Full live sweep — never echo past findings.** Every status the brief reports (service/infra health, tool availability, pipeline state, domain status) MUST be re-verified live THIS run. Cached state files (`state/*.json`) and domain `tracking/status.md` are inputs and hints — never facts to repeat. If a tracked item says "down" / "broken" / "working", actually re-test it before reporting. If you genuinely cannot re-verify something this run, label it `unverified (last known: …)` rather than carrying the old claim forward. A brief that parrots a stale "DOWN" or "broken" is a bug — that is exactly what this rule exists to prevent.
- **Always include a motivational quote.** Every brief, no exceptions. Generate a fresh one each run (vary it day to day; attribute real quotes; a line or two; tune to Alex's current focus when natural). It renders near the top, right under the greeting.

## Workflow

When triggered:

1. **Read `state/strategy.md`** for global priorities
1b. **Strategy staleness check** — check the file's mtime. If it is >30 days old, include a one-line nudge in the brief: `⚠️ strategy.md last updated <date> — refresh via strategy interview`
2. **Read `state/running-brief.json`** — the Running Brief is the primary source of pending comms items. Incorporate active items into Priority Actions and Domain Sections. Flag the stale item count.
3. **Check Calendar — ALL configured accounts** for today + tomorrow (e.g. personal + work). Missing any account is a bug. *(Query your calendar integration here — one call per account.)*
4. **Check the task system** — all lists/projects for overdue + today's items. *(Query your reminders/task tool here.)*
5. **Check Email — ALL configured accounts.** Missing any account is a bug:
   - Personal inbox (e.g. a `gmail-personal` MCP server) — run each active domain's email filters (defined in the domain CLAUDE.md files): career, health, household, content
   - Work inbox (e.g. a `gmail-work` MCP server) — unread + last 24h; mail from key stakeholders is high priority while an engagement is live
6. **Check messaging channels** — any configured messaging queue or capture file (e.g. `state/comms-queue.json`); respect per-channel allowlists
7. **Check news subscriptions** for the last 24h — read your configured news-sources list for senders and categories. Deep-read full bodies and extract articles with links + summaries.
8. **Check the pipeline system** — *(query your CRM/task system here)* for the career pipeline:
   - Applications in Interview/Screening/Applied stage (for company news search)
   - Stale applications (>7 days no activity)
   - Recently changed stages (rejections, advances)
9. **Web search** for news on companies in Interview/Screening/Applied status
10. **Meeting prep** — for each external meeting on today's calendar, assemble (or dispatch a subagent to assemble) a short prep brief from domain files and contact notes; include it in the calendar section.
11. **Read domain tracking files** — each domain's `tracking/status.md`. Skip domains whose `state` in `config/domain-triggers.json` is not `active`.
11b. **Domain status hygiene (Fridays only)** — run the `/domain-hygiene` scan and include flagged domains in the Infrastructure section. Do NOT auto-fix; surface as a short list so Alex can trigger `/domain-hygiene cleanup` for a batch pass.
12. **Check goals** — flag goals due this week or at-risk. *(Read from whatever system is authoritative for goals.)*
12b. **Cross-domain synthesis** — compare `state/strategy.md` against every active domain's `tracking/status.md` (directly or via a subagent); include max 6 bullets tagged [conflict]/[synergy]/[stale]/[drift] as a brief section.
13. **Action generation:**
    - For any Running Brief item requiring response: draft a reply (drafts only — never send)
    - For any email requiring response: draft a reply
    - For any application >7 days stale: draft a follow-up email
    - For any overdue task: propose completion or a new due date
    - For any goal at risk: flag with a specific recovery action
14. **State updates:**
    - Update the Running Brief: clear items Alex handled, refresh stale items with new context
    - Update domain status.md files with new information discovered
    - Update pipeline stages if new info was discovered (rejections, advances)
    - Propose a task-system sync (don't wait for session end)
15. **Output the formatted brief** (structure below)

## Brief Output Format

### Domain-First Organization
All communications organized **by domain**, not by channel. Each domain section includes comms from ALL channels + tasks + domain-specific data. Only include domains with content for today.

### Urgency Heuristic
Flag as **URGENT** when ALL of:
1. Same person contacted 2+ times in 24h (any combination of channels)
2. NOT commercial or automated
3. Content suggests they need a response

### Section Order
1. Vision -> 2. Motivation (always — a fresh motivational quote) -> 3. Schedule -> 4. Urgent -> 5. Priority Actions -> 6. Domain Sections -> 7. Industry News -> 8. Goal Progress -> 9. Domain Status -> 10. Infrastructure -> 11. Proposed Schedule -> 12. EOD Checklist -> 13. Skipped/Noise

> **Infrastructure + any health/availability claim:** do NOT just read a cached state file and repeat it. Live-probe each service this run (e.g. `curl -sS -o /dev/null -w "%{http_code}" <url>` for hosted apps, a real CLI call to confirm a tool, a live token check) and report what you actually observed now. The cached JSON is a hint to confirm, not the answer.

## Brief Archiving

- **Daily:** Save to `state/briefs/daily/YYYY-MM-DD.md`
- **Weekly rollup (Fridays):** Read the week's dailies -> generate `state/briefs/weekly/YYYY-MM-DD.md` -> delete dailies

## Usage

- `$ARGUMENTS = full` or empty: Full brief (all steps)
- `$ARGUMENTS = quick`: Pipeline counts + urgent items only ("Quick status")
