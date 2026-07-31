# Laila-OS OKR Architecture

**Reference:** John Doerr's "Measure What Matters" OKR framework, adapted for a personal operating system.

---

## Hierarchy Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VISION (North Star)                         │
│    "What does my ideal life look like in 3-5 years?"                │
│    File: state/vision.md (optional, long-term reference)            │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    OBJECTIVES (Quarterly)                           │
│    Qualitative • Aspirational • Memorable • 3-5 per quarter         │
│    File: state/goals.md → "Q3 2026 Objectives"                      │
│                                                                     │
│    Example: "Land a role where I can lead product for a             │
│              mission-driven company"                                │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   KEY RESULTS (Quarterly/Monthly)                   │
│    Measurable • Time-bound • 3-5 per Objective • Outcome-focused    │
│    File: state/goals.md → under each Objective                      │
│                                                                     │
│    KR1: Receive 2+ offers at target compensation by Sep 30          │
│    KR2: Complete 15+ qualified interviews by Sep 30                 │
│    KR3: Achieve 80%+ interview-to-next-stage conversion             │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PROJECTS / INITIATIVES                           │
│    Scoped work • Has start/end • Drives Key Results                 │
│    File: domains/{domain}/tracking/status.md                        │
│                                                                     │
│    C-001: Acme Corp engagement → potential contract → drives KR     │
│    V-001: Landing page revamp → enables demos → drives KR           │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      TASKS / NEXT ACTIONS                           │
│    Atomic • Actionable • Single session • Clear done state          │
│    Files: domains/{domain}/tracking/*.md, task-manager lists        │
│                                                                     │
│    "Upload logo to cloud storage"                                   │
│    "Draft follow-up note for Jordan Lee"                            │
│    "Schedule scoping call with Acme Corp"                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layer Definitions

### 1. Vision (Optional)
- **Timeframe:** 3-5 years
- **Purpose:** North star for life direction
- **Characteristics:** Inspirational, values-driven, rarely changes
- **File:** `state/vision.md` (create if desired)
- **Example:** "Be a recognized product leader building tools that meaningfully improve people's working lives, while maintaining time freedom for family and creative pursuits."

### 2. Objectives (O)
- **Timeframe:** Quarterly
- **Purpose:** What you want to achieve this quarter
- **Characteristics:**
  - Qualitative (no numbers)
  - Aspirational and motivating
  - Memorable (can recite from memory)
  - 3-5 per quarter across all domains
- **File:** `state/goals.md` → Q1/Q2/Q3/Q4 sections
- **Naming:** Start with an action verb (Establish, Build, Launch, Transform)

**Good Objective:**
> "Establish myself as a sought-after product leader"

**Bad Objective (actually a Key Result):**
> "Get 3 job offers by September" ← This is measurable; it belongs in KRs

### 3. Key Results (KR)
- **Timeframe:** Quarterly (with monthly check-ins)
- **Purpose:** How you'll know the Objective is achieved
- **Characteristics:**
  - Quantitative and measurable
  - Outcome-focused (not output/activity)
  - Aggressive but achievable (70% completion is success)
  - 3-5 per Objective
- **File:** `state/goals.md` → nested under each Objective
- **Grading:** 0.0-1.0 scale (0.7+ is success; 1.0 means the bar was too low)

**Good Key Results:**
```
O: Establish myself as a sought-after product leader
  KR1: Receive 2+ offers at target compensation
  KR2: Complete 15+ qualified first-round interviews
  KR3: Achieve 80%+ interview-to-next-stage conversion rate
  KR4: Build a network of 5+ active referral sources
```

**Bad Key Results (actually tasks):**
> "Submit 10 applications" ← This is an activity, not an outcome

### 4. Projects / Initiatives
- **Timeframe:** Weeks to months
- **Purpose:** Scoped work that drives Key Results
- **Characteristics:**
  - Clear scope and definition of done
  - Links to one or more Key Results
  - Has status (Backlog → Ready → In Progress → Complete)
  - Tracked in domain status files
- **File:** `domains/{domain}/tracking/status.md`
- **Naming:** Domain prefix + sequential ID (C-001, V-002)

**Project Examples:**
| Project | Drives KR |
|---------|-----------|
| C-001: Acme Corp engagement | KR1 (contract), KR4 (referrals) |
| V-001: Landing page revamp | Venture trials KR |
| K-001: Import book catalogue | Knowledge foundation |

### 5. Tasks / Next Actions
- **Timeframe:** Single session (minutes to hours)
- **Purpose:** Atomic work items within Projects
- **Characteristics:**
  - One clear action
  - Completable in a single work session
  - Verifiable done state
  - Belongs to a Project (or standalone maintenance)
- **Files:** Domain tracking files, task manager
- **Naming:** Verb-first action statement

**Task Examples:**
- "Upload logo to cloud storage" (V-001)
- "Draft discovery-call prep notes" (C-001)
- "Review and categorize 5 more books" (K-001)

---

## Mapping the Structure

| Term | OKR Layer | Location |
|------|-----------|----------|
| "Quarterly Objectives" | Objectives | `state/goals.md` |
| "Monthly Goals" | Key Results | `state/goals.md` |
| Domain projects | Projects | `domains/*/tracking/status.md` |
| Domain tasks | Tasks | `domains/*/tracking/status.md` |
| Task-manager items | Tasks | Task manager |

---

## Cadence

```
┌──────────────────────────────────────────────────────────────┐
│                     QUARTERLY (OKR Cycle)                    │
│  Set Objectives + Key Results for the quarter                │
│  Review previous quarter (grade KRs, celebrate, learn)       │
│  Trigger: "Quarterly planning"                               │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    MONTHLY (KR Check-in)                     │
│  Score Key Results (0.0-1.0)                                 │
│  Adjust Projects if KRs are at risk                          │
│  Add/remove Projects as needed                               │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    WEEKLY (Project Focus)                    │
│  Review Project status                                       │
│  Set weekly priorities                                       │
│  Trigger: "Weekly planning" (Sundays)                        │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     DAILY (Task Execution)                   │
│  Work on Tasks from priority Projects                        │
│  Update Task status                                          │
│  Trigger: "Daily brief"                                      │
└──────────────────────────────────────────────────────────────┘
```

---

## OKR vs Epics/Stories

**Decision: OKRs over the Agile hierarchy for a personal OS.**

| Agile Term | Closest OKR Equivalent | Why OKR Works Better |
|------------|------------------------|----------------------|
| Epic | Objective | OKRs are outcome-focused vs delivery-focused |
| Story | Project | Projects have flexible scope; stories are fixed |
| Task | Task | Same concept, works in both |
| Sprint | Weekly cadence | Personal work is continuous, not sprinted |

**Rationale:**
1. OKRs focus on **outcomes** (what we achieve) vs Agile's focus on **outputs** (what we deliver)
2. Personal goals don't need story-point estimation or velocity tracking
3. OKR scoring (0.7 = success) allows for ambition without failure anxiety
4. Quarterly rhythm matches natural life planning cycles

---

## File Ownership

| Layer | Primary File | Domain Files |
|-------|-------------|--------------|
| Vision | `state/vision.md` | — |
| Objectives | `state/goals.md` | — |
| Key Results | `state/goals.md` | — |
| Projects | — | `domains/*/tracking/status.md` |
| Tasks | Task manager | `domains/*/tracking/status.md` |

---

## Example: Career Domain OKR Stack

```
OBJECTIVE (Q3)
├── "Land a role where I can lead product for a mission-driven company"
│
├── KEY RESULT 1: "Receive 2+ offers at target compensation by Sep 30"
│   │
│   ├── PROJECT: C-001 Acme Corp Engagement
│   │   ├── Task: Prepare for scoping call
│   │   ├── Task: Research Jordan Lee's background
│   │   └── Task: Draft questions about the Q4 roadmap
│   │
│   ├── PROJECT: C-002 Referral Pipeline
│   │   ├── Task: Follow up with former teammates for intel
│   │   └── Task: Tailor resume for the platform PM opening
│   │
│   └── PROJECT: C-007 Weekly Application Target
│       ├── Task: Submit application #1 (done)
│       ├── Task: Submit application #2
│       └── Task: Research 3 more target companies
│
├── KEY RESULT 2: "Complete 15+ qualified interviews by Sep 30"
│   │
│   └── (The same projects contribute to multiple KRs)
│
└── KEY RESULT 3: "Build a network of 5+ active referral sources"
    │
    └── PROJECT: Networking Strategy
        ├── Task: Update profile with new positioning
        └── Task: Reach out to 3 former colleagues
```

---

## Quick Reference

**When creating new work:**
1. Does it support a Key Result? → Project in the domain tracker
2. Is it atomic and completable today? → Task in a domain file or the task manager
3. Is it a new quarterly aspiration? → Objective in goals.md
4. Is it a measurable milestone? → Key Result under an Objective

**Scoring Key Results (end of quarter):**
- 0.0-0.3: Failed to make progress
- 0.4-0.6: Made progress but fell short
- 0.7-0.9: Delivered (this is success!)
- 1.0: Knocked it out of the park (or set the bar too low)

---

*This architecture is referenced by `CLAUDE.md` and informs daily/weekly/quarterly planning.*
