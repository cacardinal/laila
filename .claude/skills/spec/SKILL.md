---
name: spec
description: Turn a feature idea for ANY project into self-contained, context-engineered story packs, implement them via subagent-driven development, and close with a QA gate. Use when Alex says "/spec", "spec a feature", "spec the <X> feature for <project>", or wants structured feature work on any project (the dashboard, an idea-stage side project like climate-role-radar, an Acme engagement deliverable, a brand-new idea, etc.). The BMAD-inspired story pipeline: low ceremony, project-agnostic. NOT /validate-idea (that screens whether an idea is worth pursuing at all; this builds features for projects already underway).
argument-hint: [project-slug] <feature description>
---

# /spec — Feature → story packs → build → QA gate

The lightweight half of a BMAD-style pipeline: formalized, context-engineered story packs + a QA gate, without the persona ceremony. Project-agnostic — works for any project registered in `config/spec-projects.json`, and for idea-stage projects that have no repo yet. This skill orchestrates and gates; it does not re-implement execution or ideation (see the optional dependencies below).

Run the phases below, then present ONE packet at the end.

## Optional external dependencies

If the `superpowers` skill family (or an equivalent) is installed, use it where noted:

- `superpowers:brainstorming` — Phase 1, to pin intent on fuzzy features.
- `superpowers:subagent-driven-development` or `superpowers:executing-plans` — Phase 3 executor.
- `superpowers:test-driven-development` — inside the executor, for new logic.

**Fallbacks when they are not installed:** for Phase 1, ask 2-3 clarifying questions inline before writing the spec-lite; for Phase 3, dispatch one general-purpose implementer subagent per story with the full story-pack text embedded in the dispatch prompt — the packs are self-contained by design, so the implementer needs nothing else open. The pipeline itself has no hard dependency on any external skill.

## Phase 0 — Resolve the target project

1. Parse the argument into `[project-slug]` + `<feature>`. If the slug is omitted, infer it (from the feature text, the current working directory, or ask ONE question: "Which project?").
2. Load the project profile from `config/spec-projects.json`:
   - `repo`, `stories_dir`, `build_test`, `conventions[]`, `constraints[]`, `tracking`, `stage`.
3. **If the project is not registered:** offer to add it. Ask only what's needed — is there a repo yet (path) or is it idea-stage; the verification command (auto-suggest from `package.json` scripts if a repo exists); any convention docs (voice/brand/style); the tracking file. Write the new entry to `config/spec-projects.json`, then continue. (Tier 1 per `config/autonomy-rules.json`: a registry entry is a low-risk reversible state update.)
4. Note the `stage`:
   - `stage: code` → full loop (Phases 1-5).
   - `stage: idea` → planning loop (Phases 1-2, 4-spec-review, 5). Story packs are the deliverable; skip code execution. Say so plainly.

## Phase 1 — Spec-lite (keep it to one screen)

Write a short spec, NOT a full PRD. For fuzzy/ambiguous features, run a brainstorming pass first (see optional dependencies) to pin intent. Read the project's existing context first (its AGENTS.md / domain docs / idea research folder). Capture only:

- **Problem** (1-2 sentences)
- **Scope** (what's in)
- **Non-goals** (what's explicitly out)
- **Stories** (the 1-4 vertical slices this breaks into)

Present the spec-lite + proposed story breakdown to Alex. Wait for a go before sharding. (Tier 3 — this shapes real build work.)

## Phase 2 — Shard into story packs

For each story, copy `templates/story-pack-template.md` to `<stories_dir>/<feature-slug>/<NN>-<story>.md` and fill it in. The whole point is **context-engineered**: paste the relevant architecture excerpts, file paths, module names, and the project's `conventions` + `constraints` (from the profile) INLINE so the executing agent needs nothing else open. A flat checkbox list is not enough — embed the context. Fill the `{{PROJECT_NAME}}`, `{{REPO}}`, `{{BUILD_TEST}}`, `{{CONVENTIONS}}`, `{{CONSTRAINTS}}` placeholders from the profile.

Each pack must have: embedded context, testable acceptance criteria, task checklist, and a runnable verification block. As you write user-facing copy, cross-check it against the project's convention docs.

## Phase 3 — Execute (code-stage only, one story at a time)

Skip for `stage: idea`. For `stage: code`: for each story pack, in order, dispatch the executor (see optional dependencies; fallback: one implementer subagent per story with the pack embedded) pointed at the story file. Work in the project `repo` on a feature branch — never commit straight to main (deployment rule, see the root AGENTS.md: branch + PR for code repos). Let the executor implement, build, and test before the next story.

## Phase 4 — QA gate (the net-new BMAD borrow)

Dispatch the `story-reviewer` agent per story. Pass it: the story-pack path, the project `repo`, the `build_test` command, and the `conventions[]` + `constraints[]` from the profile (the agent enforces whatever you give it — it has no project hardcoding).

- **Code-stage:** the gate runs the verification command and checks acceptance criteria, tests, conventions, scope, and secrets. Fix Hard fails in the main session, re-dispatch until PASS. Only mark a story's `## Status` done on PASS.
- **Idea-stage:** the gate runs in spec-quality mode — is each pack self-contained, are acceptance criteria testable, do the embedded conventions cover the user-facing surfaces. No code execution.

Do not proceed to handoff with an open Hard fail.

## Phase 5 — Sync

1. Update the project's `tracking` file with completed stories (status.md for domains; for an idea-pipeline project, note the spec'd feature on the idea's entry in `domains/ideas/tracking/pipeline.json`).
2. If the feature came from a backlog/idea, note it as spec'd/built there.
3. Summarize for Alex: project, stage, stories produced/shipped, QA verdicts, branch (if code), and the suggested next step. Respect autonomy: **no external sends, no deploy, no PR-merge without explicit approval** (Tier 3).

## Hard rules

- Story packs must be self-contained — if a pack says "see the PRD," it's not done.
- Enforce the TARGET PROJECT's conventions, not another project's. Each project brings its own rules via its profile's `conventions` + `constraints`; nothing is global.
- Alex's own voice rules (`domains/content/voice/voice-profile.md`) still apply to anything drafted AS Alex and to what you present to them in this session — independent of the target project's conventions.
- Execution reuses the executor skills where installed; this skill orchestrates and gates, it does not re-implement either.
- Branch + PR for code repos; never force-push, never auto-merge, never auto-deploy.
