---
name: setup
description: Guided onboarding for a fresh clone. Use when a new adopter says "/setup", "help me set this up", "make this mine", "I just cloned this", or asks to personalize anything while the repo still carries Alex's sample identity. Walks docs/setup.md interactively — privacy gate first, then identity, domains, channels, first run — verifying each step against the live system before moving on. Idempotent: re-running detects what's already wired and resumes at the first unfinished step.
argument-hint: [step number | "status"]
---

# Setup

Turn a clone of Laila into YOUR system. This skill orchestrates `docs/setup.md` — the doc holds the wiring mechanics; this session holds your hand through them, one step at a time, and refuses to advance until each step's verification passes against the live system. "Done" means verified, not claimed (`skills/laila-judgment` §1).

> **Setup note:** the only hard dependencies are git and a shell — everything else (Telegram, mail servers, healthchecks.io, the CRM) is introduced by the steps themselves and each is skippable. If a `/new-domain` skill is installed, Step 3 can hand off to it; otherwise the checklist in `docs/adding-domains.md` is followed by hand.

## Conduct

- **One question at a time.** Never present a wall of questions or a form to fill out. Ask, wait, record, move on.
- **Each step ends with its verification command from `docs/setup.md`.** Run it (or have the user run it) and WAIT for it to pass before starting the next step. A step that "should work" is not done.
- **Never print secrets.** Checks against `.env` are presence-only (`grep -c '^TELEGRAM_BOT_TOKEN=.'` style). Never echo token values, chat IDs, or ping URLs into the chat.
- All writes in this skill are local file edits — reversible, invisible to others, Tier 1. Nothing here sends anything. If the user asks you to send a test message to a third party, that is Tier 3: propose and wait.
- `/setup status` prints the resume table (below) and stops.

## Step 0 — Resume detection (always run first)

Re-invocation must not repeat finished work. Probe, then jump to the first unfinished step:

