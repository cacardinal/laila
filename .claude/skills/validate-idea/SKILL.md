---
name: validate-idea
description: Serial founder framework for validating business ideas before committing time and resources. Use this skill whenever evaluating a new business idea, startup concept, side project, or venture opportunity — even early-stage "shower thoughts". Guides through Pain vs Enjoyment classification, skillset Venn diagram, opportunity scoring, competitive research, TAM/SAM/SOM sizing, market testing strategy, and commit/kill decision. Tracks all ideas in domains/ideas/tracking/pipeline.json with 30-day kill timers. ALWAYS use this skill when the user says things like "I have an idea", "what do you think about building X", "should I pursue this", "validate this idea", or "idea pipeline".
argument-hint: [idea name | "status" | "research <slug>" | "matrix"]
---

# Validate Idea

A structured framework for evaluating whether a business idea is worth pursuing — before spending months building something no one wants.

> **Setup note:** this skill assumes an ideas domain at `domains/ideas/` (an optional pattern — create it on first use with `tracking/` and `research/` subfolders). Two helper scripts are referenced as placeholders; port or stub them for your setup:
> - `scripts/idea-research.sh <slug>` — PLACEHOLDER: an automated research agent that writes `domains/ideas/research/<slug>/intel.md` + `scores.json` (can be replaced by dispatching a research subagent manually)
> - `scripts/generate-idea-matrix.py` — PLACEHOLDER: regenerates the scoring matrix from `pipeline.json`
>
> CRM steps are optional — skip them if you don't run a CRM, but keep `pipeline.json` as the source of truth either way.

## Invocation

- `/validate-idea status` — show full pipeline by phase with kill-timer countdowns
- `/validate-idea [name]` — start new idea or resume an existing one by name
- `/validate-idea research <slug>` — run automated research on an idea
- `/validate-idea matrix` — regenerate the scoring matrix

## State File

All ideas live in `domains/ideas/tracking/pipeline.json`. Load it at the start of every invocation.

Key files:
- `domains/ideas/tracking/pipeline.json` — canonical pipeline (source of truth)
- `domains/ideas/tracking/status.md` — domain health summary (regenerate after changes)
- `domains/ideas/tracking/matrix.md` — auto-generated scoring matrix
- `domains/ideas/tracking/scoring-rubric.md` — scoring rubric
- `domains/ideas/research/[slug]/intel.md` — per-idea research brief
- `domains/ideas/research/[slug]/scores.json` — per-idea rubric scores

---

## Phase 0 — Framing

Before scoring anything, get clear on two things:

**What do you want?**
Ask: "What are you hoping to get out of this — passive income, a lifestyle business, or something venture-scale?" The right answer shapes every decision that follows. A micro-SaaS and a venture-backed platform are both valid; they require very different resource commitments and validation timelines.

**Pain or Enjoyment?**
Every business either solves a pain point or provides enjoyment. Pain businesses are almost always the better starting point:
- Pain drives people to pay. The worse and more frequent the pain, the more they'll spend to make it stop.
- Enjoyment businesses compete against *all other entertainment* — every movie, game, and social feed is a competitor.
- Enjoyment requires deep passion and domain expertise to break through.

This isn't a hard rule — great enjoyment businesses exist — but going in with eyes open matters. If the idea is Enjoyment-based, flag it explicitly and confirm it's a conscious choice.

Store: `type: "pain" | "enjoyment"`, `goal: "passive" | "lifestyle" | "venture"`

---

## Phase 1 — Skillset Check

The right business for someone else may be exactly wrong for you. Your skillset is the lens through which every idea should be evaluated.

Pull the existing skillset from `knowledge/entities/people/alex.md` (under `## Skillset`). If it's older than 90 days or missing, do a quick re-evaluation — score each skill as Good / Acceptable / Bad:

`Sales` · `Graphic Design` · `Product Design` · `Content Creation` · `Marketing (hard skills: SEO, ads, etc.)` · `Public Speaking` · `Technical Literacy` · `Programming` · `Finance` · `Operational Efficiency` · `Leadership`

**Good** = someone would pay you to do this today, even at a junior level.
**Acceptable** = can do it, could go pro with practice.
**Bad** = weak or minimal experience.

Then apply the Venn diagram: what are the 3–4 skills *most critical* to this specific idea's success? How many overlap with the Good tier?

- Most critical skills in Good tier → confidence boost, lean in
- Critical skill in Bad tier → flag as risk; is there a co-founder who covers it?

Save the updated skillset to `knowledge/entities/people/alex.md`.

---

## Phase 2 — Opportunity Scoring

Rate the pain point on three dimensions (1–5):

