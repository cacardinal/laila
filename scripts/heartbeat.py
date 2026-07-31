#!/usr/bin/env python3
"""Laila-OS Heartbeat — active-task staleness checker.

Reads state/active-tasks.json, runs the appropriate check per task, updates
last_checked timestamps, moves finished tasks into the completed archive, and
emits alerts for stale or completed work.

Task ownership model:
  owner: "alex"  — Alex does the work; Laila only reminds (72h staleness).
  owner: "laila" — Laila monitors/executes; tighter loop (48h staleness).

Check methods (per-task "check_method" field):
  manual     — staleness based on last_checked timestamp (default)
  git_branch — recent commit activity; check_target = "/path/to/repo:branch"
  (add your own: write a check_* function and wire it into check_task)

Output protocol (stdout, consumed by scripts/heartbeat.sh):
  CHECKED:<summary>   N tasks checked, no alerts
  ALERT:<messages>    one or more alerts (wrapper routes to Telegram)
  NONE                nothing to check
  ERROR:<message>     hard failure

Runs every 30 minutes via launchagents/com.lailaos.heartbeat.plist.template.
"""

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# ─── Configuration ───────────────────────────────────────────────────────────

ROOT = Path(os.environ.get("LAILA_OS_ROOT", Path(__file__).resolve().parent.parent))
TASKS_FILE = ROOT / "state" / "active-tasks.json"
STATE_FILE = ROOT / "state" / "heartbeat-last.json"
DAILY_NOTES_DIR = ROOT / "state" / "daily-notes"

NOW = datetime.now(timezone.utc)
TODAY = datetime.now().strftime("%Y-%m-%d")

STALE_HOURS_LAILA = 48  # laila-owned tasks: alert after 48h without a check
STALE_HOURS_ALEX = 72   # alex-owned tasks: alert after 72h without activity

TERMINAL_STATUSES = ("completed", "cancelled", "done")

# Set True when a load hits a corrupt file. main() then skips the matching save
# so this run never overwrites the quarantined evidence with an empty default.
TASKS_CORRUPT = False
STATE_CORRUPT = False


# ─── State management ────────────────────────────────────────────────────────

def _timestamped_corrupt(path: Path) -> Path:
    """A timestamped '.corrupt' aside so repeat corruption never clobbers evidence."""
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return path.with_name(path.name + f".{stamp}.corrupt")


def load_json(path: Path, default: dict, corrupt_flag: str) -> dict:
    """Load a JSON state file. On corruption, quarantine it aside (never crash-loop)."""
    if path.exists():
        try:
            with open(path) as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            print(f"  WARNING: corrupt file {path.name}: {e}", file=sys.stderr)
            globals()[corrupt_flag] = True
            try:
                path.rename(_timestamped_corrupt(path))
            except OSError:
                pass
    return default


def save_json_atomic(path: Path, data: dict):
    """Write JSON atomically (temp file + rename) so a crash never truncates state."""
    tmp = path.with_suffix(".json.tmp")
    with open(tmp, "w") as f:
        json.dump(data, f, indent=2)
    tmp.rename(path)


# ─── Check methods ───────────────────────────────────────────────────────────

def check_git_branch(target: str) -> dict:
    """Recent commit activity on a branch. Target: /path/to/repo:branch-name."""
    if not target or ":" not in target:
        return {"status": "unknown", "detail": "Invalid target format"}

    repo_path, branch = target.rsplit(":", 1)
    repo_path = os.path.expanduser(repo_path)
    if not os.path.isdir(repo_path):
        return {"status": "unknown", "detail": f"Repo not found: {repo_path}"}

    try:
        result = subprocess.run(
            ["git", "-C", repo_path, "log", "-1", "--format=%ci", branch],
            capture_output=True, text=True, timeout=10,
        )
        if result.returncode != 0:
            return {"status": "unknown", "detail": f"Branch {branch} not found"}
        stamp = result.stdout.strip()
        if not stamp:
            return {"status": "no_activity", "detail": "No commits on branch"}
        last_commit = datetime.strptime(stamp[:19], "%Y-%m-%d %H:%M:%S")
        hours_ago = (datetime.now() - last_commit).total_seconds() / 3600
        if hours_ago < 24:
            return {"status": "active", "detail": f"Last commit {hours_ago:.0f}h ago"}
        if hours_ago < 72:
            return {"status": "idle", "detail": f"Last commit {hours_ago:.0f}h ago"}
        return {"status": "stale", "detail": f"Last commit {hours_ago:.0f}h ago"}
    except Exception as e:  # noqa: BLE001 — a check must never kill the loop
        return {"status": "error", "detail": str(e)}


