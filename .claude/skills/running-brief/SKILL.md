---
name: running-brief
description: Review the running brief interactively. Clear, snooze, or act on pending items.
argument-hint: [review|clear-stale|status]
---

# Running Brief Skill

The Running Brief is a curated, living list of items Laila needs to discuss with Alex. Unlike the raw comms queue, it deduplicates, detects staleness, and stays small (~5-20 actionable items).

## State Files
- `state/running-brief.json` — Machine-readable source of truth
- `state/running-brief.md` — Human-readable rendered view

## Pipeline
comms monitor -> `state/comms-queue.json` -> updater script -> running-brief.json/.md

## Staleness Detection
- Messaging channels: check whether Alex already sent a reply to the same contact (query the channel's sent messages if the integration allows it)
- Email: checked during interactive review only (requires the mail integration)
- Age-based: items >5 days with no update -> marked stale
- Auto-expire: items >14 days -> auto-cleared

## Review Workflow

When triggered with "Running brief", "What's pending?", or `$ARGUMENTS = review`:

1. **Read `state/running-brief.json`**
2. **Present items grouped by domain**, active items first, then a stale summary
3. **For each item, Alex can:**
   - **"done"** or **"handled"** — Clear the item (move to the `cleared` array)
   - **"snooze"** or **"later"** — Reset the staleness timer, keep in the brief
   - **"not relevant"** or **"skip"** — Clear with a reason
   - **Take action** — Draft a reply, open the email, etc., then clear
   - **"clear stale"** — Bulk-clear all stale items at once
4. **After review, save updated `state/running-brief.json`** and re-render the `.md`
5. **Route actions to task systems** — For each cleared item that generated a follow-up action, apply your task-management routing rules:
   - Shared with household members -> the shared reminders/task list
   - Relates to a CRM entity (Person/Company/Opportunity) -> a CRM task or status update *(query your CRM/task system here)*
   - Domain-specific follow-up -> that domain's task list
   - No follow-up needed -> Skip (just clear)

   Present routing proposals as a sync table for approval before executing:
   ```
   | System | Action | Detail |
   |--------|--------|--------|
   | Reminders | Add | Household: "Review property declaration form" |
   | CRM | Update | Application: Acme Health -> Rejected |
   ```

   After routing, record `routed_to` on the cleared item in the JSON (e.g., `"routed_to": "reminders:household"`) to prevent duplicate task creation.

## Usage

- `$ARGUMENTS = review` or empty: Full interactive review
- `$ARGUMENTS = clear-stale`: Auto-clear all stale items
- `$ARGUMENTS = status`: Quick count of active/stale items ("Brief status")
