# Acme Corp Engagement — Domain Configuration

## Overview

Active client engagement: a 6-week fractional-product advisory with Acme Corp (Denver logistics SaaS), scoped to shipping their Q4 AI-dispatching feature. This is the repo's example of an **engagement domain** — a domain wrapped around one external commitment with a start, an end, and a client on the other side. Engagement domains get created when the work starts and archived to `domains/_archive/` when it ends (`docs/adding-domains.md`).

**Client principal:** Jordan Lee, VP Product ([[jordan-lee]]). Expansion contact: Sam Okafor, COO ([[sam-okafor]]).
**Term:** kickoff 2026-08-04, 6 weeks.
**Why the scope is narrow:** see the 2026-07-08 decision — the rescope from open-ended advisory to one deadline-aligned feature is what closed the deal.

## Tracking

- `tracking/status.md` — current state (authoritative for domain context)
- `PROGRESS.md` — multi-session handoff notes; read FIRST when resuming engagement work

## Check Acme Workflow

When Alex says "check acme" or a trigger phrase fires:

1. **Read** `PROGRESS.md`, then `tracking/status.md`
2. **Sync** — check the comms queue and email for anything from acme-corp.example.com; check the CRM opportunity stage
3. **Detect** — deliverables at risk (due within 72h without a work session logged), unanswered client messages older than 1 business day, scope-creep signals
4. **Act** — Tier 1: update tracking files, log to daily note. Tier 3: ANYTHING the client could see (email drafts, document shares, meeting invites)
5. **Report** — one-paragraph status with the next deadline

## Domain Rules

1. **Scope is the product.** Any request outside the Q4 dispatching feature gets logged to `tracking/status.md` under "Expansion signals" and answered with "let's capture that for phase 2" — never absorbed silently. A scope change requires a decision entry.
2. **Everything client-visible is Tier 3.** No exceptions for "small" replies; Jordan reads tone.
3. **Client material stays in this domain.** Acme's internal docs, metrics, and names never leak into content posts (`domains/content/`) — even anonymized, ask first.
4. **The engagement serves priority 1 too.** Wins here become interview stories; log them to `knowledge/` when they land, with client-confidential details stripped.

## Trigger Phrases

"check acme", "acme status", "prep for Jordan", "engagement status"
