---
name: session-wrap
description: Mandatory end-of-session sync protocol. Reviews changes and proposes updates across all systems.
argument-hint: []
---

# Session Wrap Skill

**MANDATORY before ending ANY session.** Skipping this is how things get dropped.

## Workflow

**Step 1: Review what changed this session.** Identify:
- Tasks completed or discovered
- Status changes (projects, pursuits, domain items)
- New information that affects goals or priorities
- Files that were read but not updated with new info

**Step 2: Propose a sync table** covering ALL affected systems:

```markdown
**Session Sync:**

| System | Action | Detail |
|--------|--------|--------|
| Task system | check/add | Complete done items, add new action items |
| CRM / pipeline | update/add | Update pipeline stages, create new records |
| status.md | update | Update changed domain tracking files |
| Goals | update | Update goal progress |
| strategy.md | flag | Flag priority shifts (rare) |
```

**What to check (system-of-record-first sync order):**
- **Task system:** Complete done items, add new action items, reschedule overdue ones. *(Query your task/reminders system here — Apple Reminders, Todoist, a CRM task object, etc.)*
- **Pipeline / CRM records (FIRST):** If a domain keeps its pipeline in an external system (e.g. the career domain's prospect pipeline in a CRM), update stages there first, then regenerate any derived tracking files from it. The external system is authoritative; the markdown file is the export.
- **Goals (FIRST):** Update goal progress in whatever system is authoritative for goals, then regenerate any exported goals file.
- **Domain status.md:** Update `domains/<name>/tracking/status.md` for any domain whose status changed (new info, completed items, blockers resolved). **MANDATORY stamp:** any domain whose files were touched this session gets its `tracking/status.md` "Last updated" header stamped with today's date — even if the status content itself didn't change.
- **state/strategy.md:** Flag if strategic priorities shifted (rare — only when focus areas change).

The full cross-system sync checklist lives in `templates/sync-protocol.md` — every trigger skill executes it; session wrap is its final guaranteed pass.

**Step 3: Wait for Approval** — Do NOT execute until Alex confirms. They may modify, add, or remove items.

**Step 4: Execute Approved Changes** — task system via its skill/CLI, files via Edit/Write, external systems via their integrations.

If nothing changed during the session, explicitly state: "No sync needed this session — no state changes."

## Memory System Amendment

In addition to the sync above, ALSO:
1. **Append a session log** to today's daily note (`state/daily-notes/YYYY-MM-DD.md`)
2. **Update active projects** in the daily note (check off completed, add new, note owner: Alex or Laila)
3. **Flag knowledge updates** that nightly consolidation should process
4. **Log decisions:** if any decisions were made this session, append them to `knowledge/decisions/YYYY-MM.md` in the established format (or dispatch a decision-logger subagent with a summary of the session's decisions + today's date, if one is configured). Include the "entries appended" list in the wrap output. Skip if the session made no decisions.
5. **Capture skill corrections:** if Alex manually corrected any skill's output this session, log the correction (skill name, one-line description, date) so your weekly improvement ritual can review it.
6. **Write/update the session handoff (`PROGRESS.md`):** every session maintains a `PROGRESS.md` in the primary domain/repo worked on this session (e.g. `domains/<domain>/PROGRESS.md`, or the repo root for a code-heavy domain). It is a pass-off doc so another agent/session can resume cleanly — the audience is the next instance of you, not a stakeholder. At **session start**, read the relevant `PROGRESS.md` first if one exists.

   Synthesize it from what actually happened THIS session — review the **full conversation, not just the last few turns** (handoffs miss things when they only summarize recent context). Keep it short and CURRENT: overwrite stale content, do not append-log. Use this stable structure every time; if a section has nothing to report, write "none" rather than dropping it — structure stability is the whole point:

   ```
   # PROGRESS — <primary domain/repo> — updated YYYY-MM-DD

   ## TL;DR
   <2-3 sentences: what this session was about + where it now stands>

   ## Decisions locked + what shipped
   - <decision/change> — <why; absolute path if a file; commit + test status>

   ## Key findings
   - <non-obvious fact the next agent needs> — or "none"

   ## Key files for next session
   - `<absolute path>` — <why read this first>
   - Plan file: `<path>` — name it FIRST if a plan drove the session

   ## Running right now
   - Background jobs: <IDs + what + how to check + how to kill> — or "none"
   - Dev servers / ports: <url + port> — or "none"
   - Worktrees / branches: <paths> — or "none"

   ## Verification — how to confirm it still works
   - `<command>` — <expected outcome>

   ## Deferred + open questions
   - Deferred: <item> — <why pushed to later>
   - Open: <question needing Alex's input> — <context>

   ## Pick up here
   <1-2 sentences: the single most likely next action for a fresh agent>
   ```

   **Hard rules:** absolute paths always (the next agent may have a different working directory); never invent state — write "none" rather than omit a section; background job / server IDs are load-bearing, so include how to check AND how to kill them; verification is concrete commands + expected outcomes, not prose; terse end-of-shift-engineer tone — no emojis, no hype, no "what went well" retrospective.

## Active Task Update

Also during session wrap:
1. Review `state/active-tasks.json`
2. Update tasks worked on this session
3. Add new multi-session tasks with the correct owner (`owner: alex` = Alex works, Laila reminds; `owner: laila` = Laila monitors/executes) — **mint the next task ID programmatically, never pick it by hand.** Parse every existing ID, take the numeric maximum, add one. Eyeballing "last entry + 1" fails silently the moment a non-numeric or out-of-order ID exists in the file, and a collided ID splits one task's references across two unrelated records.
4. Close completed tasks (move to the `completed` array)
5. Lint before finishing — re-scan the file for duplicate IDs and missing required fields so collisions are caught the same session, not weeks later.

**If a duplicate is found:** the ID stays with whichever task owns the live external references (grep for it), and the other task renumbers. Repoint live pointers (memory files, `status.md`, `PROGRESS.md`) but **leave dated daily notes and the decision log alone** — those are a record of what was true then, not pointers to fix.
