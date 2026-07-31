# Adding (and Retiring) Domains

A domain is a life area with its own context file, tracking state, and
workflows (career, health, household, content, ...). Domains are cheap to add
and cheap to retire — the failure mode is doing either *partially*, leaving
the router pointing at files that don't exist or archives that still trigger.
Hence the checklists. Every step, every time.

## Adding a new domain — ALL steps required

1. **Create the domain skeleton:**
   - `domains/<name>/CLAUDE.md` — the domain's context: what it is, its
     workflows (including a "Check <Name>" workflow), its rules.
   - `domains/<name>/tracking/status.md` — current state, with a
     `Last updated: YYYY-MM-DD` header (the hygiene scanner keys off it).
2. **Register the trigger:** add an entry to `config/domain-triggers.json` —
   `patterns` (the phrases that invoke it), `claude_md` path, and
   `state: "active"`. Include `meeting_routing` signals if meeting transcripts
   should auto-file to this domain.
3. **Add a pointer row** to the root `CLAUDE.md` Domains section if it's a
   headline domain. Keep it to one line — the router routes, it doesn't hold
   content.
4. **Register in your external task/CRM system, if you run one.** If a
   dashboard or goal tree groups by domain, the new domain usually needs a
   record there AND a select-option on every object type that can be tagged
   with a domain (goals, tasks, KPIs). The select-option step is the one that
   gets skipped: the domain *appears* in the system but nothing can be tagged
   to it, so its goal tree renders empty. When an API replaces an options
   array wholesale, read the full array, append, and write it all back —
   omitting an existing option deletes it.
5. **Add the domain's goals** to your goal source of truth, and regenerate any
   exported views (`state/goals.md`).
6. **Verify end-to-end:** say the trigger phrase in a fresh session and
   confirm the domain context loads and the Check workflow runs.

## Retiring a domain — ALL steps required

1. Move `domains/<name>/` to `domains/_archive/<name>-killed-YYYY-MM-DD/` and
   add an `ARCHIVED.md` inside: kill reason, last known state, and what it
   would take to revive it.
2. In `config/domain-triggers.json`: remove the trigger entry and add a row to
   the `archived` array (domain, state, kill date, archive path).
3. Update the domain's record in your external system (health = retired), so
   dashboards stop counting it as live.
4. Remove its row from the root `CLAUDE.md` Domains section.
5. Verify nothing still references the old path — search indexes, dashboards,
   and any scripts that walk `domains/`.

A retirement that skips steps 2-4 leaves a zombie: the trigger still fires,
loads a moved file, and the session errors in front of you weeks later. The
checklist exists because that happened.
