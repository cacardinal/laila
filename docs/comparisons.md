# How Laila compares

Three open-source neighbors come up in every conversation about personal agents: YC's [QM](https://github.com/yc-software/qm), [OpenClaw](https://github.com/openclaw/openclaw), and Nous Research's [Hermes Agent](https://github.com/nousresearch/hermes-agent). All three are good projects. This page maps the trade-offs honestly, because the tools differ mainly in how much you can check your agent's work.

## The category difference

QM, OpenClaw, and Hermes are runtimes. Each ships an engine, a process that hosts sessions, connects channels, runs tools, and manages its own memory. Laila ships no engine. It is the operating layer that an engine runs for one person. That layer holds the files, the memory conventions, the autonomy rules, and the security model. The reference implementation runs on Claude Code, and the conventions port to any harness that can read a repo (`docs/platform-portability.md`).

The overlap with OpenClaw is friendly. OpenClaw's workspace reads `AGENTS.md` and `SKILL.md` files, the same conventions Laila uses. Running Laila's file layer inside OpenClaw's engine looks like a straightforward port.

## QM, briefly

QM is multiplayer by design, with shared workspaces, per-person scopes, Slack and web UIs, and admin governance. It is built for a company running agents across a team, where Laila is built for one person running their own life. Laila's security model depends on exactly one principal, and features that need shared scopes are out of scope on purpose.

## OpenClaw

OpenClaw is the most connected personal agent available, with a local-first gateway daemon, 25+ messaging channels, a skill registry, and a very large community. Install is one command. If you live across many chat platforms and want an assistant present in all of them, it is the strongest option and Laila does not try to match its breadth.

The trade-off shows up in how OpenClaw's background sessions handle memory. A [2026 study](https://arxiv.org/abs/2603.23064) reported that OpenClaw's heartbeat sessions share context with user chat, which lets content from scanned email or feeds enter agent memory and influence later behavior, with cross-session behavioral influence reaching 76 percent and routine memory-saving promoting that short-term pollution into durable long-term memory at rates up to 91 percent. That is an architectural property. Scanned content and user intent share the same context window.

Laila's architecture separates those streams. Email, messages, and web content are information channels that cannot carry instructions, no matter what they say. Background loops run isolated sessions with no send tools. Memory writes land in plain files, so every change your agent remembers is a git diff you can read. An injected email can, at worst, bias a note that you can see and revert. It cannot trigger an action; actions still require tier approval.

## Hermes Agent

Hermes is the most self-improving of the three. It profiles its user over time, and it writes its own skills. On a fixed cadence it evaluates its performance, extracts reusable patterns, and loads new skill files it authored itself. Its memory system (dialectic user modeling, full-text search, procedural hot/cold storage) is more sophisticated than Laila's file layers, and its sandbox defaults plus prompt-injection scanning are genuinely conservative.

Laila refuses the self-writing part on purpose. A Laila skill is a reviewed artifact that changes only in a session you supervised. That is slower than letting the agent rewrite itself, but its behavior only changes in sessions you reviewed. Laila scans too. The comms triage flags instruction-like content in email and messages (`injection_flag`), and the comms workflow surfaces every flag to you. The difference is what the scan protects. In a scanning-first design the scanner is the gate, so a bypass is a compromise. In Laila the flag is telemetry over a structural guarantee: information channels cannot carry instructions by construction, so an injection that slips past unflagged still commands nothing. The guarantee is a property of the wiring. No code path hands an information-reading session a send tool: background loops run under explicit tool grants that exclude sending, subagent definitions omit send tools, and a send happens only in an interactive session after you approve it. The flag keeps you informed, and the guarantee holds even when the flag misses.

## Side by side

| | OpenClaw | Hermes Agent | Laila |
|---|---|---|---|
| Ships | Gateway daemon + engine | Self-improving runtime | Conventions + state, bring your engine |
| Memory | Workspace state, session-based | 4-layer with user profiling | 3-layer plain files; every write is a readable git diff |
| Skills | SKILL.md + registry | Written by the agent itself | SKILL.md, human-reviewed |
| Channels | 25+ | 20+ | 3, each authenticated |
| Injection defense | Isolation + defaults | Scanning + isolation | Structural (channels carry no instructions) plus advisory flagging |
| Autonomy | Tools conditionally enabled | Conservative sandboxes | Per-action tiers, propose by default, append-only audit |
| Data | Local-first workspace | Disk-first, small-VPS friendly | Plain files in a private git repo you own |

## Choosing

Pick OpenClaw for reach, with the most channels, the biggest community, and the fastest start. Pick Hermes if you want an agent that compounds, getting better at your work on its own. Pick QM when more than one person needs the system. Pick Laila when you want every memory readable, every action tiered and logged, and every instruction authenticated, on whatever engine you prefer.

These are trade-offs, and where you land depends on what you value most. Laila's constraints are documented the same way as everything else in this repo, in files you can read and check into git.
