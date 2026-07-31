---
name: new-domain
description: Add or retire a life domain by executing EVERY step of the docs/adding-domains.md checklist — skeleton, registry, router, external systems, goals, then a verified trigger test. Use when Alex says "/new-domain", "add a domain", "new life domain", "spin up a domain for X", "retire the X domain", "kill the X domain", or "archive a domain". NOT /domain-hygiene (that scans existing domains for staleness; this one creates or retires them).
argument-hint: [domain-name | retire <domain-name>]
---

# New Domain Skill

Operationalizes `docs/adding-domains.md`. Domains are cheap to add and cheap to retire — the failure mode is doing either *partially*: a router pointing at files that don't exist, or an archived domain whose trigger still fires. This skill exists so no step gets skipped. Read `docs/adding-domains.md` first every run; it is the checklist of record and this skill executes it.

> **Setup note:** the registry is `config/domain-triggers.json` and the router is the root `AGENTS.md` — both must exist. Step 4 (external CRM/goal-tree registration) only applies if you run one; the skill asks rather than assumes. No scheduled jobs are created here — if a new domain later needs a background loop, that job uses the `$AGENT_RUN` env convention like every other loop.

## Tier classification

- **Tier 1 (auto-execute + notify):** creating files under `domains/<name>/` and adding the registry entry to `config/domain-triggers.json`. Deterministic, reversible, invisible to others. Log to `state/autonomy-audit.json`, notify the command channel.
- **Tier 3 (propose-and-wait):** any edit to the root `AGENTS.md` — it is the router every session loads, so present the exact diff and wait for approval. External CRM/goal-tree writes are also proposed first.
- **Retiring is always Tier 3.** Moving a domain to the archive is destructive-adjacent; confirm the kill explicitly before touching anything.

## Mode: Add (default)

`/new-domain` or `/new-domain <domain-name>`

### 1. Interview (brief — five questions, then move)

1. **Name** — lowercase slug for the directory (`domains/<name>/`), display name for headers.
2. **What is it** — one or two sentences: scope, what "checking" it should surface.
3. **Trigger phrases** — at least "Check <name>"; ask for any natural variants Alex would actually say.
4. **Meeting-notes auto-filing** — should meeting notes route here? If yes, collect the signals: participant email domains, people, company names, title keywords.
5. **Headline domain?** — does it get a mention in the root `AGENTS.md` Domains line, or is it registry-only?

Also ask whether the domain has goals to seed and whether an external CRM/goal-tree system is in play (skip step 5 cleanly if not).

### 2. Execute — every step, in order

Track each step in a live checklist (see Reporting). A step is `pending` -> `done` -> `verified`; nothing ships at `done`.

**Step A — Skeleton (Tier 1).** Create:
- `domains/<name>/AGENTS.md` — overview, a **"Check <Name>" workflow** (Read -> Detect -> Act -> Report, with Act split into Tier 1 vs Tier 3 actions), domain rules, trigger phrases. Model it on `domains/ideas/AGENTS.md`.
- `domains/<name>/tracking/status.md` — with a `**Last updated:** YYYY-MM-DD` header (the domain-hygiene scanner keys off it), Current Focus, and an Active Items table. Model on `domains/ideas/tracking/status.md`.

**Step B — Registry (Tier 1).** Add an entry to `config/domain-triggers.json`: `patterns`, `context_file`, `state: "active"`, plus a `meeting_routing` block (email_domains, people, company_names, title_keywords, `filing.correspondence_dir`) if the interview said notes should auto-file. Validate the JSON parses after the edit.

**Step C — Router pointer (Tier 3 — propose the diff).** If it's a headline domain, prepare a one-line addition to the root `AGENTS.md` Domains section (the active-domains list). Present the diff, wait for approval, then apply. The router routes — one line, no content.

**Step D — External CRM/goal tree (Tier 3, only if Alex runs one).** Propose the record creation AND the select-option additions on every object type that can be tagged with a domain (goals, tasks, KPIs). Surface the doc's warning verbatim in the proposal: the select-option step is the one that gets skipped — the domain *appears* in the system but nothing can be tagged to it, so its goal tree renders empty. **When an API replaces an options array wholesale: read the full existing array, append the new option, write it ALL back — omitting an existing option deletes it.**

