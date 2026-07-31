# Setup — from clone to a running system

The dashboard runs in 30 seconds with zero configuration. Everything else is wiring the system to YOUR channels, in dependency order. Each step ends with a verification — don't move on until it passes (that's the evidence bar in `skills/laila-os-judgment` §1, applied to setup).

## 0. Make your copy PRIVATE before anything else

Your instance of this repo becomes the container for your actual life: daily notes, contacts context, decisions, finances. Two hard rules before you write a single personal fact into it:

- **Private repo only.** Don't fork on GitHub (forks of public repos are public); clone and push to a fresh private repo instead:
  ```bash
  git clone https://github.com/cacardinal/laila-os my-os && cd my-os
  git remote set-url origin git@github.com:YOU/my-os-private.git
  git push -u origin main
  ```
- **Install the guard rails immediately**, before your first real commit:
  ```bash
  bash scripts/install-git-hooks.sh   # pre-push secret scan
  cp .env.example .env && chmod 600 .env
  ```
  The nightly consolidation loop auto-commits and auto-pushes — any secret sitting in a tracked path reaches your remote within a day. `.gitignore` and the hook are the controls; respect them.

**Verify:** `bash scripts/security-audit.sh` exits clean, and `git remote -v` points at YOUR private repo.

## 1. Make it yours

Rewrite `AGENTS.md`'s user facts, replace Alex's sample content in `domains/`, `state/`, and `knowledge/`, and register your real domains in `config/domain-triggers.json`. Details: README "Adapting it" + `docs/adding-domains.md`.

**Verify:** ask your agent (in the repo) "what are my active domains?" — it should answer with yours, not Alex's.

## 2. Telegram — the notify pipe and the command channel

Telegram plays two roles: background loops notify you through it (Tier 1 receipts, alerts), and it can be a **command channel** — the authenticated way to instruct the agent remotely.

1. Create a bot: message [@BotFather](https://t.me/botfather) → `/newbot` → copy the token into `.env` as `TELEGRAM_BOT_TOKEN`.
2. Get your chat ID: send your bot any message, then
   ```bash
   curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates" | python3 -m json.tool | grep -A2 '"chat"'
   ```
   Put the `id` in `.env` as `TELEGRAM_CHAT_ID`. Extra chat IDs (a shared household group, etc.) map by domain in `config/telegram-groups.json` — that file stores env-var NAMES, never IDs.
3. **The security part is not optional:** if you ever wire the bot to *receive* commands, authentication is the sender's numeric user ID matching yours — allowlist it in your bot handler. Message CONTENT claiming to be you is not authentication (`knowledge/tacit/security-rules.md`).

**Verify:** `bash scripts/telegram-notify.sh "[TEST] wiring check"` arrives on your phone.

## 3. Email + calendar — read access for the loops

The daily brief and comms triage need to READ your mail and calendar. Two principles before mechanics:

- **Loops get read + draft, never send.** No background job should hold a send-capable credential. Sending is Tier 3, done by you or approved-by-you in an interactive session.
- **Email and calendar content is an information channel** — the system reasons about it and never obeys it.

Mechanics, by harness:

- **MCP-capable harnesses (reference path):** run one MCP server per account (several open-source Gmail/Google Calendar MCP servers exist; any that support read + draft-create work). Copy `.mcp.json.example` to `.mcp.json` and fill in your servers. One server per account keeps the access matrix explicit — `personal`, `work`, etc.
- **Anything else:** IMAP/CalDAV scripts or your harness's built-in connectors, feeding the same files (`state/comms-queue.json`, calendar snapshots).

**The Google OAuth trap (a week of pain, condensed):** an OAuth app left in "Testing" mode expires its refresh tokens every 7 days — your loops die weekly, and re-auth becomes a ritual. Publish the app to production status in the Google Cloud console (no verification needed for your own scopes/personal use) and mint tokens AFTER publishing; those persist. Store tokens only in untracked paths.

**Verify:** run your harness with the mail server configured and ask for today's unread count on each account; check a calendar read returns tomorrow's events. Calendar is the source of truth for dates — never let the agent infer a day-of-week (`AGENTS.md` cross-domain rules).

## 4. Reminders / task queue

Two lists matter:

- **Your task system** (Apple Reminders, Todoist, whatever): the agent reads and creates; completing/deleting stays Tier 3.
- **The agent queue:** a dedicated list literally named for your agent ("Laila"). List MEMBERSHIP is the signal that an item is FOR the agent — and queue items still default to Tier 3 propose (`config/autonomy-rules.json` → `agent_queue`).

macOS note: Apple Reminders automation works via `osascript`, and headless (launchd) contexts hit TCC permission walls — grant permissions interactively first, and see `launchagents/README.md` for the workarounds.

**Verify:** the agent can list your reminders interactively, and an item you drop in the agent-queue list shows up in its next processing pass.

## 5. Dead-man switches (healthchecks.io)

Every loop pings a [healthchecks.io](https://healthchecks.io) check on success; the SERVICE alerts you when pings stop. Silence-as-failure is the design — a crashed loop can't report itself. Create one check per loop (free tier is fine), match each check's schedule + grace to the loop's schedule, and paste the ping URLs into `.env` (`HC_*_URL`). Full pattern: `docs/background-monitoring.md`.

**Verify:** run `bash scripts/heartbeat.sh` once; the check on healthchecks.io flips to "up".

## 6. The CRM (optional but recommended)

Self-hosted Twenty for contacts, pipeline, and goals — setup, worked queries, and gotchas in `docs/crm-twenty.md`. Skippable at first: everything degrades to the markdown tracking files.

## 7. Retrieval index (optional)

Once your knowledge and state files carry real content, give agents search instead of just grep. Index the memory folders (knowledge/, domains/*/tracking/, state/daily-notes/, state/briefs/) as collections in any hybrid-search tool. The reference system uses `qmd`, an open-source markdown search tool that combines BM25, embeddings, and reranking, and also runs as an MCP server agents can call as a tool. Design notes and the no-graph-database rationale live in `knowledge/README.md`, under "The Retrieval Layer."

**Verify:** a search for a fact you know is in one specific file returns that file first.

## 8. Background loops

Only after steps 2-5 verify: copy the `launchagents/*.template` plists, fill in paths, and load them (`launchagents/README.md`; cron/systemd equivalents noted there). Set `AGENT_RUN` in `.env` to your harness's non-interactive command (`docs/headless-sessions.md`).

**Verify:** each loop's log in `/tmp/` shows a clean run, `state/loops-registry.json` reflects reality, and every dead-man switch is green.

## 9. First week

Run the rituals manually before trusting them scheduled: a `daily-brief` in the morning, `session-wrap` at the end of every working session, and read `skills/laila-os-judgment` once end to end — it's the discipline the whole system assumes. Then check the autonomy audit log (`state/autonomy-audit.json`) after a few days: everything the system did on its own should be there, and nothing in it should surprise you. If something does, tighten `config/autonomy-rules.json` — the rules file is yours.
