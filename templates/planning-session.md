# Laila-OS Planning Session Protocol

High-level planning sessions for cross-domain strategy and architecture review.

**Quarterly transitions (Q1/Q2/Q3/Q4 boundaries):** if a `/quarterly-refresh` skill is installed, use it instead of freehanding the "Quarterly Planning Specifics" section below — it operationalizes the same steps with an explicit grade-and-archive phase and an approval gate before anything is written.

---

## Trigger Phrases

| Trigger | Scope | When to Use |
|---------|-------|-------------|
| "Laila-OS planning" | Full architecture review | Major changes, quarterly reviews |
| "Quarterly planning" | Goal setting across domains | Q1/Q2/Q3/Q4 transitions |
| "Capacity planning" | Time allocation review | When feeling overcommitted |

---

## Planning Session Steps

### Step 1: State Review (Read-Only)

Read these files to understand the current state:

```
state/strategy.md           — Focus areas, capacity allocation
state/goals.md              — Cross-domain goals, quarterly objectives
```

### Step 2: Domain Scan

For each active domain, read:
- `domains/{domain}/AGENTS.md` — Domain instructions
- `domains/{domain}/tracking/status.md` — Current state
- `domains/{domain}/tracking/goals.md` — Domain goals (if present)

Scan every domain listed as active in the domain registry (e.g., career, venture, content, health, relationships, finance, meals, household, family, knowledge).

### Step 3: External Sync

Execute the full sync protocol (`templates/sync-protocol.md`):
- Calendar (7-day lookahead)
- Email (full scan)
- Messages (7 days)
- Group chats (allowlist)
- Tasks (all lists)

### Step 4: Analysis Output

Present a unified analysis:

```markdown
## Laila-OS Planning Analysis

### Active Projects
| Domain | Project | Status | Priority | Next Action |
|--------|---------|--------|----------|-------------|
| ... | ... | ... | ... | ... |

### Goal Status
| Goal | Target | Current | Status |
|------|--------|---------|--------|
| Land senior product role | Q3 | 7 apps active | On Track |
| 10 consulting trials | Sep 30 | MVP complete | On Track |

**At Risk:**
- [Goal] — [Reason]

**Recent Wins:**
- [Achievement] — [Date]

### Capacity Assessment
| Domain | Allocated | Actual | Status |
|--------|-----------|--------|--------|
| Career | 15-20 hrs | ~18 hrs | Balanced |
| Venture | 15-20 hrs | ~12 hrs | Slack |
| Life | 5-10 hrs | ~15 hrs | Overcommitted |

**Assessment:** [Overcommitted / Balanced / Slack]

### Cross-Domain Dependencies
- [Domain A] blocks [Domain B]: [Reason]
- [Domain C] enables [Domain D]: [How]

### Recommended Priorities (Next 2 Weeks)
1. [P1 Item] — [Domain] — [Rationale]
2. [P1 Item] — [Domain] — [Rationale]
3. [P2 Item] — [Domain] — [Rationale]
```

### Step 5: User Input

Ask for decisions on:

1. **Priority adjustments**
   - Any items to escalate to P1?
   - Any items to defer to P3/P4?

2. **New initiatives**
   - Anything to add to the backlog?
   - Any new goals emerging?

3. **Items to defer or drop**
   - What's no longer relevant?
   - What's been superseded?

4. **Capacity allocation changes**
   - Rebalance domain hours?
   - Change the weekly schedule?

### Step 6: Update Files

Based on user input, update:

**Always update:**
- `state/strategy.md` — Refresh focus areas, capacity allocation

**If goals changed:**
- `state/goals.md` — Update targets, status, notes

**If domain priorities changed:**
- `domains/{domain}/tracking/status.md` — Update status, projects, next actions

---

## Quarterly Planning Specifics

When "Quarterly planning" is triggered, also:

1. **Archive completed goals** — Move to the "Completed" section in goals.md
2. **Set new quarterly objectives** — 3-5 P1 goals for the quarter
3. **Review domain health** — Which domains need attention?
4. **Update capacity allocation** — Adjust for known events (travel, holidays, launches)

### Quarterly Review Questions

- What worked well last quarter?
- What didn't work?
- What should I start doing?
- What should I stop doing?
- What should I continue?

---

## Capacity Planning Specifics

When "Capacity planning" is triggered, focus on:

1. **Time audit** — Where did time actually go?
2. **Energy audit** — Which activities drain vs. energize?
3. **Commitment review** — What can be delegated, automated, or dropped?
4. **Buffer time** — Is there slack for unexpected items?

### Capacity Red Flags

- No unscheduled time blocks
- Consistently missing daily routines
- P1 items rolling over repeatedly
- Evening work becoming regular
- Weekend work becoming regular

### Capacity Adjustments

If overcommitted:
1. Defer P3/P4 items
2. Delegate where possible
3. Reduce meeting load
4. Protect focus blocks
5. Say no to new commitments

If slack:
1. Pull forward P3 items
2. Invest in learning (Knowledge domain)
3. Relationship maintenance
4. Health/wellness activities
5. Strategic thinking time

---

## Output Artifacts

After a planning session, ensure these are updated:

| File | Always | If Changed |
|------|--------|------------|
| `state/strategy.md` | X | |
| `state/goals.md` | | X |
| Domain `tracking/status.md` files | | X |