| Dimension | 1 | 5 |
|-----------|---|---|
| **Pain** | Mild inconvenience | Blocking / critical |
| **Frequency** | Once a year | Daily |
| **Niche** | Everyone has this problem | Very specific group |

Higher niche score is *better* — counterintuitively. Niche advantages:
1. Less competition with real product-market fit
2. Easier to charge premium (tailor-built for an underserved group)
3. Faster, higher-quality feedback loops
4. Growth loops work better within tight communities
5. Expanding out from a niche is easier than narrowing down from broad

Also ask: "Do you personally experience this pain?" Personal pain = built-in conviction and one automatic data point of product-market fit.

Store: `pain_score`, `frequency_score`, `niche_score`, `personal_pain: bool`

---

## Phase 3 — Research

Time-box this to 10 hours. Research paralysis is a real threat — the goal is to validate assumptions, not achieve certainty.

### Competition
Find 2–3 businesses solving the same underlying pain. No competition is usually a red flag (someone's probably tried and failed). Okay only if: (a) problem is enabled by brand-new technology, or (b) it's genuinely extremely niche.

For each competitor, capture:
- Pricing model (subscription vs. one-time vs. usage-based) and price points
- Size (employees) and funding status (bootstrapped vs. VC-backed)
- How they frame the solution — landing page language, differentiators they call out, price transparency

### Customer Location
- Who is the customer? (specific persona)
- Where do they spend time online and offline?
- Gut check: "If I had to find one potential customer for this right now, online, how long would it take?"

### Marketing or Sales Company?
Most early-stage startups are one or the other — rarely both.

**Marketing company signals:** low price point, individual buyers, self-serve onboarding, no contracts needed
**Sales company signals:** high average deal size, B2B buyers, contract or volume commitments, complex setup

If it's a Sales company but the price is too low to fund a sales team, that's a structural problem worth flagging now.

### TAM / SAM / SOM (simple version)
Anchor all estimates on the low end. Don't spend more than an hour here.

```
Total people in the space (TAM denominator)
× % who experience this specific pain → people in need (SAM denominator)
× price per transaction or subscription
× purchase frequency per year

SAM = (people in need) × price × frequency
SOM = SAM × 10%
```

SOM is the realistic near-term opportunity. Cross-check against any competitor revenue data if available.

Store: `competition: []`, `customer_persona`, `channel_type: "marketing" | "sales"`, `sam`, `som`, `research_notes`

---

## Phase 4 — Categorize

Build a quick scorecard:

**Timeline to Ship** — how long to a lean, sellable v1?
`<1mo` · `1-3mo` · `3+mo` · `ongoing`

If most ideas land in `3+mo`, the thinking isn't lean enough. The goal isn't perfection — it's something to test with.

**Opportunity Size** — from SOM:
`low` (<$500K) · `mid` (<$1M) · `large` (<$10M) · `venture` ($10M+)

**Confidence** — honestly: can you make *any* money at all?
`low` (<10%) · `fair` (10–50%) · `likely` (50–80%) · `high` (>80%)

Confidence inputs: personal pain point? strong skillset overlap? competition confirms demand exists?

**Decision heuristics to surface:**
- Short timeline + any confidence = worth trying (cheap experiment)
- Venture scale = needs `likely` or `high` confidence first
- Niche + smaller opportunity often beats broad + venture for first-time founders

Store: `timeline`, `opportunity_size`, `confidence`

---

## Phase 5 — Testing

The goal: **10 paying customers.** Not free users. Not signups. Paying customers.

### Build the leanest thing possible
Not an MVP in the traditional sense. Not a dream product. Possibly not a product at all — a form and manual fulfillment has launched real businesses.

Cut everything that doesn't directly address the pain. No polished landing page, no branding system, no swag. These are procrastination dressed up as preparation.

### Finding first customers
Go to where they are (from Phase 3 research). Talk to people directly when possible.

The counterintuitive truth: being an early-stage founder is an *asset* with potential customers. Large companies can't give customers a line to the founder. Lean into it — people root for transparent founders with genuine conviction.

**Pricing approaches:**
- *Sell at cost* — break even, focus entirely on validation
- *Godfather offer* — extremely competitive price locked in long-term; earns early commitment
- *Free trial with CC required* — sets payment expectation, still collects genuine interest signal

**Advisor shares** — for customers in high-prestige segments (executives, doctors, lawyers), offer 0.1–0.5% advisor equity. Creates the Ikea effect: people value things more when they helped build them. Keeps them engaged as feedback sources and long-term customers.

### Know when to fold
100+ people from the target market, fewer than 1% expressed real interest → kill it.

Don't get attached. "Never give up" applies to entrepreneurship as a path, not to specific ideas. The faster bad ideas die, the faster good ones surface.

Track: `customers_acquired`, `customer_target: 10`, `lean_mvp_description`

---

## Phase 6 — Commit or Kill

### Commit (10 customers, or explicit decision)
1. Set `phase = committed` in `domains/ideas/tracking/pipeline.json`
2. If you run a CRM: update the idea's Opportunity stage to `COMMITTED`
3. Ask: "What are you *stopping* to make room for this?"
4. Update `state/strategy.md` capacity allocation
5. Regenerate `domains/ideas/tracking/status.md`

### Kill (criteria met, or explicit decision)
1. Set `phase = killed`, record `killed_reason` + `killed_at` in `domains/ideas/tracking/pipeline.json`
2. If you run a CRM: update the Opportunity stage to `LOST`
3. Remove the kill-timer reminder
4. Log a lesson to `knowledge/tacit/lessons.md`
5. Regenerate `domains/ideas/tracking/status.md`
6. **If `has_domain: true`** — follow the Archive Protocol below before closing the loop.

### Graduation Protocol (categorizing → testing)

When an idea is promoted from `categorizing` to `testing` **and** the work ahead includes any ongoing operational surface — partner outreach, sales conversations, content creation, code development, discovery-log tracking — create a domain for it. Pure validation-only work (still just testing price points via landing pages, no active GTM motion) does not require domain creation.

**1. Decide the skeleton depth.**
- **Minimal pattern:** AGENTS.md + tracking/. Use when product code lives elsewhere (external repo) or isn't yet being built.
- **Code-heavy pattern:** AGENTS.md + tracking/ + build/server/etc. Use when code and tracking co-locate.

**2. Create the domain.**
```
domains/<slug>/
├── AGENTS.md                 # onboarding, rules, working agreement
└── tracking/
    ├── Next_Actions.md       # daily/weekly backlog (read first on any Check <Domain> trigger)
    ├── status.md             # domain health summary (authoritative for domain state)
    └── Decisions.md          # product pivots, pricing, channel choices (append-only)
```
Expand `Documents/` and `research/` subfolders as operational work demands (see Research Artifact Manifest below).

**3. Migrate existing artifacts.**
- `domains/ideas/research/<slug>/intel.md` → `domains/<slug>/research/intel.md`
- `domains/ideas/research/<slug>/scores.json` → `domains/<slug>/research/scores.json`
- Any marketing/sales collateral previously parked elsewhere → `domains/<slug>/Documents/`

**4. Update `pipeline.json` record for this idea:**
- `phase` → `"testing"`
- `has_domain` → `true`
- `domain_path` → `"domains/<slug>/"`
- `graduated_at` → today's ISO date

**5. Update canonical references:**
- Add the domain row to the root `AGENTS.md` Domains list with a one-line purpose description.
- Add a trigger entry to `config/domain-triggers.json` mapping `Check <Domain>` phrases to the domain's AGENTS.md.
- If your dashboard/CRM tracks life domains, create the corresponding record for visibility.

**6. Regenerate** `domains/ideas/tracking/status.md` and `matrix.md` so the matrix reflects the graduated phase.

**7. Research Artifact Manifest (reference, not mandate).**

As the idea works through testing toward commit, these artifacts should accumulate under `domains/<slug>/Documents/` and `research/`. Not all of them need to exist at testing-phase start; they compound as operational reality demands:

- ICP Qualification Scorecard (firmographic + technographic + psychographic + operational signals + anti-ICP)
- Competitive Analysis (deep profiles, 3–5 competitors, positioning map)
- Go-to-Market Plan (channels, motion, sequencing, pricing philosophy)
- Product Development Plan (MVP scope, roadmap, gating)
- Financial Model (unit economics, CAC/LTV, path to profitability)
- Technical & Product Analysis (architecture, data sources, cost structure, integrations)
- Regulatory / Legal deep-dive (licensing, compliance, tailwinds, risks)
- Buyer Journey Map (awareness → consideration → activation → expansion)
- Sales Enablement (pitch 1-pager, training guide, objection handling, leave-behinds)
- Risk Register (technical, market, legal, team)

The **commit gate** (phase testing → committed) is reached when enough of this manifest exists to argue defensibly that the business is real — not on doc count, on whether the business question *"would we bet the runway on this?"* has a clean answer backed by those docs.

---

### Archive Protocol (killed ideas with `has_domain: true`)

Killed ideas that had a domain folder (`has_domain: true` in pipeline.json) must be archived, not deleted — preserve optionality for future revival.

1. `git mv domains/<slug>/ domains/_archive/<slug>-killed-<YYYY-MM-DD>/`
2. Create `domains/_archive/<slug>-killed-<YYYY-MM-DD>/ARCHIVED.md` with:
   - Kill date + reason (copy from `pipeline.json` `killed_reason`)
   - Last-known state (code repo path, external services, credentials required to deploy — names only, never values)
   - Revival requirements (what structural change would make this viable again)
   - Link back to this skill's Revival Protocol (below)
3. Update `pipeline.json` idea record:
   - `archived_at`: ISO date
   - `archived_path`: `"domains/_archive/<slug>-killed-<YYYY-MM-DD>/"`
4. Remove the domain's entry from:
   - `config/domain-triggers.json` (trigger block)
   - Root `AGENTS.md` Domains list (row)
5. `config/reminders-lists.json` — remove entry if one was added.

Daily workflows (daily brief, what's-next, session-wrap) should skip `domains/_archive/**` — the underscore prefix is the universal skip signal.

### Revival Protocol

When a killed idea becomes viable again (e.g., capital partner surfaces, skill gap fills, structural blocker resolves):

1. `git mv domains/_archive/<slug>-killed-<date>/ domains/<slug>/`
2. Delete `domains/<slug>/ARCHIVED.md`
3. Update `pipeline.json` idea record:
   - `phase` → appropriate phase (typically `testing` or `categorizing` depending on prior state)
   - `killed_reason` → `null`, `killed_at` → `null`
   - `archived_path` → `null`, `archived_at` → `null`
   - `kill_date` → today + 30 days (fresh kill timer)
4. If you run a CRM: move the Opportunity stage from `LOST` back to the appropriate stage.
5. Restore the trigger block in `config/domain-triggers.json`.
6. Restore the row in the root `AGENTS.md` Domains list.
7. Create a fresh 30-day kill reminder (same pattern as new-idea creation).
8. Document revival reason + trigger in `domains/ideas/tracking/status.md` under a `## Revived` section.
9. Regenerate the matrix.

---

## State Management

## Research Agent

Run automated research via the placeholder `./scripts/idea-research.sh <slug>` (or dispatch a research subagent with the same contract).
Produces: `domains/ideas/research/<slug>/intel.md` + `scores.json`

After research: regenerate the matrix.

Trigger in session: if the user says "research [idea name]", run the research step for that slug.

---

### On new idea creation

1. Add record to `domains/ideas/tracking/pipeline.json`. Required fields: `id`, `name`, `slug`, `phase`, `added`, `kill_date`. Set `crm_opportunity_id: null` if you have not yet created the CRM record.
2. If you run a CRM: create an Opportunity tagged to the ideas domain, stage `IDENTIFIED`, named `"<Idea Name> (<IDEA-ID>)"`.
3. Write the returned record ID back to `pipeline.json` as `crm_opportunity_id`.
4. Set `kill_date = added + 30 days`.
5. Regenerate `domains/ideas/tracking/status.md`.
6. Create a kill-timer reminder in your reminders app: `"[idea name]: validate or kill by [kill_by]"` due on `[kill_by]`.

**WHY steps 2/3 matter (if you have a dashboard): dashboard pipeline widgets typically read from the CRM, NOT from `pipeline.json` directly.** An idea without a CRM record is invisible on the dashboard. A safety-net in the matrix generator can auto-create missing CRM records — treat that as a net, not the intended path.

**Background-agent gotcha:** if a validate-idea agent runs in a git worktree, any research outputs written to gitignored paths will be wiped when the worktree is removed. When dispatching such an agent, instruct it to either (a) run in the main checkout, or (b) move outputs into the main checkout before worktree cleanup.

### Schema
```json
{
  "id": "uuid",
  "name": "Idea name",
  "pain_point": "What pain does this solve?",
  "type": "pain | enjoyment",
  "goal": "passive | lifestyle | venture",
  "phase": "identified | researching | categorizing | testing | committed | killed",
  "personal_pain": true,
  "scores": {
    "pain": 3,
    "frequency": 4,
    "niche": 4,
    "timeline": "<1mo",
    "opportunity_size": "mid",
    "confidence": "likely"
  },
  "research": {
    "competition": [],
    "customer_persona": "",
    "channel_type": "marketing | sales",
    "sam": 0,
    "som": 0,
    "notes": ""
  },
  "testing": {
    "lean_mvp_description": "",
    "customers_acquired": 0,
    "customer_target": 10
  },
  "created": "YYYY-MM-DD",
  "kill_by": "YYYY-MM-DD",
  "killed_reason": null
}
```

---

## Running Brief Integration

During "what's next" / running-brief passes: check `domains/ideas/tracking/pipeline.json` for ideas where `kill_by` is within 7 days and `phase` is not `committed` or `killed`. Surface as ⚠️ items requiring a decision.
