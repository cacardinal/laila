# Daily Cadence

Recurring routines for Laila-OS management. Hybrid implementation: task-manager reminders for manual triggers + scheduled automation for generated summaries.

---

## Morning Routine (Before 9am)

### 1. Daily Brief
- **Trigger:** "Daily brief" or the automated morning summary
- **Duration:** 15-20 min
- **Actions:**
  - Full external sync (see `templates/sync-protocol.md`)
  - Domain status scan
  - Calendar review for today + tomorrow
  - Priority assignment (P1/P2/P3)

### 2. Email Triage
- **Duration:** 15-30 min
- **Actions:**
  - Process P1 emails (respond or schedule)
  - Review P2 emails (quick scan, flag for later)
  - Archive P3/FYI emails
  - Unsubscribe from noise

### 3. Calendar Review
- **Duration:** 5 min
- **Actions:**
  - Confirm today's meetings
  - Prepare materials needed
  - Block focus time if gaps exist

### 4. Task Check
- **Duration:** 5 min
- **Actions:**
  - Clear overdue items (complete, reschedule, or delete)
  - Review today's items
  - Add new items from morning triage

---

## Midday Check (12-1pm)

### 1. Quick Status
- **Trigger:** "Quick status"
- **Duration:** 5-10 min
- **Actions:**
  - Email urgent scan only
  - Messages quick check
  - Calendar adjustments if needed

### 2. Progress Check
- **Duration:** 5 min
- **Actions:**
  - Review morning accomplishments
  - Adjust afternoon priorities
  - Take a break

---

## Evening Wrap (5-6pm)

### 1. Status Update
- **Duration:** 10 min
- **Actions:**
  - Update domain tracking files with the day's progress
  - Mark completed tasks
  - Note blockers or open items
- **Citation rule:** every item in the update must include its source channel, e.g. "Practice canceled `[GroupChat:Team]`"

### 2. Tomorrow Prep
- **Duration:** 5 min
- **Actions:**
  - Review tomorrow's calendar
  - Identify prep needed
  - Set top 3 priorities for tomorrow

### 3. Task Capture
- **Duration:** 5 min
- **Actions:**
  - Add new items discovered during the day
  - Assign to the correct domain lists
  - Set due dates if applicable

---

## Weekly Routines

Example weekly theme map — adapt to your own domains:

| Day | Focus | Routine |
|-----|-------|---------|
| **Sunday** | Planning | Weekly planning — full domain review, goal check, week ahead prep |
| **Monday** | Career | Applications, networking, interview prep |
| **Tuesday** | Flexible | Calls, deep work |
| **Wednesday** | Venture | Build or go-to-market work (dedicated block) |
| **Thursday** | Venture | Build or go-to-market work (dedicated block) |
| **Friday** | Admin | Finance review, household, life domains catch-up, weekly level-up |
| **Saturday** | Off | Family/personal time, no work unless urgent |

### Weekly Planning (Sunday)

**Trigger:** "Weekly planning"
**Duration:** 45-60 min

1. **Review past week:**
   - What got done?
   - What got blocked?
   - What rolled over?

2. **Goal check:**
   - Read `state/goals.md`
   - Flag at-risk goals
   - Celebrate wins

3. **Week ahead:**
   - Full external sync (7-day lookahead)
   - Block time for P1 items
   - Schedule venture/project work blocks
   - Review family activities and logistics

4. **Household logistics block:**
   - Check the shared calendar for late meetings and family activities
   - Draft the week's meal plan (quick meals on busy nights)
   - Review with the household, then create dinner events and populate the grocery list
   - Place any grocery order before the delivery cutoff

5. **Update files:**
   - `state/strategy.md` — new weekly focus
   - Domain status files as needed

### Weekly Level-Up (Friday)

**Trigger:** "level up" (run after the system health audit)
**Duration:** 30-45 min

Health audit (structural score) → level-up (ship ONE automation artifact, pre-seeded by audit gaps + `knowledge/tacit/bottlenecks.md`)

---

## Monthly Routines (1st of Month)

### Monthly Review
- **Duration:** 1 hour
- **Actions:**
  - Review `state/goals.md` monthly milestones
  - Check financial status (Finance domain)
  - Review health appointments (Health domain)
  - Plan birthdays/events (Relationships domain)
  - Household maintenance check

---

## Implementation

### Task List: "Daily Cadence"

Create these recurring reminders:

| Reminder | Recurrence | Time | Notes |
|----------|------------|------|-------|
| Morning Brief | Daily | 8:00am | Trigger daily brief |
| Midday Check | Weekdays | 12:00pm | Quick status |
| Evening Wrap | Weekdays | 5:00pm | Status update |
| Weekly Planning | Weekly (Sun) | 10:00am | Full review |
| Monthly Review | Monthly (1st) | 10:00am | Deep review |

### Automation: Morning Summary

**Schedule:** 7:00am local, daily (cron / launchd / workflow tool — whatever the host machine runs)

**Actions:**
1. Fetch calendar events (today + tomorrow)
2. Fetch P1 emails (urgent keywords)
3. Fetch overdue tasks
4. Compile summary
5. Deliver to the command channel (e.g., messaging bot)

**Output format:**
```
Good morning! Here's your daily summary:

CALENDAR TODAY:
- 9:00am Meeting with X
- 2:00pm Call with Y

URGENT EMAILS (3):
- [Sender] Subject

OVERDUE TASKS (2):
- [List] Task

Run "Daily brief" for full sync.
```

---

## Capacity Integration

Daily cadence should respect the capacity allocation in `state/strategy.md`. Example:

| Domain | Weekly Hours | Daily Avg |
|--------|-------------|-----------|
| Career | 15-20 hrs | 3-4 hrs |
| Venture | 15-20 hrs | 3-4 hrs |
| Life Domains | 5-10 hrs | 1-2 hrs |

**Triage rule:** when overcommitted, defer P3 items and protect P1 time blocks.
