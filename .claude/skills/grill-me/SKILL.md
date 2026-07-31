---
name: grill-me
description: Knowledge-extraction interview. Use when Alex says "grill me on X", "extract what I know about X", "get this out of my head", or before writing any strategy doc, brief, or positioning where Alex's tacit knowledge is the real input. 15-30 adaptive questions, ONE at a time, then a structured brief to knowledge/brainstorms/ plus routed updates to entities/tacit files. EXTRACTS knowledge FROM Alex — NOT a quiz that tests Alex, and NOT /roast (which attacks a plan).
argument-hint: "[topic]"
bike-method-phase: 1
---

# Grill Me

Alex knows things that exist nowhere in the system — client dynamics, market instincts, hard-won lessons from failed attempts. Any strategy doc written without that knowledge is written from the agent's priors, not Alex's experience. This skill gets it out of Alex's head and into the knowledge layer, one relentless question at a time.

> **Setup note:** the output directory `knowledge/brainstorms/` may not exist yet — `mkdir -p knowledge/brainstorms` on first use.

## When to use

- "grill me on the Acme phase-2 expansion", "extract what I know about pricing consulting work", "get this out of my head"
- BEFORE writing any strategy doc, positioning piece, or client brief where Alex's tacit knowledge is the actual input — run this first, write second
- NOT for: testing Alex's recall (that's a quiz — this skill has no answer key), critiquing a plan (`/roast`), or finding automation candidates (`/level-up`)

## Steps

### Phase 1 — Scope

