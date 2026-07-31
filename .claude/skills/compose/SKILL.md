---
name: compose
description: Drafts any message written AS Alex — email, chat/messaging app, client channel, LinkedIn-style DM — in Alex's actual voice, with a mandatory voice-reviewer gate. Use when Alex says "/compose", "draft a reply to...", "write back to...", "help me respond", or any time a message will be sent under Alex's name. Drafts inline and stops; sending is always Alex's move (Tier 3).
argument-hint: "[channel] [recipient/context]"
---

## What this does

Anything that goes out under Alex's name goes through this workflow: gather context, read the voice profile, draft inline, run the voice-reviewer gate, present the draft with the reviewer's verdict, stop. The skill never sends, never queues a send, never creates a draft in an external tool unless Alex asks for one. The gate is the point — a draft that skips it is not a `/compose` draft.

## Step 1: Gather context

From `$ARGUMENTS` and the conversation, establish four things before writing a word. Ask only for what's missing, in one batch:

1. **Recipient** — who, and what's the relationship (anchor client contact, prospect, friend, vendor)?
2. **Channel** — which channel, exactly? Channel determines register.
3. **Goal** — what should the recipient do or feel after reading?
4. **Thread history** — if this is a reply, ask Alex to paste the thread (or the relevant part). Never draft a reply blind.

Channel sets the register frame. The voice profile's per-channel table is authoritative where it's filled in; these are the structural defaults beneath it:

| Channel | Length | Greeting / sign-off | Formality |
|---|---|---|---|
| Email | As short as the goal allows; one ask per email | Greeting + sign-off expected | Matches the relationship, not the medium |
| Instant message / DM | A few lines; no preamble | No greeting, no recap, no sign-off | Conversational |
| Client channel (Slack-style) | Short; lead with the point, thread the detail | No greeting; @-mention only when action is needed | Professional but loose |
| LinkedIn-style DM | 2-4 sentences | Light greeting, no formal sign-off | Warm, zero pitch-speak |

## Step 2: Read the voice profile

Read `domains/content/voice/voice-profile.md` **before drafting — every time, never from memory of it**. The profile evolves; a draft written from a remembered copy reintroduces constructions Alex has since banned. Note the Anti-Patterns list, the register row for this channel, and the positive voice markers (the pasted real messages are the target sound).

If the profile is still the empty template, tell Alex the gate has nothing to enforce yet and offer to start filling it from this very draft — then proceed, flagging that the review will be structural only.

## Step 3: Draft inline

Write the draft directly in the conversation. Inline is faster to iterate than an external draft; only create one in a mail tool or doc if Alex explicitly asks. Match the register from Step 1, the voice from Step 2, and say only what serves the goal. One draft, not three options, unless Alex asked for options.

## Step 4: The gate (MANDATORY)

Dispatch the **voice-reviewer** agent with everything its contract needs embedded in the prompt:

- the full draft text, verbatim
- the channel (so it applies that channel's register rules from the profile)
- one line of recipient context (who they are, what the relationship is)

The reviewer returns hard fails and advisories against the voice profile, quoting each offending line.

- **Hard fails** → apply fixes, then **re-dispatch the reviewer on the revised draft**. Repeat until it returns no hard fails. A fixed draft is unreviewed until the gate has seen the fix.
- **Advisories** → surface them alongside the final draft; Alex decides.

The gate is not skippable — including for "quick" or "casual" messages. Short casual messages are where voice drifts most: fewer words means each wrong one carries more of the signal. When a reason to skip presents itself:

| Rationalization | Answer |
|---|---|
| "It's just two lines" | Two lines to a client is still Alex's voice in the world. Run the gate. |
| "Alex is in a hurry" | The gate takes seconds; a voice miss to Jordan takes weeks to fade. Run the gate. |
| "The reviewer already saw a similar draft" | It saw *that* draft. This one has different words. Run the gate. |
| "It's internal / low stakes" | The recipient doesn't know it was low stakes. Run the gate. |

## Step 5: Present and STOP

Show Alex: the final draft, the reviewer's verdict (CLEAN, or the surviving advisories), and any judgment calls made along the way. Then stop.

**Sending is always Tier 3.** Alex sends it themselves, or explicitly approves a send that the main session executes through the normal approval path. This skill never sends on any channel, never schedules a send, never hands the draft to anything that sends. Per the subagent rules, the voice-reviewer has no send tools either — the draft cannot leave through the gate.

## Iteration: Alex's edits are voice signal

When Alex rewrites a phrase in the draft — swaps a word, kills an opener, restructures a sentence — that edit is data about the voice profile, not just about this message. Note the pattern in the session as you go ("Alex replaced X-style opener with Y", "Alex cut the softener before the ask"). At session wrap, propose a concrete diff to `domains/content/voice/voice-profile.md` capturing the pattern (a new anti-pattern entry, a register tweak, or an updated positive marker). Proposing the diff is Tier 3 — present it, wait for approval, never edit the profile silently.

## Worked example (compact)

**Alex:** `/compose email Jordan — the dispatching milestone is slipping a week, need to tell them`

**Gather:** Recipient = Jordan Lee, VP Product at Acme Corp (anchor client). Channel = email. Goal = deliver the slip plainly, hold trust, give the new date. Alex pastes the last thread message.

**Voice profile:** read fresh. Anti-patterns note "no apology stacking" and "no 'Just wanted to...' openers"; email register row says short, greeting + sign-off, one ask.

**Draft v1** (inline):

> Hi Jordan,
>
> Just wanted to flag that the dispatching milestone is going to slip a week — new date is the 14th. The event-schema rework took longer than scoped, and I'd rather land it right than patch it later. Nothing else on the plan moves.
>
> Happy to walk through it on our Thursday call if useful.
>
> Alex

**Gate:** dispatch voice-reviewer with draft + `channel: email` + `recipient: Jordan Lee, VP Product at anchor client, warm ongoing relationship`. It returns one hard fail — `"Just wanted to flag"` is a banned opener; proposed fix opens with the fact. Apply the fix ("The dispatching milestone is going to slip a week — new date is the 14th."), re-dispatch. Second pass: **CLEAN**.

**Present:** final draft + "voice-reviewer: CLEAN after one fix (banned opener)". Stop. Alex sends it from their own mail client.

## Rules

- The gate runs on every draft, every revision, every channel. No exceptions, no batching two drafts into one review.
- Read the voice profile at draft time; never rely on a remembered copy.
- Draft inline; external drafts only on request.
- Never send, never queue, never auto-create a send-capable artifact. Presenting the draft is where this skill ends.
- Reply drafts require the thread (or Alex's summary of it) — never invent what the other person said.
- Alex's edits feed the profile via a proposed diff at session wrap, Tier 3, never a silent write.

## Verification (MANDATORY)

Before presenting any draft as done:
- **Gate ran:** the voice-reviewer's verdict (CLEAN or surviving advisories) is present alongside the draft — a draft with no verdict attached is unreviewed, back to Step 4.
- **Nothing sent:** the session created no send, no scheduled send, no send-capable artifact. The draft exists only inline (or as an external draft Alex explicitly requested).

## Self-improvement (MANDATORY)

- After each run: every correction Alex makes to a draft is voice signal. Log it as `{"skill": "compose", "correction": "...", "date": "YYYY-MM-DD"}` to `state/skill-feedback.jsonl`.
- At session wrap: propose a concrete diff to `domains/content/voice/voice-profile.md` capturing the pattern (Tier 3 — present it, never edit silently).
- If the same correction happens twice, the profile diff is MANDATORY before the next run.