| Probe | What it tells you |
| --- | --- |
| `git remote -v` still points at the public example repo | Step 1 not done |
| `.git/hooks/pre-push` missing, or `.env` missing / perms not `600` (`ls -l .env`) | Step 1 not done |
| `state/security-audit-last.json` missing, or its `audited_base` doesn't resolve to a real commit (`git cat-file -e <sha>`) | Step 1 not done |
| Root `AGENTS.md` still names Alex as the user (`grep -c 'Alex' AGENTS.md`) | Step 2 not done |
| `config/domain-triggers.json` still lists only the sample domains | Step 3 not done |
| `.env` has no non-empty `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Step 4 (Telegram) not done |
| No mail/calendar wiring (`.mcp.json` absent and no equivalent the user names) | Step 4 (mail) not done |
| No brief in `state/briefs/` dated after your setup began (the repo ships a sample brief — only one newer than the first commit of your private copy counts) | Step 5 not done |

Print a one-line-per-step table — done / partial / not started — then say which step you're resuming at and why. If everything passes, say so and offer Step 5's habits as a refresher.

## Step 1 — Privacy gate (BLOCKING)

Nothing personal enters this repo until it's private and guarded. Do not ask for a single personal fact — not even a name — before this step verifies. If the user tries to skip ahead ("just set my name first"), decline and explain: the nightly loop auto-pushes, so a public remote plus one personal commit is a leak, not a mistake you can undo.

1. Confirm the remote is a fresh PRIVATE repo the user owns — not a fork (forks of public repos are public). Mechanics: `docs/setup.md` §0.
2. Install the guard rails:
   ```bash
   bash scripts/install-git-hooks.sh
   cp .env.example .env && chmod 600 .env
   ```
3. **Verify:** `bash scripts/security-audit.sh` exits clean AND `git remote -v` points at the user's private repo. Show both results. Only then proceed.

## Step 2 — Identity

Interview, one question at a time:

1. Name, and how the agent should address them.
2. Pronouns.
3. Household — partner, kids, pets, whoever the agent must name correctly and never guess about. (Alex has Sam and a dog named Biscuit; this is where those get replaced.)
4. Timezone (IANA name, e.g. `America/Chicago`).
5. What they want the agent persona called — Laila is a default, not a requirement. If they rename her, the agent-queue list name and `config/reminders-lists.json` follow.

Then edit the user-facing sections of the root `AGENTS.md`: the Overview persona line, the Family block, the Timezone section. Show the diff before writing.

**Sample content is teaching material — replace deliberately, not wholesale.** Do NOT bulk-delete Alex's data. For each sample surface (`domains/`, `state/`, `knowledge/entities/`), and later per domain in Step 3, offer three choices:

- **Keep** — leave the sample as a worked example to imitate (fine early on).
- **Replace** — overwrite with the user's real content now.
- **Archive** — move to `domains/_archive/` per the retiring checklist, keeping the shape without the noise.

**Verify:** ask the agent in a fresh context "who am I?" and "what are my active domains?" — the answers must be the user's facts. Any Alex leakage means an edit was missed; find it (`grep -ri alex AGENTS.md state/ config/`) before moving on.

## Step 3 — Domains

Ask: "What are the 3 life areas you actually work in weekly?" Start with 3 — a domain is added when a real workload demands one, not speculatively (README, "Adapting it").

For each real domain, run the full checklist in `docs/adding-domains.md` — skeleton (`AGENTS.md` + `tracking/status.md`), trigger entry in `config/domain-triggers.json`, router row, external-system registration if any. Every step, every time; partial domain creation is the documented failure mode. If a `/new-domain` skill is installed, invoke it per domain instead.

Then sweep the sample domains (Career, Health, Household, Content, Ideas, Acme) one at a time with the keep/replace/archive choice from Step 2.

**Verify:** say one of the user's new trigger phrases in a fresh session — the domain context loads and its Check workflow runs (`docs/setup.md` §1's verification, applied per domain).

## Step 4 — Channels

In dependency order; each sub-step is skippable but a skip is recorded in the resume table, not silently forgotten.

1. **Telegram notify pipe** (`docs/setup.md` §2, items 1-2): bot token + chat ID into `.env`.
   **Verify:** `bash scripts/telegram-notify.sh default "[TEST] wiring check"` arrives on the user's phone. Wait for their confirmation.
2. **Telegram command channel** (optional; §2 items 3-4): `TELEGRAM_ALLOWED_USER_ID` in `.env`, listener running.
   **Verify:** texting the bot "what are my active domains?" gets an answer; a second account gets silence. Wait for both confirmations — the silence half is the security test, not a formality.
3. **Email + calendar read access** (§3): one server or script per account; loops get read + draft, never send. Warn about the OAuth testing-mode trap before they mint tokens, not after.
   **Verify:** unread count per account + tomorrow's calendar events, read live.
4. **Reminders / agent task queue** (§4) and **dead-man switches** (§5) if the user wants background loops soon.
   **Verify:** per §4/§5 — queue item shows up in a processing pass; `bash scripts/heartbeat.sh` flips the healthchecks.io check to "up".

## Step 5 — First run

1. **Daily brief, dry run:** run the `daily-brief` workflow manually in this session. Expect thin output — the system has one day of state. The point is the pipeline works end to end before it's ever scheduled.
2. **The habit that matters:** `session-wrap` at the end of every working session, starting with this one. Skipping it is how things get dropped.
3. **What to schedule later, not today:** background loops (`docs/setup.md` §8) only after Steps 2-5 of that doc verify; the retrieval index (§7) once knowledge files carry real content; the CRM (§6) when markdown tracking starts to pinch.
4. Point them at `skills/laila-judgment` to read once, end to end. It's the discipline everything above assumes.

Close by running `/session-wrap` on this setup session — it's both the protocol and the demonstration.

## Verification (MANDATORY)

Before declaring this skill done (and again after edits):
- **Cold test:** fresh clone in a scratch directory, say "/setup". It must open with the privacy gate, not identity questions.
- **Gate test:** answer the first prompt with a personal fact before Step 1 verifies — the skill must decline and hold the gate.
- **Resume test:** complete Steps 1-2, end the session, run "/setup" again. It must print the resume table and land on Step 3 without re-asking identity questions.
- **Secret test:** grep the session log for any `.env` value — there must be none.

## Self-improvement (MANDATORY)

- If a probe in Step 0 misfires (marks a done step as unfinished, or vice versa), the probe is wrong, not the user. Fix the detection row immediately, or log `{"skill": "setup", "correction": "...", "date": "YYYY-MM-DD"}` to `state/skill-feedback.jsonl`.
- If the same correction happens twice, the fix is MANDATORY before the next run.
