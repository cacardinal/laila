# Story <NN>: <short title>

> **For agentic workers:** This story pack is self-contained. Implement it without opening other planning docs. Steps use checkbox (`- [ ]`) syntax for tracking. RECOMMENDED executor (if installed): `superpowers:subagent-driven-development` or `superpowers:executing-plans`; otherwise implement directly from this pack.
>
> Generic story-pack template used by the `/spec` skill. The skill fills `{{placeholders}}` from the project's profile in `config/spec-projects.json`. For idea-stage projects (no repo yet), the "Tasks", "Verification", and "Files touched" sections describe the intended implementation; they are planning artifacts until the project graduates to `stage: code`.

**Project:** {{PROJECT_NAME}} (`{{REPO}}`)
**Story ID:** `{{FEATURE_SLUG}}/<NN>`
**As a** <user / operator / system>
**I want** <capability>
**So that** <outcome>.

---

## Embedded context

> Paste the *relevant* architecture, file paths, and conventions inline. The executing agent should need nothing else open. Keep it to what THIS story touches, not the whole product.

**Where this lives in the code:**
- `{{REPO}}/<area>/` — <what's there now, or "to be created" for idea-stage>
- Relevant module(s)/service(s): <file> — <one line of what it does>
- Tests live in: <test dir>

**How it works today (the slice this story changes):**
<2-5 sentences of current behavior and data flow the agent must understand. Name the functions/collections/fields involved. For idea-stage: describe the intended behavior instead.>

**Project conventions that apply to this story:**
> The /spec skill pastes the project's `conventions` and `constraints` from `config/spec-projects.json` here. Any user-facing copy this story adds/changes must follow them.
- {{CONVENTIONS}}
- {{CONSTRAINTS}}

---

## Acceptance criteria

> Testable. Each becomes a check in the QA gate.

- [ ] <criterion 1 — observable behavior>
- [ ] <criterion 2>
- [ ] <criterion 3>
- [ ] No project-convention violations in any user-facing string this story adds/changes.
- [ ] Tests added/updated for new logic; verification command green (code-stage).

---

## Tasks

- [ ] **Step 1:** <action>. Files: `<...>`.
- [ ] **Step 2:** <action>.
- [ ] **Step 3:** Add/extend tests in `<test dir>`.
- [ ] **Step 4:** Run the verification command (below).

---

## Verification

> How to PROVE this story works. The QA gate (`story-reviewer`) checks this block actually runs and passes. For idea-stage, this is the test you WILL run once built.

1. **Build/tests:** `{{BUILD_TEST}}` — all green; new tests cover the acceptance criteria.
2. **Behavioral check (if applicable):** <run the harness / demo / manual flow and confirm the expected observable>.
3. **Manual (if needed):** <one concrete manual check>.

---

## Files touched (anticipated)

- `<...>`
- `<test file>`

---

## Status

- [ ] Implemented
- [ ] Tests green
- [ ] QA gate passed (`story-reviewer`)
