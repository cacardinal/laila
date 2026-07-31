# LaunchAgents — Background Loops (macOS)

Every background loop in Laila runs as a launchd LaunchAgent. The
`*.plist.template` files here are the repo copies; installed copies live in
`~/Library/LaunchAgents/`. The repo is the source of truth — edit here,
reinstall, never edit the installed copy directly.

## Install

```bash
cd "$LAILA_OS_ROOT/launchagents"

# 1. Fill in the placeholders and drop the .template suffix.
#    __HOME__          -> your home directory
#    __NODE_VERSION__  -> your node dir name (note the "v" prefix, e.g. v22.0.0)
for t in *.plist.template; do
  sed -e "s|__HOME__|$HOME|g" \
      -e "s|__NODE_VERSION__|v22.0.0|g" \
      "$t" > ~/Library/LaunchAgents/"${t%.template}"
done

# 2. If your repo is not at ~/laila, also fix the paths inside each plist.

# 3. Load
launchctl load ~/Library/LaunchAgents/com.lailaos.heartbeat.plist
launchctl load ~/Library/LaunchAgents/com.lailaos.nightly-consolidation.plist
launchctl load ~/Library/LaunchAgents/com.lailaos.daily-brief.plist
```

Reload after editing: `launchctl unload <plist> && launchctl load <plist>`.
Trigger a run immediately: `launchctl start com.lailaos.heartbeat`.
Check it's loaded: `launchctl list | grep lailaos`.

## The shipped loops

| Plist | Schedule | Runs |
| --- | --- | --- |
| `com.lailaos.heartbeat` | every 30 min | `scripts/heartbeat.sh` — active-task staleness checks |
| `com.lailaos.nightly-consolidation` | daily 2:00am | `scripts/nightly-consolidation.sh` — daily notes -> knowledge/ |
| `com.lailaos.daily-brief` | daily 5:00am | `scripts/daily-brief.sh` — YOUR runner (not shipped; see `docs/headless-sessions.md` for the pattern) |

## Headless gotchas (read before debugging a "dead" loop)

**PATH is minimal.** launchd does not run your shell profile. If a script needs
`python3`, `node`, or your agent CLI (e.g. `claude`), the plist's `EnvironmentVariables > PATH` must
include their bin dirs. NVM paths include a `v` prefix
(`~/.nvm/versions/node/v22.0.0/bin`) — a missing `v` is a classic silent
failure. Verify with `which node` / `which claude` in a normal shell and copy
the dirs in.

**Secrets come from `.env`, not the plist.** Scripts `source
"$LAILA_OS_ROOT/.env"` themselves. Do not paste tokens into plists — installed
plists live outside the repo but are world-readable files.

**TCC permissions (macOS privacy).** Anything touching Reminders, Calendar,
Messages, or other protected data needs a TCC grant, and launchd-spawned
processes often don't inherit the grant you gave Terminal. Symptoms are hangs
or empty results, not errors. Patterns that help: invoke `python3` directly
(not via a bash wrapper) so the permission attributes to the right binary, add
a hard `timeout` around any call that can hang, and keep a no-permission
fallback (e.g. read a cached snapshot file instead of the live database).

**Logs or it didn't happen.** Every template routes stdout/stderr to
`/tmp/lailaos-*-std{out,err}.log`, and the wrapper scripts keep their own
rotating logs in `/tmp/`. First diagnostic step is always the stderr log.

**Dead-man switch.** A loop that stops running produces no error anywhere —
that's why each script pings a healthchecks.io URL (`HC_*` in `.env`) at the
end of every run. See `docs/background-monitoring.md`.
