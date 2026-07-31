# Content — Domain Configuration

## Overview

Alex's public writing: a personal blog and occasional LinkedIn posts documenting the
career-change journey ("PM learning climate tech in public"). This domain owns the idea
backlog, drafts, the publishing cadence, and voice consistency.

## Tracking

- **Status file:** `tracking/status.md` — pipeline of ideas → drafts → published
- **Drafts:** `drafts/` — one markdown file per piece
- **Voice profile:** `voice/voice-profile.md` — tone rules every draft is checked against

## "Check Content" Workflow

When triggered, execute IN ORDER:

1. **Read** `tracking/status.md` — pipeline state and the publishing cadence target.
2. **Sync** external sources:
   - Recent daily notes: anything Alex did this week worth writing about
   - Career domain: milestones that could become posts (interviews are OFF LIMITS — see rules)
3. **Detect** issues:
   - No draft in progress with a publish date inside the next 7 days
   - Drafts stalled in review for 10+ days
   - Idea backlog below 3 items
4. **Act** on findings:
   - Propose 2-3 post angles mined from actual recent work
   - Move stalled drafts to "parked" with a one-line reason
5. **Report** a short summary: pipeline, this week's publish plan, proposed angles.

## Domain Rules

- **Never publish automatically.** Laila drafts; Alex pastes and posts. Every piece is
  Tier 3 the moment it would leave the machine.
- **Voice check is mandatory.** Every draft is reviewed against `voice/voice-profile.md`
  before Alex sees it — flag violations, don't silently fix them.
- **Never write about active interviews or named companies in the pipeline.** Career-change
  content stays at the lessons-learned level until a process is fully closed.
- **Mine real work, don't invent takes.** Post angles come from what Alex actually did or
  learned that week — no hot-take generation from thin air.
- **One piece per week is the cadence, not the quota.** A skipped week is logged and
  moved on from, never backfilled with filler.

## Trigger Phrases

- "Check content" — run the workflow above
- "Content sprint" — mine the week and propose angles
- "Draft the [topic] post" — write a draft into `drafts/`
