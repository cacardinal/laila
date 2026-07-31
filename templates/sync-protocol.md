# External Sync Protocol

Standard sync sequence for all trigger phrases. Execute the relevant sections based on trigger type.

Domain-specific filters (email queries, messaging allowlists, task lists) live in each domain's CLAUDE.md file. This protocol defines the *sequence and priority logic* only.

---

## Sync Execution Order

1. **Calendar** — Establishes time context
2. **Email** — Highest volume, longest to process
3. **Messages** — Quick scan
4. **Group messaging** — Allowlisted chats only (see root CLAUDE.md)
5. **Social/professional networks** — Rate-limited, check last
6. **Task manager** — Final task list

---

## Priority Flagging (Cross-Domain)

**P1 (Action Required):**
- Interview scheduling, offers, urgent deadlines
- School closings, cancellations, kid safety
- Family member needing a response
- Direct personal requests

**P2 (Review Today):**
- Bills, invoices, payments
- Appointments, prescriptions
- Meeting invites, reschedules
- Client or recruiter outreach

**P3 (FYI):**
- All other unread items

---

## Trigger → Sync Mapping

**Note:** For a comprehensive communications check, use the `/comms` skill instead of a manual sync.

| Trigger | Calendar | Email | Messages | Group chats | Networks | Tasks |
|---------|----------|-------|----------|-------------|----------|-------|
| "Daily brief" | Today + Tomorrow | Full scan | 24h | Allowlist 24h | Full inbox | Overdue + Today |
| "Quick status" | Today only | P1 urgent only | Skip | Skip | Skip | Overdue only |
| "Weekly planning" | 7 days | Full scan | 7 days | Allowlist 7d | Full inbox | Overdue + Week |
| "Check [domain]" | Domain events | Domain filters | Domain contacts | If applicable | If applicable | Domain list |
| `/comms` | Skip | Full scan | 24h | Allowlist 24h | Full inbox | Skip |
| `/comms [domain]` | Skip | Domain only | Domain contacts | If applicable | Full inbox | Skip |
| `/comms search [term]` | Skip | Search term | Search term | Search term | Search term | Skip |

---

## Post-Sync Actions

After sync completes:

1. Present a unified summary by priority (P1 → P2 → P3)
2. Group by domain for routing
3. **Draft responses** for P1 items requiring replies (drafts only — sending is always approval-gated; see `docs/security-model.md`)
4. **Update domain status.md** files with new information discovered
5. **Propose task changes** (completions, new items, rescheduled overdue)
6. Propose time blocks for P1 items
7. Update `state/strategy.md` only if strategic priorities shift
