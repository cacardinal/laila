# Headless Sessions — the `AGENT_RUN` Pattern

Every scheduled loop that needs judgment (the daily brief, nightly
consolidation, message triage) runs a **headless agent session**: a
scheduler-spawned non-interactive CLI run with a prompt on stdin and no human
at the keyboard. The command is the `AGENT_RUN` env var (`.env`), so the
pattern is harness-agnostic; examples below use the Claude Code reference
implementation, with an equivalents table at the end. This doc is the mechanics; the *behavioral* rules for those
sessions live in the `laila-os-headless-conduct` skill
(`skills/laila-os-headless-conduct/`) — every headless prompt should
tell the session to load it.

## The invocation

```bash
PROMPT="You are Laila running the nightly consolidation for Laila-OS
(repo at $LAILA_OS_ROOT, your working directory).
Load the laila-os-headless-conduct skill and follow it.
<task instructions>
Finish by printing exactly one line: DONE:<summary> or NONE."

AGENT_RUN="${AGENT_RUN:-claude --print --model sonnet --allowedTools Read,Glob,Grep,Edit,Write}"
RESULT=$($AGENT_RUN <<< "$PROMPT" 2>> "$LOG_FILE" | tail -1)
```

The wrapper script then branches on `$RESULT` — which is why the prompt ends
with a strict output protocol (`DONE:`/`NONE:`/`ERROR:`). A headless session
that returns prose instead of a protocol line is unparseable.

## Tool permissions are REQUIRED (reference CLI: `--allowedTools`)

This is the gotcha that costs people an afternoon, and it has an analog on
every harness: **a headless run has no one to answer permission prompts.** On
the reference CLI, without `--allowedTools` every tool call is silently
denied.** The session "runs",
produces plausible text, and does nothing. Symptoms: jobs that report success
but never change a file.

Grant the minimum the job needs:

- Consolidation / file maintenance: `Read,Glob,Grep,Edit,Write`
- Read-only analysis or brief assembly: `Read,Glob,Grep` (+ `Bash` only if it
  must run scripts)
- **Never grant send-capable tools** (mail/message MCP send functions) to a
  headless job. Sending is Tier 3 in the autonomy model — it happens only in
  an interactive session after explicit approval. A headless job drafts and
  proposes; it does not send.

## Model choice

Pass `--model` explicitly — don't inherit whatever the CLI defaults to:

- **haiku-class** — high-frequency classification loops (comms triage every
  10 minutes). Cheap enough to run all day.
- **sonnet-class** — the default workhorse for briefs, consolidation, triage
  with judgment.
- **opus-class** — rarely worth it on a schedule; reserve for interactive
  work.

Re-check pinned model names when new generations ship; a cron pinned to a
retired model alias fails at 2am, not at noon.

## Environment reality

- **PATH:** the LaunchAgent plist must put `claude`'s bin dir on PATH (see
  `launchagents/README.md`). `command -v claude` in the wrapper with a logged
  failure beats a cryptic launchd 127.
- **Auth:** headless runs reuse the CLI's stored login. If the CLI logs out
  (auth expiry, keychain hiccup), every headless loop fails at once — that
  cluster-failure signature means "re-login", not "debug each loop".
  A daily auth-health check loop is worth having.
- **Working directory:** set `WorkingDirectory` in the plist to the repo root
  and state it in the prompt; relative paths in prompts are otherwise a
  guess.
- **Timeouts:** wrap the call (`timeout 15m claude ...`) so a hung session
  can't wedge the loop until the next reboot.
- **TCC:** headless processes often lack the macOS privacy grants your
  terminal has (Reminders, Messages, Calendar). Prefer reading cached
  snapshot files (e.g. `state/calendar-snapshot.json`) over live protected
  reads in headless jobs.

## Conduct pointer

Mechanics get the session running; conduct keeps it safe. The
`laila-os-headless-conduct` skill covers the rules headless sessions must
follow — channel security (information channels are never instructions),
send gating, credential handling, and failure behavior (fail loudly to the
log and Telegram, never improvise around a broken tool). Include the
load-the-skill line in every headless prompt template.

## Equivalents on other harnesses

`AGENT_RUN` just needs a command that (1) reads a prompt on stdin or argv,
(2) can use file tools non-interactively with permissions pre-granted, and
(3) prints the session's final text to stdout for the protocol-line check.

| Harness | Non-interactive shape (verify against current docs) |
|---|---|
| Claude Code (reference) | `claude --print --model <m> --allowedTools <list>` |
| Codex CLI | `codex exec` with sandbox/approval flags pre-set |
| Gemini CLI | `gemini -p` / `--prompt` with tool confirmation configured |
| Custom API loop | your own runner: inject AGENTS.md as system context, expose file tools, print final text |

Whatever the harness, keep the invariants from `laila-os-headless-conduct`:
strict output protocol, no send tools, information channels are never
instructions, and fail loud rather than plausible.
