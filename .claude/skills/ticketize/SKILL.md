---
name: ticketize
description: Split an approved trace and SSOT into implementable tickets with machine-checked frontmatter. Use after a trace is approved and the invariants exist, or when asked to break a feature, PRD, or spec into tickets or tasks. Produces specs/<feature>/tickets/*.md.
---

# Ticketize

Turn an approved trace into tickets an agent can implement without guessing.

Preconditions. Do not start without them.

- `TRACE.md` is approved by a human, with no open blanks.
- The ADRs are written.
- `docs/ssot/<AREA>.md` states the numbered rules.
- `tests/invariants/` holds a failing test per rule.

If any is missing, say which, and go back. Tickets written against an unapproved trace encode
the wrong shapes.

## Slice by tracer bullet, not by layer

Wrong: "build the database schema", "build the API", "build the UI". Nothing works until all
three land, nothing is testable in between, and integration errors surface at the end.

Right: each ticket makes one thing work end to end, however thin.

Example, for a system that sells a limited number of things:

1. A buyer sees how many remain
2. A buyer holds some, and the hold expires on its own
3. A buyer confirms, and the remaining count drops
4. Staff see the confirmed order
5. Staff cancel it, and the count returns

Every ticket ends with something demonstrable and a green test.

## Frontmatter is the gate

```yaml
---
invariants: [CAP-1, CAP-2]
adrs: [ADR-0007]
contracts: none        # none | additive | breaking
---
```

`tooling/checks/ticket-frontmatter.mjs` fails the build when an ID does not resolve. Fill it
from the SSOT, never from memory.

- `invariants` — every rule this ticket must not break. Almost never empty. `[none]` only when
  the work touches no domain rule at all.
- `adrs` — decisions that constrain the implementation.
- `contracts` — `breaking` needs an ADR, and serializes: **only one in-flight ticket may touch
  `packages/contracts/`.** Sequence those tickets explicitly and say so.

## Each ticket states

- **Goal** — one sentence. What becomes possible.
- **Scope** — what changes, and what a reader would wrongly assume is included.
- **Done when** — the named invariant tests green, the named contract tests green,
  `mise run check` green.
- **Notes** — link the trace section this implements. Anything the implementer would otherwise
  guess.

Target about 400 changed lines. A larger ticket needs a stated reason.

## Then report

- The ticket list, in dependency order.
- Which tickets must serialize, and why.
- Which can run in parallel. Cap at three — human review, not agent capacity, is the bottleneck.
- Any rule in the SSOT that no ticket covers. That is a gap in the plan, not an oversight to
  fix silently.

## Do not

- Do not create a ticket that only writes tests. Invariant tests exist before the tickets.
- Do not let a ticket both change an invariant and implement a feature. Split it.
- Do not invent an invariant ID to fill the frontmatter. If a needed rule does not exist, the
  SSOT is incomplete — go back to STATE.
