---
name: domain-hygiene
description: Scan all domain status files for stale content (stale "Last updated" headers, past-due checkboxes, past-due status-table rows). Surfaces a consolidated list so Alex can give one-line facts and Laila batch-updates the files.
argument-hint: [scan|cleanup]
---

# Domain Hygiene Skill

Domain `tracking/status.md` files drift because nothing prompts a review. This skill scans them weekly (via the daily-brief on Fridays) or on-demand and surfaces stale items for batch cleanup.

## Scanner

Walk every `domains/*/tracking/status.md` (plus any `Next_Actions.md` a domain keeps) and flag:

1. **Stale header** — `Last updated:` date older than the threshold (default 30 days)
2. **Past-due checkbox** — unchecked `[ ]` with an explicit deadline marker (`by`, `due`, `deadline`, `target`) pointing to a past date
3. **Past-due status row** — table row with a status cell of `Not Started` / `Pending` / `In Progress` / `Planned` and a past date in the row

Status-keyword matching is exact-cell (not substring) to avoid false positives. The scan can be done directly with Read/Grep over the four domains, or via a helper script if you add one (e.g. `scripts/domain-status-hygiene.py` emitting the same findings as JSON for other skills to consume).

## Usage

### `/domain-hygiene` or `/domain-hygiene scan`

Run the scan and show the report: markdown grouped by domain, ordered by staleness.

### `/domain-hygiene cleanup`

1. Run the scan
2. Present the flagged list to Alex in a compact form
3. Ask one-line questions per domain: "For `career` — conference follow-up (Apr 15), portfolio refresh (Apr 16), Q1 networking goal (Mar 31): which are done / moved / killed?"
4. Batch-apply updates to the status files (mark `[x]`, change status columns to `Complete` / `Killed` / bump the date, etc.)
5. Bump `Last updated:` headers on touched files

The pattern is reply-driven cleanup: Alex gives facts, Laila edits.

## Threshold

Default 30 days. The Friday daily-brief uses 30 days; ad-hoc invocations can use a tighter threshold (e.g. 14 days) when asked.

## When to invoke proactively

- **Fridays during the daily brief** — auto-include findings in the Infrastructure section (see the `daily-brief` skill, step 11b)
- **After a quarter boundary** — quarter ends often leave lots of "Not Started" quarterly goals that should be killed or rolled forward
- **Alex says "are my status files stale?"** or "scan my domains"
