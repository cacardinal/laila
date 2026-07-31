---
name: idea-deep-dive
description: Second-stage evaluation for an idea that already passed /validate-idea screening (weighted_total above ~3.5 in pipeline.json) and where Alex is weighing real commitment — more than ~40 hours or ~$10K to validate. Use when Alex says "deep dive on <idea>", "is <idea> worth building", "should I actually commit to this", or "before I spend a month on this". Fans out research workers, sketches unit economics against consulting opportunity cost, names the riskiest assumption and its cheapest falsifying test, runs the /roast council, and returns COMMIT / PARK / KILL. NOT for first-pass screening of new or shower-thought ideas — that's /validate-idea.
argument-hint: [idea-slug]
---

# Idea Deep-Dive

Stage two of the idea pipeline. `/validate-idea` answers "is this worth ten hours of research?" — this skill answers "is this worth a month of Alex's life?" It exists because the failure mode between those two questions is expensive: an idea that scores well on a screening rubric can still die on unit economics, an unfalsified core assumption, or the simple fact that a month of building costs a month of consulting revenue.

**NOT for first-pass screening.** A new idea, a shower thought, or anything without a scored pipeline entry goes to `/validate-idea` first. This skill assumes the matrix already said yes once.

## Invocation

- `/idea-deep-dive <slug>` — e.g. `/idea-deep-dive climate-radar` *today* gets routed back at Step 0: climate-radar sits at `weighted_total` 3.1 in `pipeline.json`, below the 3.5 bar, so the answer is "finish `/validate-idea` first" with the score cited.
- Once it re-scores at or above 3.5, that same invocation clears the gate and the full deep-dive below proceeds.
- `/idea-deep-dive <slug> resume` — an interrupted run resumes from the last completed step; check `domains/ideas/research/<slug>/deep-dive.md` for what already exists before re-dispatching workers
- Natural language works too: "deep dive on climate-radar", "is the climate radar actually worth building"

A full run is a real session — the fan-out alone is five parallel dispatches. Don't start one casually at the end of a session; the half-finished state is worse than not starting.

## Step 0 — Entry check

Load `domains/ideas/tracking/pipeline.json` and find the record matching `$ARGUMENTS` (slug or name).

Gate on all three; if any fails, stop and route:

1. **Exists** — no record → "This idea isn't in the pipeline. Run `/validate-idea <name>` first."
2. **Scored above the bar** — `scores.weighted_total` must be ≥ 3.5 (the graduation bar in `tracking/matrix.md`). Below it → route back to `/validate-idea` to finish or re-score; don't deep-dive a 2.8 as a favor.
3. **Alive** — stage must not be `killed` or already `committed`. A killed idea goes through the Revival Protocol in `/validate-idea` before it earns a deep-dive.

Also check the **strategy gate** in `domains/ideas/AGENTS.md`: if `state/strategy.md` currently parks side-project commitment, say so up front — the deep-dive can still run, but the best available verdict is PARK with a re-entry trigger, and Alex should know that before spending the session.

Confirm scope with Alex in one line: what commitment is actually on the table (hours/week, dollars, duration)? That number anchors the economics in Step 2.

## Step 1 — Research fan-out

Dispatch **research-worker** agents in parallel — one focused question each, all in a single message. Workers are read-only and return compact cited summaries (≤400 words); do not search in the main session. Seed each prompt with the idea's one-line description and the stage-1 notes from `pipeline.json` so workers aren't guessing what the idea is.

The standard five questions (adapt wording to the idea, keep one question per worker):

1. **Competitive landscape, with bodies** — who is funded and at what stage; who tried this and died, and why. Dead competitors are the highest-signal data in the set.
2. **Buyer evidence** — where do these customers complain about this problem today, in their own words (forums, reviews of adjacent tools, job posts)? No findable complaints is a finding.
3. **Pricing comparables** — what do the closest 3–4 products charge, on what model, and where is price resistance visible (discounting, free tiers, churn complaints)?
4. **Distribution channels that actually work in this category** — not what's theoretically possible; what channel demonstrably acquired customers for comparable products, with evidence.
5. **Regulatory / platform risk** — licensing, compliance, or platform-dependency exposure (an API or marketplace that can revoke the business).

Add a sixth worker only if the idea has an obvious category-specific unknown. Consolidate returns into a findings table, keeping citations and the ✅/🔶 confidence tags workers use. Where a finding contradicts a stage-1 assumption from `/validate-idea`, flag the contradiction explicitly — that's the fan-out earning its cost.

## Step 2 — Economics

Three sketches, all rough on purpose, all with sources or labeled guesses:

**Unit economics.** Price (from the Step 1 comparables), cost to serve one customer, CAC — a guess is fine but name its basis ("comparable products in this category report $X via channel Y"), and payback period. If payback is longer than the idea's kill horizon, say so now.

**TAM sanity re-check.** Pull the stage-1 SAM/SOM from the pipeline record and re-run the arithmetic against what Step 1 actually found. Stage-1 numbers were an hour of anchoring-low estimation; if the deep research moved them more than ~2x in either direction, record the revision and why.

