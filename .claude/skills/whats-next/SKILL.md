---
name: whats-next
description: Prioritized 3-5 item recommendation from all sources. Answers "What should I work on?"
argument-hint: []
---

# What's Next Skill

Generates a prioritized recommendation of 3-5 actions based on strategy, tasks, reminders, calendar, and goals.

## Workflow

1. **Read `state/strategy.md`** — current capacity allocation and priority stack
2. **Query active tasks** — `state/active-tasks.json` plus your task/CRM system (*query it here* for tasks with status up-next / in-progress, sorted by priority)
3. **Query active initiatives** — whatever system holds your Goal -> Initiative -> Task hierarchy, filtered to active, sorted by priority
4. **Query the reminders/task tool** — overdue + due today across all lists
5. **Read `state/running-brief.json`** — pending comms items >3 days old
6. **Check the calendar** — next 4 hours (protect scheduled time)
7. **Check KPIs/goals** — identify any with a downward trend or 0% progress
8. **Apply strategy weighting** (percentages come from `state/strategy.md`, e.g.):
   - Career tasks: 50% weight (primary focus)
   - Health tasks: 20% weight
   - Household/Content: 30% weight
   - Boost items that are overdue or blocking others
   - Demote items that conflict with upcoming calendar events
9. **Output:** Numbered list of 3-5 recommended actions:
   ```
   Recommended next actions:
   1. [P1/Career] Prep for the Acme Health next round — interview advancing
   2. [P1/Career] Tailor resume for the platform-engineer posting — drives "5 applications" goal
   3. [P2/Household] Call plumber for water line quote — waiting since Feb 18
   4. [P2/Content] Draft first newsletter post — 0/10 KPI, not started
   5. [P3/Health] Book annual physical — due this month
   ```
   Each item includes: priority, domain, action, and which Goal/Initiative/KPI it drives.
