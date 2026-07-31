#!/usr/bin/env python3
"""Domain status hygiene scanner.

Walks domains/*/tracking/*.md and flags stale content:
  1. "Last updated:" header older than the staleness threshold
  2. Unchecked `[ ]` checkboxes with an explicit deadline (by/due/target) in the past
  3. Table rows with status "Not Started"/"Pending"/"In Progress" that reference
     a date in the past

Usage:
  python3 scripts/domain-status-hygiene.py                 # human report to stdout
  python3 scripts/domain-status-hygiene.py --json          # machine-readable JSON
  python3 scripts/domain-status-hygiene.py --threshold 45  # staleness days (default 30)

Intended callers: a /domain-hygiene review skill (interactive batch cleanup) or
a weekly surface in the daily brief. The scanner only reports — a human (or an
approved interactive session) makes the edits.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, field, asdict
from datetime import date, datetime
from pathlib import Path

ROOT = Path(os.environ.get("LAILA_OS_ROOT", Path(__file__).resolve().parent.parent))
DOMAINS_DIR = ROOT / "domains"

# Files to scan within each domain's tracking/ dir
TRACKING_FILENAMES = ("status.md", "Next_Actions.md")

STATUS_KEYWORDS = frozenset({
    "not started", "pending", "in progress", "planned", "to do", "todo",
})

# Only flag checkboxes with an explicit deadline marker. Otherwise any date
# mention (e.g. "email sent Feb 17") causes false positives.
DEADLINE_RE = re.compile(r"\b(?:by|due|deadline|target|by:|due:|deadline:)\s+", re.IGNORECASE)

MONTH_MAP = {
    "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
    "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6, "jul": 7, "july": 7,
    "aug": 8, "august": 8, "sep": 9, "sept": 9, "september": 9,
    "oct": 10, "october": 10, "nov": 11, "november": 11, "dec": 12, "december": 12,
}

DATE_PATTERNS = [
    re.compile(r"\b(\d{4})-(\d{1,2})-(\d{1,2})\b"),                        # 2026-04-21
    re.compile(r"\b([A-Za-z]{3,9})\s+(\d{1,2})(?:,\s*|\s+)(\d{4})\b"),     # Apr 21, 2026
    re.compile(r"\b([A-Za-z]{3,9})\s+(\d{1,2})\b(?!\s*[,]?\s*\d{4})"),     # Apr 21 (bare)
    re.compile(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b"),                        # 4/21/2026
    re.compile(r"\b(\d{1,2})/(\d{1,2})\b(?!/\d)"),                         # 4/21 (bare)
]

HEADER_RE = re.compile(r"^\s*\*?Last updated:\s*([^*\n]+?)\s*\*?\s*$", re.IGNORECASE)
CHECKBOX_RE = re.compile(r"^\s*[-*]\s*\[\s\]\s*(.+)$")
TABLE_ROW_RE = re.compile(r"^\s*\|(.+)\|\s*$")


@dataclass
class Finding:
    domain: str
    file: str
    line: int
    kind: str  # "header_stale" | "past_checkbox" | "past_status_row" | "read_error"
    age_days: int | None
    snippet: str
    deadline: str | None = None


@dataclass
class DomainReport:
    domain: str
    file: str
    last_updated: str | None
    header_age_days: int | None
    findings: list[Finding] = field(default_factory=list)


def parse_date_candidates(text: str, today: date) -> list[date]:
    """Find any dates mentioned in the text."""
    results: list[date] = []

    for m in DATE_PATTERNS[0].finditer(text):
        try:
            results.append(date(int(m.group(1)), int(m.group(2)), int(m.group(3))))
        except ValueError:
            pass

    for m in DATE_PATTERNS[1].finditer(text):
        name = m.group(1).lower()
        if name in MONTH_MAP:
            try:
                results.append(date(int(m.group(3)), MONTH_MAP[name], int(m.group(2))))
            except ValueError:
                pass

    for m in DATE_PATTERNS[2].finditer(text):
        name = m.group(1).lower()
        if name in MONTH_MAP:
            try:
                candidate = date(today.year, MONTH_MAP[name], int(m.group(2)))
                # A bare date >6 months in the future probably meant last year.
                if (candidate - today).days > 180:
                    candidate = candidate.replace(year=today.year - 1)
                results.append(candidate)
            except ValueError:
                pass

    for m in DATE_PATTERNS[3].finditer(text):
        try:
            results.append(date(int(m.group(3)), int(m.group(1)), int(m.group(2))))
        except ValueError:
            pass

    for m in DATE_PATTERNS[4].finditer(text):
        try:
            candidate = date(today.year, int(m.group(1)), int(m.group(2)))
            if (candidate - today).days > 180:
                candidate = candidate.replace(year=today.year - 1)
            results.append(candidate)
        except ValueError:
            pass

    return results


def parse_header_date(text: str) -> date | None:
    for line in text.splitlines()[:15]:
        m = HEADER_RE.match(line)
        if m:
            dates = parse_date_candidates(m.group(1), today=date.today())
            if dates:
                return max(dates)
    return None


def scan_file(path: Path, today: date, threshold_days: int) -> DomainReport:
    domain = path.parent.parent.name
    rel = path.relative_to(ROOT).as_posix()
    report = DomainReport(domain=domain, file=rel, last_updated=None, header_age_days=None)

    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as e:
        report.findings.append(Finding(
            domain=domain, file=rel, line=0, kind="read_error",
            age_days=None, snippet=f"Could not read file: {e}",
        ))
        return report

    header = parse_header_date(text)
    if header:
        report.last_updated = header.isoformat()
        age = (today - header).days
        report.header_age_days = age
        if age > threshold_days:
            report.findings.append(Finding(
                domain=domain, file=rel, line=0, kind="header_stale", age_days=age,
                snippet=f"Last updated {header.isoformat()} ({age} days ago)",
            ))

    for i, line in enumerate(text.splitlines(), start=1):
        m = CHECKBOX_RE.match(line)
        if m:
            item = m.group(1).strip()
            deadline_dates: list[date] = []
            for dm in DEADLINE_RE.finditer(item):
                tail = item[dm.end(): dm.end() + 40]
                deadline_dates.extend(parse_date_candidates(tail, today))
            past = [d for d in deadline_dates if d < today]
            if past:
                report.findings.append(Finding(
                    domain=domain, file=rel, line=i, kind="past_checkbox",
                    age_days=(today - max(past)).days, snippet=item[:140],
                    deadline=max(past).isoformat(),
                ))
            continue

        tm = TABLE_ROW_RE.match(line)
        if tm:
            cells = [c.strip() for c in tm.group(1).split("|")]
            if all(set(c) <= set("- :") for c in cells):
                continue  # separator row
            # Require a status keyword as an exact (trimmed, lowercased) cell,
            # not a substring — avoids matching prose that contains "to do".
            if not any(c.lower() in STATUS_KEYWORDS for c in cells):
                continue
            row_text = " | ".join(cells)
            past = [d for d in parse_date_candidates(row_text, today) if d < today]
            if past:
                report.findings.append(Finding(
                    domain=domain, file=rel, line=i, kind="past_status_row",
                    age_days=(today - max(past)).days, snippet=row_text[:160],
                    deadline=max(past).isoformat(),
                ))

    return report


def collect(threshold_days: int, today: date | None = None) -> list[DomainReport]:
    today = today or date.today()
    reports: list[DomainReport] = []
    if not DOMAINS_DIR.exists():
        return reports
    for domain_dir in sorted(DOMAINS_DIR.iterdir()):
        tracking = domain_dir / "tracking"
        if not domain_dir.is_dir() or not tracking.is_dir():
            continue
        for name in TRACKING_FILENAMES:
            f = tracking / name
            if f.exists():
                reports.append(scan_file(f, today, threshold_days))
    return reports


def render_human(reports: list[DomainReport], threshold_days: int) -> str:
    lines = [
        f"# Domain Status Hygiene — {date.today().isoformat()}",
        f"*Threshold: {threshold_days} days. Scanned {len(reports)} tracking file(s).*",
        "",
    ]
    flagged = [r for r in reports if r.findings]
    clean = [r for r in reports if not r.findings]

    if not flagged:
        lines.append("All domain status files are fresh. Nothing to clean up.")
        return "\n".join(lines)

    lines += [f"## Flagged ({len(flagged)})", ""]
    for r in sorted(flagged, key=lambda x: (-(x.header_age_days or 0), x.domain)):
        header_note = (
            f"stale header ({r.header_age_days}d)"
            if r.header_age_days and r.header_age_days > threshold_days
            else f"header {r.header_age_days}d old" if r.header_age_days is not None
            else "no header date"
        )
        lines.append(f"### {r.domain} — `{r.file}` ({header_note})")
        for f in r.findings:
            if f.kind == "header_stale":
                continue  # already shown in the header note
            tag = {
                "past_checkbox": "past-due checkbox",
                "past_status_row": "past-due row",
                "read_error": "read-error",
            }.get(f.kind, f.kind)
            deadline = f" -> deadline {f.deadline}" if f.deadline else ""
            lines.append(f"- L{f.line} [{tag}]{deadline}: {f.snippet}")
        lines.append("")

    if clean:
        lines += [f"## Clean ({len(clean)})", ", ".join(sorted({r.domain for r in clean}))]

    return "\n".join(lines)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="output machine-readable JSON")
    parser.add_argument("--threshold", type=int, default=30,
                        help="staleness threshold in days (default: 30)")
    args = parser.parse_args(argv)

    reports = collect(threshold_days=args.threshold)

    if args.json:
        payload = {
            "generated_at": datetime.now().isoformat(timespec="seconds"),
            "threshold_days": args.threshold,
            "reports": [
                {
                    **{k: v for k, v in asdict(r).items() if k != "findings"},
                    "findings": [asdict(f) for f in r.findings],
                }
                for r in reports
            ],
        }
        print(json.dumps(payload, indent=2))
    else:
        print(render_human(reports, args.threshold))

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
