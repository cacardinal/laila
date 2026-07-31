---
name: quarterly-refresh
description: Interactive quarter-boundary ritual — grade the outgoing quarter's goal tree against its KPIs with evidence, harvest lessons, archive it honestly, and propose next quarter's slate. Use when Alex says "quarterly planning", "quarterly refresh", "new quarter", "Q1/Q2/Q3/Q4 planning", "grade the quarter", or a quarter boundary is near (an optional scheduled nudge may fire ~7 days out). Operationalizes the Quarterly Planning Specifics section of templates/planning-session.md. NEVER headless — interactive only; writes NOTHING until Alex approves.
---

# Quarterly Refresh

Close the quarter with evidence, not vibes, then open the next one with a slate Alex
actually has capacity for. Five phases: Grade, Harvest, Archive, Set, Wire the cadence.

**NEVER HEADLESS.** This skill runs only in an interactive session with Alex at the
keyboard. It writes NOTHING — no goal edits, no archives, no export regeneration — before
Alex approves the full proposed slate. A scheduled job may *nudge* that a quarter boundary
is near (see Timing), but the nudge only notifies; it never runs this skill.

## When to use

- "quarterly planning", "quarterly refresh", "new quarter", "Q1/Q2/Q3/Q4 planning", "grade the quarter"
- At a quarter boundary, or when the quarter-end nudge fires
- NOT for: weekly planning, "capacity planning" (both stay in `templates/planning-session.md`), monthly KR check-ins, or `/os-audit` (system health, not goals)

This skill fills the "Quarterly Planning Specifics" slot in `templates/planning-session.md` —
run it instead of freehanding that section. For everything upstream of the quarterly
specifics (state review, domain scan, external sync, capacity table), follow that
template's Steps 1-4; don't duplicate them here.

## Steps

### Phase 0 — Context (read-only)

Run `templates/planning-session.md` Steps 1-4 (state review, domain scan, external sync, capacity table).
Then pull the **outgoing quarter's full goal tree from the goal source of truth** — the
CRM's goal objects if one is wired, or `state/goals.md` directly if not. Per the
cross-domain rules, `state/goals.md` is a generated export when a CRM is wired; grade
against the source, never the export.

### Phase 1 — Grade

For each Objective in the outgoing tree:

