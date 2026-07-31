# Trigger Phrases — Full Reference

The root `CLAUDE.md` stays a slim router: only the highest-frequency triggers
live there, and this file holds the full table. Keeping the table out of the
router matters — everything in `CLAUDE.md` is loaded into every session, so
each row you inline is context spent on sessions that never use it.

A trigger phrase is just a stable mapping from something Alex naturally says
to a skill or workflow, so behavior is consistent across sessions instead of
re-derived each time.

## Global triggers

| Trigger | Skill/Action |
| --- | --- |
| "Daily brief" | `/daily-brief` — full cross-domain morning briefing |
| "Quick status" | `/daily-brief quick` — counts + urgent items only |
| "What's next?", "What should I work on?" | `/whats-next` — prioritized recommendations |
| "Running brief", "What's pending?" | `/running-brief` — interactive review of pending items |
| `/comms`, `/comms all` | Full multi-channel communications check |
| `/comms [domain]` | Domain-focused comms check |
| "Wrap the session", end of ANY session | `/session-wrap` — mandatory sync protocol |
| `/domain-hygiene` | `scripts/domain-status-hygiene.py` scan + batch cleanup review |
| "Check goals", "Goal status" | Review goal progress across domains |
| "Weekly planning" | Full week overview (Sundays) |
| "Quarterly planning" | Goal setting across all domains |

## Domain triggers (sample domains)

Domain triggers load the domain's `CLAUDE.md` first, then run its "Check
[Domain]" workflow. The authoritative registry — patterns, paths, and
lifecycle `state` — is `config/domain-triggers.json`; this table is the
human-readable summary.

| Trigger | Domain | Context file |
| --- | --- | --- |
| "Check career", "Help me apply" | Career | `domains/career/CLAUDE.md` |
| "Check health" | Health | `domains/health/CLAUDE.md` |
| "Check household", "Smart home maintenance" | Household | `domains/household/CLAUDE.md` |
| "Content ideas", "Write for LinkedIn" | Content | `domains/content/CLAUDE.md` |
| "Check acme", "Prep for Jordan", "Engagement status" | Acme (engagement) | `domains/acme/CLAUDE.md` |
| "I have an idea", "Idea pipeline" | Ideas | `domains/ideas/CLAUDE.md` |

Feature work on any registered project (dashboard, an idea, the engagement) goes
through **`/spec`** — story packs, subagent implementation, story-reviewer QA gate.

Only domains whose `state` is `active` in `config/domain-triggers.json` get
their Check workflow executed — for dormant/complete/killed domains, surface
the state instead.

## Maintenance

When you add a skill or domain, add its trigger row here (and to the root
`CLAUDE.md` only if it will be used near-daily). Periodically re-verify the
table against the actual skill list — a trigger that maps to a deleted skill
is worse than no trigger.