**Alex's own money math.** The commitment from Step 0 priced against consulting revenue: hours × Alex's effective consulting rate (from `state/strategy.md`; ask if not recorded) plus cash outlay, versus the SOM-weighted upside. Include the Acme-anchor angle honestly — time taken from the anchor client is not free time. This line is the one that gets skipped when the idea is exciting; do not skip it.

## Step 3 — Riskiest assumption

Name **THE assumption** — singular — that kills the idea if false. Not a risk list; the one load-bearing belief. Usually it's "the buyer will pay $X" or "channel Y reaches these people," rarely anything technical.

Then design the cheapest test that could **falsify** it:

- **Time-boxed:** completable in days, not weeks — well under the commitment on the table.
- **Numeric pass/fail line:** written before the test runs (e.g. "10 of 40 outreach targets book a call" / "3 preorders at full price by the deadline"). No line, no test.
- **Deadline:** a date. The test result IS the first kill timer of the committed phase.

If no cheap falsifying test exists, that is itself a verdict-shaping finding — an untestable core assumption is a reason to PARK or KILL, not to commit on faith.

## Step 4 — Adversarial gate

Run **`/roast`** on the emerging thesis — not the raw idea, the deep-dive's current position: proposed verdict, unit-economics sketch, riskiest assumption and test. Paste that thesis as the brief so the council attacks what you actually concluded, not a strawman of the original pitch.

The council is read-only and returns GO / RESHAPE / KILL with a strongest objection. **The deep-dive verdict must answer the council's strongest objection in writing** — either it changes the verdict, or the verdict explains specifically why it doesn't. Silently overriding the council defeats the gate.

## Step 5 — Verdict

One of three calls, argued from Steps 1–4:

- **COMMIT** — the riskiest-assumption test becomes the first milestone, its deadline becomes the new kill date, and its pass/fail line becomes the kill criterion. Set stage → `committed` in `pipeline.json` with `committed` date; committing to the *test* first, not the build.
- **PARK** — sound idea, wrong time (strategy gate, capacity, a dependency not yet real). Set stage → `parked` with a concrete `reentry_trigger` ("revisit when X ships / when the Acme engagement ends / when the platform opens its API") — a parked idea without a trigger is a killed idea in denial.
- **KILL** — set stage → `killed` with `killed` date and a one-line `kill_reason` (the post-mortem discipline from the domain rules: killed is a verdict, not a deletion).

**Artifacts and state (in order):**

1. Write `domains/ideas/research/<slug>/deep-dive.md` (beside the stage-1 `intel.md`), shaped as:

   ```markdown
   # Deep-Dive — <Idea Name> (<IDEA-ID>)
   **Date:** YYYY-MM-DD · **Stage-1 weighted_total:** N.N · **Commitment on the table:** <hours / $>

   ## Verdict: COMMIT | PARK | KILL
   <the call in 2-3 sentences, including the answer to the council's strongest objection>

   ## Research findings
   <table: question | key finding | ✅/🔶 | source>
   <stage-1 contradictions called out explicitly>

   ## Economics
   <unit economics sketch · TAM re-check with revision note · opportunity-cost math>

   ## Riskiest assumption
   <the assumption · the test · numeric pass/fail line · deadline>

   ## Roast gate
   <council verdict + scores line · strongest objection · written answer>

   ## Next milestone (COMMIT) / Re-entry trigger (PARK) / Post-mortem (KILL)
   ```

2. Update the idea's record in `domains/ideas/tracking/pipeline.json` (stage, dates, reason/trigger fields, a `deep_dive: "research/<slug>/deep-dive.md"` pointer).
3. Regenerate `tracking/matrix.md` and `tracking/status.md`.
4. On COMMIT: create the kill-timer reminder for the test deadline and follow `/validate-idea`'s Graduation Protocol if the work ahead has an operational surface (domain creation, artifact migration).

## Autonomy

- Updating Alex's own pipeline files, research artifacts, matrix, and status — **Tier 1, execute and notify.**
- Anything outward-facing that the verdict implies — contacting prospects, posting the test publicly, buying ads, spending the $10K — **Tier 3, propose and wait.** The deep-dive designs the test; Alex fires it.
- All dispatched workers are read-only researchers. No subagent in this flow ever sends anything.

## Verification (MANDATORY)

Before declaring a run done:
- **Pipeline updated:** the idea's `pipeline.json` record carries the verdict (stage change) plus its date field — kill date + `kill_reason`, `reentry_trigger`, or `committed` date with the test deadline as the new kill timer.
- **Test is falsifiable:** the riskiest-assumption section has a numeric pass/fail line AND a deadline date. A test missing either = Step 3 incomplete, not done.
- **Council answered:** the verdict's written answer to the roast council's strongest objection exists in `deep-dive.md`.

## Self-improvement (MANDATORY)

- After each run: if Alex corrected the flow (wrong fan-out questions, economics missing a cost line, verdict argued past the evidence), this skill is wrong, not Alex. Propose the edit immediately, or log `{"skill": "idea-deep-dive", "correction": "...", "date": "YYYY-MM-DD"}` to `state/skill-feedback.jsonl`.
- If the same correction happens twice, the fix is MANDATORY before the next run.
