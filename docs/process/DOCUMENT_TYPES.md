# Document Types

The lookup table. What goes where, who writes it, and when it stops being maintained.

`PROCESS.md` explains the method. This file is the reference you return to.

---

## The principle: file by decay rate, not by topic

Most doc trees sort by subject — architecture, product, API. Subject is the wrong axis. The
variable that decides whether a document helps you or lies to you is **how fast it goes stale**.

| Stratum | Example | Decay | Rule |
|---|---|---|---|
| **Code and invariant tests** | the system itself | none — it *is* the truth | never describe it in prose |
| **Derivable** | endpoint list, schemas, CODEMAP, types | instant | **generate it, or do not have it** |
| **Durable, not derivable** | domain rules, decisions, rejected options | years | the only prose you maintain |
| **Scaffolding** | trace, decisions, PRD, tickets | dead at merge | **never updated — drained, then frozen** |

Two sentences follow from this table, and they decide most arguments.

> **Never write down what an agent can discover in 30 seconds.**
> **Always write down what it cannot discover at all.**

An agent reading a checkout flow sees *that* a lock exists. It never sees why the lock is held
for the whole request instead of released early, or that a hold lasts 10 minutes because the
payment provider's session does, or that one sales channel is entered by hand on purpose.
Structure is cheap to rediscover and corrects itself. Intent is impossible to rediscover and
catastrophic to guess.

**Generate structure. Document intent. Discover implementation.**

---

## Every document, in one table

| Document | Path | Written by | Reviewed by | Lifetime |
|---|---|---|---|---|
| Agent entry point | `AGENTS.md` | human | human | permanent, kept short |
| Process explainer | `docs/process/*` | human | human | permanent |
| Standards | `docs/engineering-standards/*` | human | human | permanent |
| **Domain rules** | `docs/ssot/<AREA>.md` | agent drafts | **human approves** | permanent, kept current, shrinks |
| **Decisions** | `docs/adr/NNNN-*.md` | agent drafts | **human approves** | permanent, **never edited** |
| Integration notes | `docs/integrations/*.md` | agent | human | permanent, updated with the integration |
| Interrogation | `specs/<f>/DECISIONS.md` | agent asks, human answers | — | drained at DECIDE, then dead |
| **Trace** | `specs/<f>/TRACE.md` | agent drafts | **human, line by line** | frozen at merge |
| PRD | `specs/<f>/PRD.md` | agent drafts | human | frozen at merge |
| Tickets | `specs/<f>/tickets/*.md` | agent | human | frozen at merge |
| Probe | `probe-*.mjs` | agent | — | **deleted same day, never committed** |
| Invariant tests | `tests/invariants/*` | agent, from the SSOT | human | permanent, append-only |
| Contracts | `packages/contracts/*` | agent | human | evolves with the product |
| Unit tests | co-located with code | agent | — | disposable |
| Code map | `CODEMAP.md` | **a script** | — | regenerated |
| OpenAPI | generated output | **a script** | — | regenerated |
| TSDoc | in the code | agent | human | with the function |

The two rows in bold that matter most: an agent drafts the SSOT and the ADRs, and a human
approves them. Those two documents are where your judgment is recorded. Everything else can be
regenerated.

---

## Death rules, per folder

Each folder has a `README.md` repeating its rule. This is the summary.

### `docs/ssot/` — permanent, and shrinking

- One file per domain area. Name it `UPPER_SNAKE_CASE.md`.
- Present tense. No history. No "in v2 we added".
- Every rule gets an ID: `CAP-1`, `ORD-3`. Declare the prefix in the frontmatter.
- Every rule that can be a test **must** have one. CI enforces the link.
- Changing a rule needs a human and an ADR in the same PR.
- **It shrinks over time.** As rules become tests, the prose thins. A shrinking document is a
  document people read.

### `docs/adr/` — permanent, append-only, never edited

- One decision per file. About 20 lines: Decision, Why, Rejected, Consequences.
- **Never edit a merged ADR.** To change a decision, write a new one and mark the old
  `superseded by ADR-NNNN`.
- The Rejected section is required. An ADR without it is half an ADR, and the decision gets
  re-litigated in six months.
- `README.md` holds the one-line index. Grep it before proposing anything.

### `specs/<feature>/` — scaffolding, frozen at merge

- Everything here is written to be thrown away.
- **Nothing here is ever updated after merge.** Stamp `status: shipped` and stop.
- If you find yourself updating a shipped spec, the content belongs in an SSOT or an ADR.
- `DECISIONS.md` is drained at DECIDE and never read again. That is success, not waste.

### `packages/contracts/` — evolves, serialized

- Zod is the only hand-written schema. Everything else is generated from it.
- Only one in-flight ticket may touch this package. Schema changes serialize.
- A breaking change needs an ADR.

### `tests/invariants/` — permanent, append-only

- One file per SSOT rule. Marked `// @invariant CAP-1`.
- Add freely. Strengthen freely. Weakening or deleting needs a human and an ADR.
- Implementers may not edit this directory. CI blocks it.
- Every production bug becomes a new invariant here, not a unit test.

### `apps/` and `packages/` — the code

- `apps/` holds deployable things. `packages/` holds shared libraries.
- Nothing else at the root is a source directory.
- A README in each states what it is in two sentences. Nothing more — the rest is derivable.

### Generated files

`CODEMAP.md` and the OpenAPI output are generated. Never hand-edit them. `mise run check`
regenerates them and fails if the committed copy differs.

---

## Rules that resolve most arguments

**"Should I document this new endpoint?"**
No. It is derivable. Generate the OpenAPI. Document *why* it takes a quoted total.

**"The SSOT and the code disagree."**
That is a bug in one of them. Stop and resolve it. Never pick one silently.

**"This rule is in the SSOT and in a test. Is that duplication?"**
No. The same statement in both is fine. Two places claiming *authority* is not. The test is
authoritative. The SSOT is the human-readable index into the tests.

**"I need to update a shipped spec."**
You do not. The thing you learned belongs in the SSOT or an ADR. Put it there.

**"Nobody will read a 20-line ADR from last year."**
An agent will, in about 40 milliseconds, because the index is greppable. That is the audience.

**"This document is getting long."**
Then it is holding something derivable, or it is holding history. Move the derivable part to a
generator. Move the history to git.
