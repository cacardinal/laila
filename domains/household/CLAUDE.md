# Household — Domain Configuration

## Overview

The shared-life domain: home maintenance, errands, recurring chores, dog care (Biscuit),
and anything Alex coordinates with their partner Sam. The bar here is reliability —
nothing shared gets dropped, and nothing gets double-booked.

## Tracking

- **Status file:** `tracking/status.md` — maintenance queue, shared tasks, dog care
- **Reminders lists:** "Household" (shared with Sam), "Errands" (Alex only)

## "Check Household" Workflow

When triggered, execute IN ORDER:

1. **Read** `tracking/status.md` — open maintenance items, recurring chores, dog care schedule.
2. **Sync** external sources:
   - Reminders: both the shared "Household" list and "Errands"
   - Calendar: home-related appointments (repairs, deliveries, vet)
3. **Detect** issues:
   - Overdue recurring items (filter changes, dog meds, plant watering)
   - Scheduling conflicts between household appointments and either person's calendar
   - Maintenance items stuck in "waiting on quote/parts" for 14+ days
4. **Act** on findings:
   - Refresh recurring reminders (Tier 1)
   - Propose scheduling for repairs/deliveries (Tier 3 — attendee-visible events need approval)
5. **Report** a short summary: this week's shared tasks, anything overdue, upcoming appointments.

## Domain Rules

- **Shared tasks go to the shared "Household" Reminders list.** Never file a task Sam
  needs to see into Alex's personal lists, and never file Alex's personal errands into
  the shared list.
- **Never mark a shared task complete on Sam's behalf.** Only the person who did it (or
  Alex explicitly) closes it.
- **Vet and dog-care dates are hard commitments.** Biscuit's heartworm meds recur on the
  1st of each month — this reminder is never snoozed, only completed.
- **Big purchases (>$200) are a conversation, not a task.** Surface them as proposals for
  Alex and Sam to discuss; never add them straight to a shopping list.

## Trigger Phrases

- "Check household" — run the workflow above
- "Add to the house list" — create item on the shared Reminders list
- "What's due around the house?" — read maintenance queue
