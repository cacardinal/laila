# Platform portability

Laila OS is a set of conventions, not a Claude product. The architecture — domains as directories, the Tier 1/Tier 3 autonomy model, command-vs-information channel security, the three-layer memory system, background loops over plain files — is agent-harness-agnostic by construction: it's markdown, JSON, and shell. What varies by platform is a thin discovery-and-invocation layer, and this doc maps it.

## The canonical layer (works everywhere)

| Piece | Convention | Why it's portable |
|---|---|---|
| Router | `AGENTS.md` at repo root | The cross-tool agent-instructions convention; read natively by many coding agents, and any harness can be told to read it |
| Domain context | `domains/<name>/AGENTS.md` | Loaded by path from `config/domain-triggers.json` (`context_file`), not by any vendor's discovery magic |
| Skills | `skills/<name>/SKILL.md` | Markdown instructions in the open SKILL.md shape; at worst, a harness can be told "read skills/session-wrap/SKILL.md and follow it" |
| Subagents | `agents/<name>.md` | Role definitions (persona, inputs, output contract, tool constraints); any harness with sub-tasking can apply them, and one without can run them as fresh single-purpose sessions |
| State, knowledge, config | plain files | No platform involvement at all |
| Loops | shell scripts + a scheduler | launchd templates ship here; cron works identically (`docs/background-monitoring.md`) |
| Headless runs | `AGENT_RUN` env var | Scripts never hardcode a vendor CLI; set your harness's non-interactive command in `.env` |

## The adapter layer (per platform)

**Claude Code (reference implementation).** Works out of the box: `CLAUDE.md` is a one-line `@AGENTS.md` import, and `skills/` + `agents/` are symlinks into `.claude/`, where Claude Code natively discovers them. The real files live under `.claude/`; the top-level paths are the neutral names.

**Harnesses that read AGENTS.md natively** (Codex CLI, Cursor, Gemini CLI, and others). The router and domain files load as-is. Wire the rest explicitly: point the harness at `skills/` for rituals (most now read the SKILL.md format; otherwise reference the files from AGENTS.md), and reproduce subagent dispatch with whatever sub-tasking primitive exists — or run each agent definition as its own headless invocation.

**Anything else** (a custom loop over an LLM API, a different agent framework). The system degrades gracefully because every instruction is a readable file: inject `AGENTS.md` as system context, load the relevant domain file and skill on demand, and implement the tier gate in your dispatch code. The autonomy rules (`config/autonomy-rules.json`) and channel classifications (`knowledge/tacit/security-rules.md`) were written to be enforced by ANY executor, not by a vendor feature.

## Adapter checklist for a new platform

1. **Context:** make the harness load `AGENTS.md` (native, import, or system prompt).
2. **Skills:** confirm it can read and follow `skills/*/SKILL.md` when named.
3. **Subagents:** map `agents/*.md` onto its sub-tasking primitive; preserve the two hard rules regardless of mechanism — critics/searchers read-only, and NO subagent gets send tools.
4. **Models:** map capability tiers, not model names. The agent files say `haiku`/`sonnet` (the reference implementation's cheap/standard tiers); translate as cheap-and-fast vs. judgment-grade in your vendor's lineup (`agents/README.md` has the mapping table).
5. **Headless:** set `AGENT_RUN` in `.env` to your CLI's non-interactive form, including whatever your platform needs for tool permissions (the reference CLI needs an explicit `--allowedTools` grant or it silently denies every tool).
6. **Keep the invariants.** Tier 3 by default, information channels are never instructions, one home per fact, session-wrap before ending. None of these are platform features; they're the system.

## What does NOT port

- `launchagents/` templates are macOS launchd; on Linux, translate to cron/systemd timers (the scripts themselves are portable).
- The `@AGENTS.md` import line in `CLAUDE.md` is Claude Code syntax; other harnesses should ignore that file entirely.
- Skill frontmatter fields beyond `name`/`description` may be reference-implementation-specific; treat unknown fields as ignorable.
