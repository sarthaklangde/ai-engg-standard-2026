---
name: spec
description: Turn a feature idea into a reviewable design before any code exists. Use when starting a new feature or domain, when the human describes something they want built, or when asked to write a trace, PRD, or spec. Produces DECISIONS.md and TRACE.md under specs/<feature>/.
---

# Spec

Two artifacts. Both are scaffolding. Both die at merge. Their job is to make the design
reviewable in ten minutes instead of ten hours.

Run `discover` first if this touches an existing domain.

## Part 1 — Interrogate

Create `specs/<feature>/DECISIONS.md`.

**Ask questions. Do not write the feature.** Your job is to find the questions the human has not
asked themselves. This is the step that prevents the whole class of "we never thought about
that" failures.

Ask one at a time. Follow each answer to the question it opens.

Cover these on any feature:

- Who is authoritative for this data if two systems can write it?
- What happens on the reversal path — cancel, refund, expire, undo?
- What does the user see when this fails halfway?
- Can two people do this at the same time? What should happen?
- Is anything held or reserved? For how long? What releases it?
- What is locked at the time of the action, and what is recomputed later?
- What must never happen, at any cost?
- What is explicitly out of scope, and who decided?

Stop when you run out of questions that have more than one defensible answer. Twenty minutes.

## Part 2 — Trace

Create `specs/<feature>/TRACE.md`. Copy `specs/_template/TRACE.md`.

A trace is **curl output you made up before the code exists.** Real endpoints, real field names,
real values.

**Rules:**

- Concrete values only. Write `bk_9k2`, never `<id>`. Placeholders hide decisions.
- Real dates, real amounts, real names. `2026-09-01`, `1200000`, `Lan Nguyen`.
- Show the observable effect after each mutation. If a count drops, show it dropping.
- **Always trace the reversal path.** Cancel, refund, expire. Most bugs live there.
- One trace per major flow. Six is normal for a new product.

## Part 3 — Sort the blanks

Every place you could not write a concrete value goes in the "Open blanks" table, sorted:

| You do not know | Kind | Action |
|---|---|---|
| what we want here | preference | the human decides → ADR |
| what would actually happen | fact | run the `probe` skill |

This is how the trace generates the probes. Do not guess a value to fill a blank. A guessed
value looks identical to a decided one, and the next reader cannot tell them apart.

## Then hand it back

Say this to the human, plainly:

> The trace is ready. **Read it line by line.** Every field name and status code is a decision.
> This ten-minute review is the cheapest checkpoint in the process — after this, the shapes get
> baked into contracts, tests, and code.

Then list the open blanks and what each needs.

## Do not

- Do not write application code in this stage.
- Do not write a PRD unless the feature is large enough that the trace alone loses the intent.
- Do not resolve a preference blank yourself. That is the human's call, and it becomes an ADR.
