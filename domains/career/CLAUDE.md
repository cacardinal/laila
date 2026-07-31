# Career — Domain Configuration

## Overview

Alex's career-change pipeline: moving from a generalist product manager role toward
product roles in climate tech. This domain owns the application pipeline, networking
tracker, resume/cover-letter source documents, and interview prep materials.

## Tracking

- **Status file:** `tracking/status.md` — current focus, active applications, networking threads
- **Applications:** `applications/[Company-Role]/` — one folder per application (JD, tailored resume, notes)
- **Source documents:** `source-documents/` — master resume, skills inventory, story bank

## "Check Career" Workflow

When triggered, execute IN ORDER:

1. **Read** `tracking/status.md` — active applications and their stages.
2. **Sync** external sources:
   - Email: recruiter replies, interview invites, rejections
   - Calendar: upcoming interviews or networking calls in the next 7 days
3. **Detect** issues:
   - Applications with no activity in 10+ days (candidates for a polite nudge)
   - Interviews in the next 48 hours without a prep document
   - Networking follow-ups that are past their promised date
4. **Act** on findings:
   - Update stages in `tracking/status.md`
   - Draft follow-up messages (Tier 3 — present for approval, never send)
   - Create prep outlines for imminent interviews
5. **Report** a short summary: pipeline by stage, items needing Alex's attention, next actions.

## Domain Rules

- **Never overstate ownership verbs in application materials.** "Contributed to" and "led"
  are different claims — use the one the evidence supports. Alex reviews every verb.
- **Every application gets a folder before it gets a submission.** No folder, no apply.
- **Outbound messages (recruiters, referrals, thank-yous) are always Tier 3.** Draft
  inline in chat; Alex sends manually.
- **Salary/location filters are hard gates.** Remote-first or within commuting distance
  only; do not tailor materials for roles that fail the gate.
- **Rejections are logged, not deleted.** Move the folder to `applications/_closed/` and
  record the reason — the pattern data matters more than the individual outcome.

## Trigger Phrases

- "Check career" — run the workflow above
- "Process this job" — capture a JD and open an application folder
- "Prep me for [interview]" — build an interview prep document
