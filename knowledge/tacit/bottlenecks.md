# Bottlenecks — Repeated Manual Tasks

**The third-repetition rule:** when Alex performs the same manual task for the **third** time, log it here. Twice might be coincidence; three times is a pattern worth automating. Entries in this file are the pre-seeded candidate list for the weekly automation review — each one gets an eliminate / automate / delegate / keep decision there.

Each entry records: what the task is, the three (or more) dated occurrences that earned it a spot, a rough cost estimate, and an automation sketch. Do NOT build the automation at logging time — logging and deciding are separate steps.

Format:

```
## BN-### — Short task name
- **Logged:** YYYY-MM-DD
- **Occurrences:** date, date, date (and counting)
- **Cost:** ~X min each, ~Y times/week
- **Sketch:** one-line idea for eliminating or automating it
- **Status:** open | automated (link) | eliminated | accepted-manual
```

---

## BN-001 — Copying invoice totals into the monthly finance sheet

- **Logged:** 2026-07-19
- **Occurrences:** 2026-05-31, 2026-06-30, 2026-07-18
- **Cost:** ~20 min each, monthly (open each PDF invoice, retype vendor/amount/date into the spreadsheet)
- **Sketch:** watch the invoices folder, extract vendor/amount/date from each new PDF, append a row to the finance sheet, flag anything the parser isn't confident about for manual review
- **Status:** open
