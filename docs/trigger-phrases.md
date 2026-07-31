# Trigger Phrases — Full Reference

The root `AGENTS.md` stays a slim router: only the highest-frequency triggers
live there, and this file holds the full table. Keeping the table out of the
router matters — everything in `AGENTS.md` is loaded into every session, so
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
| "Quarterly planning", "new quarter", "grade the quarter" | `/quarterly-refresh` — grade + archive the outgoing quarter, set the new slate (interactive only) |
| `/setup`, "make this mine", "I just cloned this" | `/setup` — guided onboarding; resumes at the first unfinished step |
| "Add a domain", "retire/archive the X domain" | `/new-domain` — the full adding-domains.md checklist, add or retire, verified end-to-end |
| `/compose`, "draft a reply to...", "help me respond" | `/compose` — draft as Alex with the voice-reviewer gate; never sends |
| `/persona [name]`, "who is X", "research X before the call" | `/persona` — relationship dossier saved to the contact's CRM record |
| "Grill me on [topic]", "extract what I know about X" | `/grill-me` — knowledge-extraction interview → brief in `knowledge/brainstorms/` |
| "Deep dive on [idea]", "is [idea] worth building" | `/idea-deep-dive` — stage-2 commitment evaluation for ideas past `/validate-idea`'s bar |
| "The brief didn't arrive", "a job isn't firing", "hc-ping alerted", "the dashboard is down" | `/laila-ops-debugging` — symptom → fix triage of the operational stack |

## Domain triggers (sample domains)

Domain triggers load the domain's `AGENTS.md` first, then run its "Check
[Domain]" workflow. The authoritative registry — patterns, paths, and
lifecycle `state` — is `config/domain-triggers.json`; this table is the
human-readable summary.

| Trigger | Domain | Context file |
| --- | --- | --- |
| "Check career", "Help me apply" | Career | `domains/career/AGENTS.md` |
| "Check health" | Health | `domains/health/AGENTS.md` |
| "Check household", "Smart home maintenance" | Household | `domains/household/AGENTS.md` |
| "Content ideas", "Write for LinkedIn" | Content | `domains/content/AGENTS.md` |
| "Check acme", "Prep for Jordan", "Engagement status" | Acme (engagement) | `domains/acme/AGENTS.md` |
| "I have an idea", "Idea pipeline" | Ideas | `domains/ideas/AGENTS.md` |

Feature work on any registered project (dashboard, an idea, the engagement) goes
through **`/spec`** — story packs, subagent implementation, story-reviewer QA gate.

Only domains whose `state` is `active` in `config/domain-triggers.json` get
their Check workflow executed — for dormant/complete/killed domains, surface
the state instead.

## Maintenance

When you add a skill or domain, add its trigger row here (and to the root
`AGENTS.md` only if it will be used near-daily). Periodically re-verify the
table against the actual skill list — a trigger that maps to a deleted skill
is worse than no trigger.
