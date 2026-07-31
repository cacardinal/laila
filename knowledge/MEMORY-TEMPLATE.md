# MEMORY.md — Hot-Cache Pattern

`MEMORY.md` is auto-loaded into every session's system prompt. It is a **hot cache**, not a knowledge store: it holds only the volatile, critical context a session needs before it reads anything else. Everything durable lives in the knowledge layers (`knowledge/entities/`, `knowledge/tacit/`, `knowledge/decisions/`, topic files) and is *linked* from here, never pasted here.

## Rules (enforced by the nightly consolidation pass)

1. **≤120 lines, hard cap.** If an addition would exceed it, something else must be collapsed or deleted first.
2. **One-line index entries.** Each item is a single line: a dated headline plus a link to the topic file that holds the detail. Never paste paragraphs into MEMORY.md.
3. **Detail lives in linked topic files.** If a fact needs more than a line, create/update a topic file (e.g., `acme_proposal_rescope_2026_07_08.md`) and link it: `[headline](topic_file.md)`.
4. **Dated sections decay.** Entries older than ~3 weeks get collapsed into a single "(collapsed)" line of links, or deleted if the linked file covers them. Recency earns space; history lives downstream.
5. **CRITICAL items only.** A line earns its place by changing how the next session behaves — active blockers, current strategic focus, standing feedback rules, tool warnings. "Nice to know" belongs in the layers.
6. **One home per fact.** MEMORY.md indexes facts; it is never the authoritative home of one. If MEMORY.md and a knowledge file disagree, the knowledge file wins and MEMORY.md gets corrected.

## Template

```markdown
# Laila-OS Memory (Hot Cache)

**Full knowledge system:** `knowledge/` directory. This file = CRITICAL volatile context only.
RULES: ≤120 lines; one-line index entries (detail lives in the linked topic files); dated
sections older than ~3 weeks get collapsed or deleted; never paste paragraphs here.

## Session Start
Read today's daily note (`state/daily-notes/YYYY-MM-DD.md`); `knowledge/tacit/preferences.md`
if relevant. Multi-session projects: check the domain's tracking file first.

## Current Strategic Focus (refreshed YYYY-MM-DD)
1. **Top priority** — one-line status + next action. [[topic_file]]
2. **Second priority** — one-line status. [[topic_file]]

## Recent work (dated index — detail in linked files)
- **7/22** [Acme proposal v2 sent — narrow Q4 scope, exec review ~8/1](acme_proposal_rescope_2026_07_08.md)
- **7/21** [Recurring bills consolidated to shared checking](knowledge/decisions/2026-07.md)
- **6/28-7/10 (collapsed)** [older item](file.md) · [older item](file.md)

## Standing feedback rules (index — read the file before acting)
- [Drafts inline in chat, never straight to email drafts](knowledge/tacit/preferences.md)
- [No meetings before 10am — deep-work block](knowledge/tacit/preferences.md)

## Active blockers (refreshed YYYY-MM-DD)
- **Blocker** — one-line state + what unblocks it. [[topic_file]]

## Tool warnings
- [Gotcha headline — the one-line rule](gotcha_topic_file.md)
```

## Maintenance cadence

- **Sessions** append/update lines as things change (and create the linked topic files).
- **Nightly consolidation** enforces the cap: collapses stale dated sections, pushes detail down into knowledge files, deletes lines whose linked files now cover them.
- **Weekly review** sanity-checks that "Current Strategic Focus" still matches reality.
