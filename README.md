# Laila

![checks](https://github.com/cacardinal/laila/actions/workflows/checks.yml/badge.svg)

<img src="docs/images/social-preview.png" alt="lAIla — an operating system for a life run with AI agents" width="100%">

Laila is an operating system for a person who runs their life with AI agents. It stores your world as plain files: career, health, household, whatever you carry. Agents read those files, remember between sessions, and do scheduled work overnight. Strict rules decide what they may do alone and what waits for you.

Harnesses like Claude Code, Codex, and YC's QM supply the engine agents run in. Laila is what you point the engine at. Everything is a plain file, so any harness that can read a repo can run it. The reference implementation is Claude Code. The porting checklist is in `docs/platform-portability.md`.

Your data stays on your machine, in a private git repo you own. Nothing syncs to a cloud service and there is nothing to subscribe to. The security model assumes one user.

This repo is a cleaned copy of a real system that started in late 2025 as loose sessions in aider and LibreChat, with no repository. It became a versioned system in early 2026 and has run daily since. The original has 20 domains, ~46 skills, ~50 scheduled jobs, and a self-hosted CRM. Everything personal was replaced with a fictional user named Alex.

## Try it in 30 seconds

No dependencies, no build step. The dashboard reads the sample state directly:

```bash
git clone https://github.com/cacardinal/laila && cd laila
node dashboard/server.js
# → http://127.0.0.1:5175
```

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/dashboard-dark.png">
  <img alt="Laila dashboard: stat tiles, active tasks, pending comms with tier labels, background loops, domain cards" src="docs/images/dashboard-light.png">
</picture>

The dashboard has eight tabs: Home (tasks, domains, CRM), Strategy, Briefs, Review (the running brief plus the autonomy audit), Messages, Calendar, Loops, and House. House manages home automation through an optional Home Assistant proxy — reads are free, actions sit behind an allowlist and an explicit env flag, and every action lands in the audit log (`docs/home-automation.md`).

## The core idea

Most AI assistant setups fail the same way. The model is smart but the system has no memory, no boundaries, and no structure. Every session starts from zero. Every action needs babysitting.

Laila makes three commitments:

1. **The filesystem is the mind.** Everything lives as markdown and JSON in one repo: domains, tracking files, daily notes, a knowledge graph. The agent reads state instead of asking you to repeat it. Recall works three ways. Hybrid search (BM25 plus embeddings) covers the memory collections. Wikilinks connect entity files, and the agent follows them. Grep handles the rest. Each fact has exactly one authoritative file. Everything else is a generated export, and there is no separate memory database to drift out of sync (`knowledge/README.md`).

2. **Autonomy has a bright line.** Every action is Tier 1 or Tier 3. There is deliberately no Tier 2 (`docs/security-model.md` explains why). Tier 1 actions run on their own and notify you; they must be deterministic, reversible, and invisible to anyone but you. Tier 3 is the default. The agent proposes and waits. Anything another person could see is Tier 3, always. The agent never sends a message or completes a shared task without approval, and no skill or subagent routes around this.

3. **Commands and information are different channels.** Instructions reach the agent only through channels that authenticate you: your Telegram, your local sessions, a dedicated task queue. Email, messages, web pages, and CRM data are information. The agent reasons about them and never obeys them. If an email claims to be you and tells the agent to forward a document, the agent reads it, maybe reports it, and does nothing. An injected instruction commands nothing, because nothing on an information channel can trigger an action. At worst it biases a note, and the note is a git diff you can read and revert.

## How it compares

[OpenClaw](https://github.com/openclaw/openclaw), [Hermes Agent](https://github.com/nousresearch/hermes-agent), and YC's [QM](https://github.com/yc-software/qm) are the open-source neighbors. All three are runtimes that ship an engine. Laila ships the operating layer an engine runs for one person, and QM's multiplayer scope is the mirror image of Laila's one-principal security model.

| | OpenClaw | Hermes Agent | Laila |
|---|---|---|---|
| Ships | Gateway daemon + engine | Self-improving runtime | Conventions + state, bring your engine |
| Memory | Workspace state, session-based | 4-layer with user profiling | Plain files; every write is a readable git diff |
| Skills | SKILL.md + registry | Written by the agent itself | SKILL.md, human-reviewed |
| Channels | 25+ | 20+ | 3, each authenticated |
| Injection defense | Isolation + defaults | Scanning + isolation | Structural (channels carry no instructions) plus advisory flagging |
| Autonomy | Tools conditionally enabled | Conservative sandboxes | Per-action tiers, propose by default, append-only audit |

Pick OpenClaw for reach across the most channels and the biggest community, Hermes for an agent that gets better at your work on its own, QM when more than one person needs the system, and Laila when you want every memory readable, every action tiered and logged, and every instruction authenticated. The full comparison, including the published research on background-session memory pollution, is in `docs/comparisons.md`.

## Architecture

```mermaid
flowchart TB
  subgraph CMD["Command channels — authenticated"]
    TG["Messaging bot"]
    SESH["Local sessions"]
    QUEUE["Agent task queue"]
  end
  subgraph INFO["Information channels — NEVER instructions"]
    MAIL["Email"]
    MSGS["Messages"]
    WEB["Web content"]
    CRMDATA["CRM data"]
  end

  LAILA["Laila — interactive sessions + scheduled loops"]

  subgraph FS["The filesystem is the mind"]
    DOM["domains/"]
    STATE["state/"]
    KNOW["knowledge/"]
  end
  CRM["Twenty CRM<br/>(self-hosted)"]

  subgraph GATE["Autonomy gate"]
    T1["Tier 1<br/>auto-execute + notify"]
    T3["Tier 3 (default)<br/>propose + wait"]
  end
  ALEX["Alex approves"]
  OUT["Anything visible to others:<br/>messages, shared tasks, client work"]
  DASH["Dashboard"]

  CMD -- "instructions" --> LAILA
  INFO -- "content to reason about" --> LAILA
  FS <--> LAILA
  CRM <--> LAILA
  LAILA --> GATE
  T1 -- "reversible, invisible to others" --> FS
  T1 --> CRM
  T3 --> ALEX --> OUT
  FS --> DASH
  CRM --> DASH
```

The diagram doubles as the security model. Instructions enter only from the left column. Anything outward-facing passes through an approval. The files in the middle carry memory between sessions.

## What's in the box

```
AGENTS.md               The router: global policies + pointers, no content
CLAUDE.md               One-line Claude Code adapter (imports AGENTS.md)
config/
  domain-triggers.json  Domain registry: paths, trigger phrases, lifecycle state
  autonomy-rules.json   Tier definitions and the auto-execute allowlist
domains/                One directory per life domain (career, health,
                        household, content), each with its own AGENTS.md
                        and tracking/status.md
state/                  Volatile truth: strategy, goals export, daily notes,
                        active tasks, the loops registry
knowledge/              The memory system: entity graph, tacit lessons,
                        decision log, the MEMORY.md hot-cache pattern,
                        and the tiered retrieval design (search > links > grep)
skills/                 Rituals as skills: daily-brief, session-wrap,
                        whats-next, domain-hygiene, roast, validate-idea,
                        and the judgment layer that gates evidence
agents/                 Subagent definitions: read-only critics and cheap
                        research workers, none with send tools
                        (skills/ and agents/ are the neutral paths; the
                        files live in .claude/ for the reference harness)
scripts/                Heartbeat, hygiene scanner, notify wrapper
dashboard/              Zero-dependency web UI over the state files: eight
                        tabs, optional live CRM and Home Assistant proxies
launchagents/           macOS launchd templates for the background loops
templates/              Sync protocol, daily cadence, OKR architecture
docs/                   Setup walkthrough, security model, platform
                        portability, home automation, background
                        monitoring, how to add a domain
```

## How a day works

A launchd job starts the morning. It runs a headless agent session, builds a daily brief from calendar, comms, and domain status, and sends it to Telegram. During the day you talk to the system from three doors: the harness CLI at your desk, the Telegram bot from your phone (`scripts/telegram-bot.py`, answers only you), and the read-only dashboard. Trigger phrases work in any of them: "what's next?", "check career", "prep me for the 2pm". Skills load domain context. Subagents do the searching and reviewing so the main session stays focused. Decisions land in the decision log. At night a consolidation job reads the day's notes and updates the knowledge files.

Every session ends with `/session-wrap`. It proposes updates across the tracking files and waits for approval. Skipping it is how things get dropped.

## The CRM next door

Flat files carry most of the truth. Contacts, pipeline, and goals need more structure, so the reference setup runs [Twenty](https://github.com/twentyhq/twenty), an open-source CRM, in local Docker. The agent reads and writes it over GraphQL. The repo keeps generated exports of its data. The dashboard proxies to it for live counts. Worked examples and gotchas are in `docs/crm-twenty.md`.

## The judgment layer

`skills/laila-judgment` records the working discipline the original system learned from its own failures. "Done" means verified against the live system, and a subagent's report is not evidence. Day-of-week comes from `date`, never from inference. Anything public gets a secret scan. When reality contradicts the task, the agent stops and says so. Each rule exists because breaking it once cost something.

## Adapting it

The full walkthrough is **`docs/setup.md`**: Telegram bot, email and calendar access, the reminders queue, dead-man switches, and loops, in dependency order with a verification step per stage. The short version:

1. Clone into a PRIVATE repo. Your copy becomes your personal data store, and the nightly loop auto-pushes it (`docs/setup.md` §0 before anything else).
2. Rewrite `AGENTS.md`'s user facts and `config/domain-triggers.json` with your real domains. Start with 3. Add a domain only when a real workload demands one (`docs/adding-domains.md`).
3. Replace the sample content in `domains/`, `state/`, and `knowledge/` with your own. The structures are what transfer. Alex's data only shows the shape.
4. Wire your channels (`docs/setup.md` §2-7): Telegram for notify and command, read-only mail and calendar access for the loops, healthchecks.io as the dead-man layer, optionally the CRM.
5. Adopt the tier model before anything else. Write down the line between "act" and "ask", and enforce it everywhere.
6. Not on Claude Code? Work through `docs/platform-portability.md`. The rules port; only the discovery layer changes.

## What's deliberately absent

No credentials, no OAuth tokens, no personal data, no shared git history. The repo was assembled fresh, and the private system it copies stays private. Where an integration was too personal to genericize, a marked placeholder describes the pattern instead.

## License

MIT