def check_manual(task: dict) -> dict:
    """Staleness based on the last_checked timestamp and the owner's threshold."""
    last_checked = task.get("last_checked", "")
    if not last_checked:
        return {"status": "stale", "detail": "Never checked"}
    try:
        last = datetime.fromisoformat(last_checked)
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        hours = (NOW - last).total_seconds() / 3600
        threshold = STALE_HOURS_LAILA if task.get("owner") == "laila" else STALE_HOURS_ALEX
        if hours < threshold:
            return {"status": "ok", "detail": f"Checked {hours:.0f}h ago"}
        return {"status": "stale",
                "detail": f"Last checked {hours:.0f}h ago (>{threshold}h threshold)"}
    except ValueError:
        return {"status": "unknown", "detail": "Invalid timestamp"}


def check_task(task: dict) -> dict:
    method = task.get("check_method", "manual")
    target = task.get("check_target")
    if method == "git_branch" and target:
        return check_git_branch(target)
    return check_manual(task)


# ─── Daily note append ───────────────────────────────────────────────────────

def append_to_daily_note(alerts: list):
    """Findings land in today's daily note so the next session sees them."""
    if not alerts:
        return
    DAILY_NOTES_DIR.mkdir(parents=True, exist_ok=True)
    note = DAILY_NOTES_DIR / f"{TODAY}.md"
    stamp = datetime.now().strftime("%I:%M%p").lower().lstrip("0")
    entry = f"\n### Heartbeat ({stamp})\n" + "".join(f"- {a}\n" for a in alerts)
    if note.exists():
        with open(note, "a") as f:
            f.write(entry)
    else:
        with open(note, "w") as f:
            f.write(f"# Daily Note — {TODAY}\n\n## Session Log\n{entry}")


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    data = load_json(TASKS_FILE, {"last_updated": None, "tasks": [], "completed": []},
                     "TASKS_CORRUPT")
    state = load_json(STATE_FILE, {"last_run": None, "alerts_sent": []},
                      "STATE_CORRUPT")
    tasks = data.get("tasks", [])

    alerts = []
    checked = 0

    if TASKS_CORRUPT:
        alerts.append("[HEARTBEAT] active-tasks.json was corrupt — quarantined aside; "
                      "skipped save to preserve evidence")
    if STATE_CORRUPT:
        alerts.append("[HEARTBEAT] heartbeat-last.json was corrupt — quarantined aside; "
                      "skipped save to preserve evidence")

    for task in tasks:
        if task.get("status") in TERMINAL_STATUSES:
            continue
        result = check_task(task)
        checked += 1
        task["last_checked"] = NOW.isoformat()

        status = result.get("status", "unknown")
        detail = result.get("detail", "")
        print(f"  [{task.get('id', '?')}] {task.get('title', '?')}: {status} — {detail}",
              file=sys.stderr)

        if status == "stale":
            alerts.append(
                f"[{task.get('domain', '?').upper()}] Stale ({task.get('owner', 'alex')}): "
                f"{task.get('title', '?')} — {detail}"
            )

    # Prune terminal tasks: MOVE them into data['completed'] (all fields preserved)
    # with a completed_at stamp instead of deleting. Keeping the record means task
    # IDs are never reused and "completed since morning" reports can read them.
    completed = data.setdefault("completed", [])
    completed_ids = {c.get("id") for c in completed if c.get("id")}
    still_active = []
    for t in tasks:
        if t.get("status") in TERMINAL_STATUSES:
            if t.get("id") in completed_ids:
                continue  # already archived — do not duplicate
            t.setdefault("completed_at", NOW.isoformat())
            completed.append(t)
        else:
            still_active.append(t)
    data["tasks"] = still_active

    if not TASKS_CORRUPT:
        data["last_updated"] = NOW.isoformat()
        save_json_atomic(TASKS_FILE, data)

    if alerts:
        state.setdefault("alerts_sent", []).extend(
            {"time": NOW.isoformat(), "alert": a} for a in alerts
        )
    if not STATE_CORRUPT:
        state["last_run"] = NOW.isoformat()
        state["alerts_sent"] = state.get("alerts_sent", [])[-100:]
        save_json_atomic(STATE_FILE, state)

    append_to_daily_note(alerts)

    # Alerts first — they must never be swallowed by NONE.
    if alerts:
        print(f"ALERT:{'; '.join(alerts)}")
    elif not tasks:
        print("NONE")
    else:
        print(f"CHECKED:{checked} tasks checked, 0 alerts")


if __name__ == "__main__":
    main()
