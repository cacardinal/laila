# Tacit Patterns

Recurring situations and the response that works. One entry per pattern; keep entries short — this file is inlined into headless session prompts, so every line costs context. Check size with `wc -c knowledge/tacit/patterns.md` (keep under ~4KB).

## Format

```
## [Pattern name]
**When:** the situation that recurs
**Do:** the response that works
**Why:** one line, if not obvious
```

## Sample entry

## Vendor "urgent renewal" emails
**When:** A vendor email marked urgent about a renewal that is actually 60+ days out.
**Do:** Log to the comms queue as P3 with the real deadline; never surface as P1 on the vendor's framing.
**Why:** Vendor urgency is a sales tactic, not a calendar fact. Verify the date from the contract, not the subject line.