One topic per session. If `$ARGUMENTS` names it, confirm in one line and start. If not, ask for it. Reject scope creep mid-interview: "That's a second topic — parking it for another session" (and note it in the brief's open threads).

Before the first question, silently check what the system already holds: relevant `knowledge/entities/` files, `knowledge/tacit/`, the domain's `tracking/status.md`. The gap between what's on file and what Alex knows IS the interview target. Never ask for facts a file already answers — that wastes budget and teaches Alex the interview is theater.

### Phase 2 — The interview

15-30 adaptive questions. **ONE question per message, never a batch.** Each question under ~2 sentences. Budget check at ~15: if answers are still producing new material, keep going; hard stop at 30.

**Follow-up triggers — these are the skill:**

| Signal in Alex's answer | Your next question |
|---|---|
| Vague noun ("the usual stakeholder problems", "some friction") | Name it: "Which stakeholders, and what did they actually do?" |
| An opinion ("fixed-fee is a trap") | The incident behind it: "What happened that taught you that?" |
| "Obviously" / "everyone knows" / "as usual" | Dig HERE — obvious-to-Alex is exactly what's missing from the system: "Obvious how? Walk me through it like I'm new." |
| A generalization ("clients always...") | A specific case: "Most recent time that happened — who, when?" |
| A number-shaped claim without a number ("it took forever", "a big chunk of revenue") | The number: "How long? What percentage?" |
| A success story | The failed attempts before it: "What did you try first that didn't work?" |

Chase specifics relentlessly: names, numbers, dates, sequences, what was tried and abandoned. A claim without an incident behind it is an instinct; note it as one, then probe for the incident anyway.

**Interview discipline (hard rules):**

- Never answer your own question or think aloud toward an answer. Silence after the question; wait.
- Never embed a candidate answer in the question ("Was it because of budget?" → produces the agent's knowledge, not Alex's). Ask open: "Why do you think that happened?"
- Never batch. One question, one answer, one follow-up decision.
- When Alex contradicts an earlier answer, surface it neutrally and let them resolve it — a live contradiction is high-value material, not an error to smooth over.

**Stop conditions:** answers start repeating, Alex says stop, or the 30-question budget is spent. Stopping early on repetition is a win — it means the vein is mined.

### Phase 3 — Synthesis

Write `knowledge/brainstorms/<topic-slug>-YYYY-MM-DD.md` with these sections:

1. **The question that prompted this** — why the extraction happened, what it feeds (e.g., "Acme phase-2 expansion strategy doc, due next week").
2. **What Alex knows** — organized claims, grouped by theme, each traceable to a specific answer ("Q7"). Distinguish incident-backed claims from instincts Alex couldn't source.
3. **The incidents** — the concrete stories behind the claims, with names/numbers/dates as given. These are the evidence layer; keep them verbatim-close.
4. **Open contradictions and uncertainty** — anything Alex flagged as unsure, plus contradictions surfaced in Phase 2 and how (or whether) Alex resolved them. Parked second topics land here too.
5. **What the system should do with this** — a routing table: which fact goes to which `knowledge/entities/` file, which lesson to which `knowledge/tacit/` file, which status change to which `tracking/status.md`. **Proposed, not auto-applied.**

### Phase 4 — Route durable facts

Walk the routing table with Alex:

- **Tier 1 (auto-execute + notify):** updates to Alex-only knowledge files — `knowledge/entities/`, `knowledge/tacit/`. Apply, then notify via the command channel per `config/autonomy-rules.json`.
- **Tier 3 (propose-and-wait):** anything beyond the knowledge layer — status docs feeding shared views, CRM notes, anything visible to others. Present the diff, wait.

Close with a one-screen summary in chat: topic, question count, top 3 extracted claims, where the brief lives, what was routed where.

## Worked exchange (the drill-down pattern)

> **Laila:** What made the Acme phase-2 expansion harder to scope than the original engagement?
> **Alex:** Honestly the usual stakeholder problems — procurement got involved late.
> **Laila:** "Usual stakeholder problems" — which stakeholders, and what did each actually do?
> **Alex:** Sam Okafor champions us internally but doesn't own the decision. Jordan owns the engagement commitment and obviously cares about fee-to-scope fit.
> **Laila:** You said "obviously" — obviously how? What has Jordan said or done that tells you the engagement fee is the lever?
> **Alex:** Last March they dropped a vendor mid-engagement when the fee ran 30% past the scoped work. Sam told me over lunch.
>
> Three turns took "the usual problems" to a dated incident with names and a number — which is now routable to `knowledge/entities/jordan-lee.md`.

## Rules

- One topic per session. One question per message. Questions under ~2 sentences.
- Extraction, not examination: there is no grading, no score, no "correct" answer. Alex is the source of truth about what Alex knows.
- Leading questions are contamination — if you catch yourself supplying a hypothesis inside a question, re-ask it open.
- Writes: the brainstorm brief (always), Tier 1 knowledge-file updates (with notify), nothing else without approval.
- The brief must survive Alex forgetting everything — six months later, the incidents section alone should reconstruct why each claim was believed.

## Verification (MANDATORY)

Before declaring this skill done (and again after edits):
- **One-at-a-time test:** run a session; any message containing two questions = fail.
- **Drill-down test:** answer a question with "the usual client stuff" — the next question must name and chase the vague noun, not move on.
- **No-leading test:** rereading the session, no question may contain a candidate answer or hypothesis.
- **Traceability test:** every claim in "What Alex knows" cites a question number; every incident has at least one specific (name, number, or date) or is explicitly marked as an unsourced instinct.
- **Routing-gate test:** nothing outside `knowledge/brainstorms/`, `knowledge/entities/`, `knowledge/tacit/` is written without an explicit Tier 3 approval.

## Self-improvement (MANDATORY)

- After each run: if Alex corrected the flow (questions too long, follow-ups missing an obvious vague noun, brief mis-organized), this skill is wrong, not Alex. Propose the edit immediately, or log `{"skill": "grill-me", "correction": "...", "date": "YYYY-MM-DD"}` to `state/skill-feedback.jsonl`.
- If the same correction happens twice, the fix is MANDATORY before the next run.
- Track which follow-up triggers actually produced incidents; if a new signal pattern recurs across sessions, add it to the trigger table.