1. **Gather evidence per KPI/KR** — the tracking file row, the shipped artifact, the
   number. Cite it (`domains/career/tracking/status.md`, the published post count, "5 of 8
   calls"). No evidence found = say so; never invent a status.
2. **Score each KR 0.0-1.0** per `templates/okr-architecture.md` (0.7+ is success), then
   classify the Objective: **HIT** (KRs ≥0.7), **PARTIAL** (real progress, short),
   **MISS** (little progress), **ABANDONED** (deliberately dropped mid-quarter).
3. **One-line "why"** for anything not HIT.
4. Present as a table and walk it Objective by Objective. **Alex confirms or corrects each
   grade — the grades are Alex's; the evidence-gathering is Laila's.** Record corrections.

### Phase 2 — Harvest

Before anything is archived, ask (one at a time, conversationally):

- For each MISS/ABANDONED: **wrong goal or wrong execution?** Wrong goals die; wrong
  execution may deserve another attempt with a changed approach.
- Which PARTIALs/MISSes **roll forward** into next quarter vs. **die here**? Rolling
  forward is a deliberate choice, not a default — a goal that rolls twice is a wrong goal.
- Any **lessons worth keeping**? Propose candidate entries for `knowledge/tacit/` and a
  decision-log line for `knowledge/decisions/YYYY-MM.md` — propose only; these get written
  with everything else at Phase 4 approval, never auto-written.

### Phase 3 — Archive (first write gate)

Only after Alex approves the full grade table:

1. Mark the outgoing quarter's goals archived/closed **in the source of truth**, carrying
   the grade and the one-line "why".
2. Regenerate the `state/goals.md` export (or, if goals.md IS the source, move the graded
   quarter to a "Completed" section per `templates/planning-session.md`).

### Phase 4 — Set

Propose the incoming quarter's slate, shaped by `templates/okr-architecture.md`:

- **3-5 Objectives max** — qualitative, memorable, verb-first. Cross-check against
  `state/strategy.md` focus areas and explicit non-priorities; **flag overcommitment
  out loud** (a 6th Objective needs one of the 5 to die, and an Objective outside the
  strategy's priorities needs a strategy conversation, not a quiet insertion).
- Each Objective: **1-3 Initiatives** and **measurable KPIs/KRs** (outcome, number, date).
- Fold in the Phase 2 roll-forwards, reshaped — never pasted in with the old wording.

Present the **FULL slate as ONE proposal** — Objectives, Initiatives, KPIs, plus the
proposed tacit/decision-log entries from Phase 2. Iterate until Alex approves the whole
thing; no partial writes mid-iteration. On explicit approval:

1. Write the new tree to the goal source of truth.
2. Regenerate the `state/goals.md` export.
3. If priorities shifted, **propose** the `state/strategy.md` edit as a diff and wait for
   a separate yes — strategy prose is never rewritten without explicit approval.
4. Write the approved `knowledge/tacit/` and decision-log entries.

### Phase 5 — Wire the cadence

Close the loop so the new tree actually gets used:

- Remind Alex that **weekly planning and the daily brief now key off the new tree** — the
  next "Weekly planning" session should pull priorities from it.
- Suggest (Tier 3, propose first) a **mid-quarter check row** in `state/active-tasks.json`
  (`owner: laila`, due ~week 6-7: "mid-quarter KR check-in — score each KR 0.0-1.0").
- Suggest domain `tracking/status.md` updates where an Objective changed a domain's
  projects — per `templates/planning-session.md` Step 6, also proposed, not silent.

## Timing — the optional nudge (scheduled-job pattern)

If you want a reminder, add a scheduled job (launchd/cron) that fires **~7 days before
quarter end** and sends one line to the command channel: "Q ends in 7 days — say
'quarterly refresh' when you're ready." Use the headless `AGENT_RUN` pattern from
`docs/headless-sessions.md` for the notification only, then install the job and
regenerate the registry (see `docs/background-monitoring.md` — `state/loops-registry.json`
is generated, never hand-edited). The nudge NEVER invokes
this skill — grading a quarter is a conversation, not a batch job.

## Rules

- **Interactive only, ever.** If running headless (no human turn-taking), STOP and exit.
- **Two approval gates, zero early writes:** nothing before the grade table is approved
  (gate 1 → archive), nothing else before the full slate is approved (gate 2 → set).
  Phases 0-2 are strictly read-only.
- Grades are Alex's; evidence is Laila's. Never argue a grade — record the correction.
- Evidence or admit the gap. "Felt productive" is not a KR score.
- 3-5 Objectives is a ceiling, not a target. Push back on the 6th.
- `state/goals.md` is touched only as a regenerated export unless it IS the source.
- `state/strategy.md` edits are always a separately-approved diff.

## Verification (MANDATORY)

Before declaring this skill done (and again after edits):
- **Cold test:** fresh session, "quarterly refresh". It must run planning-session Steps 1-4,
  produce an evidence-cited grade table, and reach the Alex-confirmation loop with zero
  writes having occurred.
- **Gate test:** decline the grade table — verify nothing was archived and no file changed.
  Approve grades but reject the slate twice — verify iteration happens with still zero
  new-quarter writes until the explicit yes.
- **Overcommit test:** propose a 6-Objective slate as Alex — the skill must flag it and
  ask which one dies, not silently accept.
- **Export test:** after an approved run, confirm the source of truth and `state/goals.md`
  agree, and the outgoing quarter appears archived with grades attached.

## Self-improvement (MANDATORY)

- After each run: if Alex corrected a grade classification, an evidence citation, or the
  slate format, this skill is wrong, not Alex. Propose the edit to this file immediately,
  or log `{"skill": "quarterly-refresh", "correction": "...", "date": "YYYY-MM-DD"}` to
  `state/skill-feedback.jsonl`.
- If the same correction happens twice, the fix is MANDATORY before the next run.
