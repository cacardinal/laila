# Knowledge System — Laila-OS

## Overview

Three-layer memory system for persistent context across Laila sessions. Each layer answers a different question: *who/what do I know about* (Layer 1), *what happened recently* (Layer 2), and *how does Alex like things done* (Layer 3).

## Layers

### Layer 1: Knowledge Graph (`entities/`)

Facts about people, companies, and projects. This captures the context that CRM records can't — relationship dynamics, communication preferences, project history, "why we know this person."

- One file per significant entity (e.g., `acme-corp.md`, `jordan-lee.md`)
- Small entities can share rollup files (`people.md`, `companies.md`, `projects.md`) until they earn their own file
- Entity files are updated whenever a session learns something durable about the entity

### Layer 2: Daily Notes (`state/daily-notes/`)

What happened each day. Session logs, active project tracking, follow-ups. Background monitoring reads these to know what to check on.

- Created/appended per-session during Session Wrap
- Consumed by the nightly consolidation job
- Archived after 7 days to `state/daily-notes/archive/`

### Layer 3: Tacit Knowledge (`tacit/`)

How Alex works. Preferences, patterns, lessons, security rules.

- `tacit/preferences.md` — Tool and workflow preferences
- `tacit/patterns.md` — Recurring patterns, what works
- `tacit/lessons.md` — Lessons from past mistakes
- `tacit/bottlenecks.md` — Manual tasks Alex keeps repeating (automation candidates)
- `tacit/security-rules.md` — Authenticated channels, trust boundaries (see also `docs/security-model.md`)
- `tacit/archive/` — Pre-compaction snapshots; live files are periodically compacted

### Decisions Log (`decisions/`)

Timestamped strategic and tactical decisions with reasoning and impact. Monthly files.

- `decisions/YYYY-MM.md` — Decisions made that month
- Capturing the *reasoning* is the point — six months later, "why did we choose X?" should be answerable from this file alone

## Hot Cache

`MEMORY.md` (auto-loaded into every session's system prompt) is the volatile hot cache in front of all three layers. It stays at or under 120 lines and holds only CRITICAL current context — everything else lives in the layers above and is linked from one-line index entries. Rules and template: `knowledge/MEMORY-TEMPLATE.md`.

## Session Protocol

1. **Start:** MEMORY.md is auto-loaded → read today's daily note → `tacit/preferences.md` if relevant
2. **During:** Update knowledge when decisions are made or lessons learned; new entity facts go to `entities/`
3. **Wrap:** Append session log to the daily note, flag knowledge updates for consolidation
4. **Night:** Automated consolidation reviews daily notes → updates knowledge files and prunes MEMORY.md

## Maintenance

- MEMORY.md stays ≤120 lines — CRITICAL items only; detail always lives in a linked knowledge file
- Knowledge files are the detailed store — always prefer updating here over MEMORY.md
- The nightly consolidation job owns routine pruning; humans and sessions own accuracy
