# Ideas — Domain Configuration

## Overview

The idea pipeline: every business/side-project idea gets captured, scored, and either graduated or killed on a timer. The point of the domain is the discipline, not the ideas — an idea that sits unvalidated for 30 days gets killed by default, and killed ideas keep their post-mortem so the same idea doesn't relitigate itself in six months.

Worked by the **`/validate-idea`** skill (capture → classify → score → research → kill/commit). Deeper commitment decisions (>40 hours or real capital) get a `/roast` council first.

## Tracking

- `tracking/pipeline.json` — every idea, its stage, scores, and kill timer (authoritative)
- `tracking/matrix.md` — GENERATED comparison matrix across scored ideas
- `tracking/status.md` — domain status summary

## Check Ideas Workflow

1. **Read** `tracking/status.md` and `tracking/pipeline.json`
2. **Detect** — kill timers expired or expiring within 7 days; ideas stuck in `researching` >14 days
3. **Act** — Tier 1: update pipeline stages, regenerate the matrix. Tier 3: proposing a kill (Alex decides kills — the timer forces the conversation, not the outcome)
4. **Report** — pipeline counts + anything on a timer

## Domain Rules

1. **Every idea gets a kill date at capture.** No kill date, no pipeline entry.
2. **Killed is a verdict, not a deletion.** Move to `killed` with a one-line reason; never remove the record.
3. **Research before enthusiasm.** No idea advances past `captured` without the competitive scan the skill mandates.
4. **Strategy gate:** while `state/strategy.md` parks side-project revenue, ideas can be validated but not COMMITTED — validation output goes to the parked list with a revisit date.

## Trigger Phrases

"I have an idea", "validate this idea", "idea pipeline", "check ideas"
