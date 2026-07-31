---
name: level-up
description: Weekly automation ritual — one interview, ONE shipped artifact. Trigger on "level up", "what should I automate next", "find me leverage this week", or Fridays after /os-audit. Pre-seeds from bottlenecks.md + daily notes, eliminate-first, mandatory KPI tie. Functional ("what leverage is missing?"), NOT /os-audit (structural health score).
bike-method-phase: 1
---

# Level Up

Find one manual drag on the week, scope it ruthlessly, ship exactly one artifact. The interview teaches the framework as a side effect — after a few runs Alex spots candidates mid-week without prompting.

## When to use

- "level up", "what should I automate next", "find me leverage this week"
- Fridays, after `/os-audit` (audit gaps feed Phase 0)
- NOT for: `/os-audit` (structural score), stale-content hygiene passes, or the command channel's `/audit` (autonomy log)

## Steps

### Phase 0 — Pre-seed (data before questions)

Read, in one batch:

1. `knowledge/tacit/bottlenecks.md` — rows from the last 14 days, plus any topic appearing 3+ times across the full history (count them)
2. Last 7 days of `state/daily-notes/`
3. `state/skill-feedback.jsonl` if present (skill corrections logged by session-wrap)
4. your CLI's usage log (e.g. `state/agent-usage.jsonl`) if present — flag cost-heavy recurring jobs
5. Latest `state/audits/*.md` — the audit's top gaps are additional candidates

Present the **top 3 observed bottlenecks with frequency counts**: *"Here's what the data says you keep doing manually — pick one or override."* Alex can override with their own candidate, but the data goes on the table first.

### Phase 1 — Find the candidate (mindset interview)

Ask conversationally, **skipping any question the pre-seed already answered**:

1. *"What did you do 3+ times this week?"* (frequency)
2. *"Anything manual, boring, or copy-paste?"* (drudgery)
3. *"Anything a smart intern could handle?"* (delegation)
4. *"If the workload 10x'd tomorrow, what breaks first?"* (constraint)

Output: 1-3 candidates ranked by leverage, one line of "why" each. Ask Alex to pick ONE. Even if they arrive with a pre-formed idea, run the pre-seed + at least one interview check against it.

### Phase 2 — Scope it (method interview)

1. **Constraint:** which bottleneck does this solve? Tie back to Phase 0/1 evidence.
2. **Eliminate first (Eliminate → Automate → Delegate):** *"What happens if we just stop doing this?"* If "nothing breaks" → exit cheerfully, mark the bottleneck row Eliminated, log the decision, STOP. Don't automate waste. Then Automate (aim for ~60% deterministic / 30% AI / 10% manual framing). Delegate last (suggest a person, log it, stop).
3. **Process map — five elements:** trigger / data sources / transformations / decision points / destination. **Hard stop:** if Alex can't articulate any of the five — *"If you can't explain the process to a person, you can't explain it to an AI. Sketch it first, come back."*
4. **Autonomy level → Laila tiers:**

   | Level | Maps to |
   |---|---|
   | L0-L2 (manual / suggested / drafted) | Tier 3 — propose-and-wait |
   | L3 (supervised) | Tier 1 — auto-execute + notify |
   | L4 (autonomous) | Requires editing `config/autonomy-rules.json` — **push back hard**; L4 only after clean L2/L3 history and an explicit override |

   Default = lowest level that solves the problem. Workflows beat agents.
5. **KPI tie (mandatory):** which Goal in the CRM/goal tracker does this move, and which metric? If no goal/metric can be named: **"no KPI, no build"** — stop, log Deferred-with-reason.

### Phase 3 — Build it

Boring-is-Beautiful ladder, in order — default = the lowest rung that solves it; Alex must explicitly choose more:

1. **Prompt-only** — saved trigger phrase, zero infrastructure
2. **Deterministic script** in `scripts/` (+ a scheduled job if it needs to recur)
3. **AI-assisted skill** in `skills/` — use `templates/skill-template.md`, including Verification + Self-improvement sections
4. **Subagent** in `agents/` — LAST resort; read an existing agent file for format first

Ship **exactly ONE artifact**. If it's a skill, frontmatter carries `bike-method-phase: 1` — manual validation first, never scheduled as a background job at phase 1.

### Closing (mandatory — the triage loop)

1. **Update the chosen bottleneck's row** in `knowledge/tacit/bottlenecks.md`: status Planned → Shipped / Eliminated / Deferred-with-reason.
2. **Log the decision:** dispatch the `decision-logger` agent with the scoped spec (constraint, eliminate/automate/delegate outcome, process map, autonomy level, KPI) and today's date → `knowledge/decisions/YYYY-MM.md`.
3. One-screen close in chat: what was scoped, what shipped, bike-method-phase-1 reminder.

## Rules

- One interview = one artifact. No multi-candidate parallel scoping.
- Eliminate is a win, not a failure — exit cheerfully and log it.
- L4 requires an `autonomy-rules.json` edit and explicit override; never default to it.
- No KPI in the goal tracker, no build.
- Writes only: the new artifact, the bottlenecks.md row, the decision log entry. Everything else read-only.

## Verification (MANDATORY)

Before declaring this skill done (and again after edits):
- **Cold test:** fresh session, "level up". It must surface 3 data-backed candidates with frequency counts from bottlenecks.md/daily notes — generic output ("you should build a brief") = fail.
- **Idempotency test:** run twice on the same candidate — second run must not duplicate the bottlenecks.md row update or the decision log entry.
- **Eliminate-first test:** feed an obviously eliminate-able candidate → skill exits with Eliminated status, no artifact.
- **L4 pushback test:** ask for an autonomous email-replier on first build → skill insists on L1/L2 + Tier 3 first.
- **Boring test:** candidate solvable with a deterministic script → ladder rung 2 recommended, not a skill or agent.

## Self-improvement (MANDATORY)

- After each run: if Alex corrected the output, this skill is wrong, not Alex. Propose the edit to this file immediately, or log `{"skill": "level-up", "correction": "...", "date": "YYYY-MM-DD"}` to `state/skill-feedback.jsonl` for the next `/level-up`.
- If the same correction happens twice, the fix is MANDATORY before the next run.