**Step E — Goals.** If the domain has quarterly goals, add them to the goal source of truth (the external system if one exists, else the domain's `status.md`) and regenerate any exported views (`state/goals.md`).

**Step F — Verify end-to-end.** Have Alex (or a fresh session) say the trigger phrase and confirm: the registry resolves it, the domain's AGENTS.md loads, and the Check workflow runs against the new `status.md`. Only after this does the checklist read fully `verified`.

### 3. Close out

Log the Tier 1 actions to `state/autonomy-audit.json`, notify the command channel ("Domain <name> added — 6/6 steps verified"), and note the decision in `knowledge/decisions/YYYY-MM.md`.

## Mode: Retire

`/new-domain retire <domain-name>` — all Tier 3. Confirm first: "Retiring <name>: archive the directory, kill the trigger, remove the router line. Confirm?"

1. **Archive the directory:** `git mv domains/<name>/ domains/_archive/<name>-killed-YYYY-MM-DD/` (plain `mv` if not tracked). Write `ARCHIVED.md` inside it: kill reason (Alex's words), last known state (pull from its `status.md`), and revival cost — what it would take to bring it back.
2. **Flip the registry:** in `config/domain-triggers.json`, remove the trigger entry and append a row to the `archived` array (domain, `state: "archived"`, kill date, archive path). Validate the JSON.
3. **External system:** if one exists, propose marking the domain's record retired so dashboards stop counting it as live. Do NOT remove its select-option — historical records still reference it.
4. **Router:** propose the root `AGENTS.md` diff removing the domain from the active list (and mentioning `domains/_archive/` if it isn't already).
5. **Sweep for zombie references:** search skills, scripts, and configs for the old `domains/<name>/` path; fix or flag each hit.
6. **Verify:** say the old trigger phrase in a fresh session — it must surface "that domain was killed <date>, archived at <path>" instead of running a Check workflow. A retirement that skips steps 2-4 leaves a zombie trigger that errors weeks later.

## Reporting

Maintain and print the checklist at every pause point:

```
# Add domain: <name>
A. Skeleton (AGENTS.md + status.md)        [verified]
B. Registry entry (domain-triggers.json)   [verified]
C. Router pointer (root AGENTS.md)         [awaiting approval — diff above]
D. External CRM/goal tree                  [n/a — none configured]
E. Goals seeded + exports regenerated      [pending]
F. Fresh-session trigger test              [pending]
```

Never summarize a partially-executed run as complete. If the session must end mid-checklist, record the remaining steps in `state/active-tasks.json` (`owner: laila`) so the heartbeat nags until F is verified.

## When to invoke proactively

- Alex describes a new sustained commitment (a client engagement, a health program, a build) and starts asking Laila to track it — that's a domain forming; offer this skill instead of letting the tracking sprawl into daily notes.
- A domain's status has read "nothing active" for a quarter and its Check runs come back empty — propose retirement rather than letting it rot (killed is a verdict, not a deletion; the archive keeps the post-mortem).
- An engagement domain (the Acme pattern — created for one client commitment) hits the end of its contract: retirement is part of the close-out, not an afterthought.

## Verification (MANDATORY)

Before declaring this skill done (and again after edits):
- **Add round-trip:** add a throwaway domain (e.g. `testbed`), confirm all six steps reach `verified` including the fresh-session trigger test, then retire it via this same skill and confirm the trigger surfaces the archived state.
- **JSON integrity:** `config/domain-triggers.json` parses after both the add and the retire edits.
- **Tier discipline:** confirm the run never edited the root `AGENTS.md` without showing a diff and getting approval first.

## Self-improvement (MANDATORY)

- If a step was skipped, mis-ordered, or a real add/retire later turned out partial (a zombie trigger, an empty goal tree), this skill is wrong, not Alex. Propose the checklist edit immediately, or log `{"skill": "new-domain", "correction": "...", "date": "YYYY-MM-DD"}` to `state/skill-feedback.jsonl`.
- If `docs/adding-domains.md` gains or changes a step, update this skill in the same session — the doc and the skill must never disagree.
