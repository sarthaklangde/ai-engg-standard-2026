# One Pager

**Read only this file and you can work here.** Everything else is reference you look up when you
need it.

It is long. Read it once, end to end, then keep the cheat sheet at the bottom.

---

## Part 1 — The one idea

An AI writes a feature in an hour. It cannot know the things you decided and never wrote down.

Take any system that sells a limited number of things — seats, licences, appointment slots.
Somebody decided that a checkout hold lasts 10 minutes, because that is how long the payment
provider keeps a session open. Somebody decided that sales through a partner site are entered by
hand, because the partner has no webhook.

Neither fact is in the code. An agent reading the code sees *that* holds expire after 10
minutes. It cannot see *why*, so it will change the number when a ticket asks it to. It sees no
partner sync, so it assumes one is missing and builds it.

Multiply that by forty features and four agents and you get a codebase where nobody, human or
machine, can say what is true on purpose and what is true by accident.

### So: three kinds of thing, three different homes

| Kind | Example | Home | Rots? |
|---|---|---|---|
| What the system does | the order endpoint | **code** | never — it *is* the truth |
| What must always be true | capacity never goes negative | **`tests/invariants/`** | never — it runs |
| Why we chose this | holds are rows, not cache entries | **`docs/adr/`** | never — decisions do not expire |
| Anything describing the code | "the API has these 12 endpoints" | **nowhere** | instantly |

That last row is the one people get wrong. Prose describing code is wrong within a week, and
worse than nothing, because it is confidently wrong and the next agent believes it.

### Two sentences that settle most arguments

> **Never write down what an agent can discover in 30 seconds.**
> **Always write down what it cannot discover at all.**

Structure — where files are, what fields exist, which endpoints there are — is cheap to
rediscover and self-correcting. Intent is impossible to rediscover and catastrophic to guess.

**Generate structure. Document intent. Discover implementation.**

---

## Part 2 — The map

```
apps/                  deployable things — a web app, an API, a worker, a CLI
packages/              imported things
  contracts/           boundary shapes
  tokens/              design tokens. Pure data, generates CSS + presets + types.
  ui/                  shared primitives — only once a second app needs them
database/              schema/ hand-written · migrations/ generated, then frozen
infra/                 applied to a cloud by CI
docs/
  ssot/                the domain rules, numbered, permanent, kept short
  adr/                 decisions + what you rejected, append-only, never edited
  process/             how to work here (this file lives here)
  integrations/        what each external provider actually does when it fails
  engineering-standards/   code, tests, branches, PRs, releases
specs/                 per-feature scaffolding — frozen at merge, never updated
tests/invariants/      the SSOT rules, as running tests
tooling/checks/        the scripts that make this binding instead of advisory
.claude/skills/        spec · probe · ticketize · harvest · discover
AGENTS.md              what every agent reads, every session
CODEMAP.md             generated. Never hand-edit.
```

### Why those roots and not others

Roots key off a mechanical property, not taste:

| Root | Property |
|---|---|
| `apps/` | has an **entry point** — something runs it |
| `packages/` | has **exports** — something imports it |
| `database/`, `infra/`, `tooling/` | **neither** — CI applies them to something external |

`packages/` is not "shared code", it is **imported code**. That distinction is what the tooling
reads: the package manager globs `apps/*` and `packages/*`, and affected-detection walks the
import graph. Nothing imports a migration, so `database/` is a root.

**No other top-level directory without an ADR** — `root-layout` enforces it. And a package needs
**two consumers or a hard boundary reason**; one consumer means it lives inside that app.

### Every folder has a death rule

This is the part most doc systems miss. A folder without a rule about when its files stop being
maintained accumulates forever.

| Folder | Who writes it | When it dies |
|---|---|---|
| `docs/ssot/` | agent drafts, **human approves** | never — kept current, and it *shrinks* |
| `docs/adr/` | agent drafts, **human approves** | never — and never edited either |
| `docs/integrations/` | agent | never — updated with the integration |
| `specs/<feature>/` | agent | **frozen at merge, never updated again** |
| `probe-*.mjs` | agent | **deleted the same day, never committed** |
| `tests/invariants/` | agent, from the SSOT | never — append-only |
| `packages/contracts/` | agent | evolves; changes serialize |
| `database/schema/` | agent | evolves; changes serialize |
| `database/migrations/` | **a diffing tool** | **permanent — generated, never edited** |
| `infra/` | agent plans, **CI applies** | permanent |
| unit tests | agent | disposable, rewrite freely |
| `CODEMAP.md`, OpenAPI | **a script** | regenerated |

The two rows in bold matter most: **an agent drafts the SSOT and the ADRs, and a human approves
them.** Those two documents are where your judgment gets recorded. Everything else can be
regenerated or thrown away.

---

## Part 3 — The process, in steps

Nine stages. The first six produce **no application code**. That is intended.

```
SPEC → PROBE → DECIDE → STATE → PROVE → SHAPE → SPLIT → BUILD → HARVEST
```

---

### Step 1 · SPEC — make the design reviewable

**Run:** the `spec` skill. **You produce:** `specs/<feature>/DECISIONS.md` and `TRACE.md`.

**1a. The agent interrogates you.** It asks questions; it does not write the feature. Its job is
to find the questions you have not asked yourself.

Good ones, on any feature: Who is authoritative if two systems can write this? What happens on
the reversal path — cancel, refund, undo? What does the user see when it fails halfway? Can two
people do this at once? Is anything held or reserved, and what releases it? What is locked at
the time of the action versus recomputed later? What must never happen, at any cost?

Twenty minutes. Stop when the agent runs out of questions with more than one defensible answer.

**1b. The agent writes a trace.** A trace is **curl output made up before the code exists**.
Real endpoints, real field names, real values — `ord_9k2`, not `<id>`.

```
POST /api/orders
{ "idempotencyKey": "c7f3a...", "holdId": "hold_a1b2", "quotedTotalCents": 9000 }
→ 201 { "orderId": "ord_9k2", "status": "confirmed", "totalCents": 9000 }
```

**1c. You review it, line by line, for ten minutes.**

This is the single most important step in the process, and it is the one people skip.

You cannot review a PRD — it is prose, you nod along, you catch nothing. You cannot review 2,000
lines of implementation — you do not have the working memory. You *can* review 40 lines of
concrete JSON, where every field name and status code is a decision you accept or reject.

The agent writes it in two minutes. **The value is entirely in your ten minutes.** Approving a
trace you skimmed collapses everything downstream, because contracts, tests, and tickets are all
derived from it.

**Always trace the reversal path.** Cancel, refund, expire. Most bugs live there.

---

### Step 2 · PROBE — only for what you cannot think your way to

**Run:** the `probe` skill. **You produce:** one sentence. **Usually you skip this entirely.**

A probe answers a question you cannot answer by reasoning. That is the whole definition.

> Can I settle this by thinking, or reading the docs? → **Do that. No probe.**
> Is running it the only way to know? → **Probe.**

When you write the trace, two kinds of blank appear. Tell them apart:

| The blank | It is | Do this |
|---|---|---|
| "I do not know what we *want* here" | a preference | decide → ADR |
| "I do not know what would *happen* here" | a fact | probe it |

That is how the trace generates the probes.

A probe is a 50-line throwaway script that answers one written-down question, then **gets
deleted**. Not committed, not refactored, never promoted into the implementation. The output you
keep is a sentence:

> Naive `SELECT then UPDATE` let 4 of 20 concurrent buyers through when 1 seat remained. Needs
> `SELECT FOR UPDATE`, which adds ~3ms. Separately: nothing says what happens to an active hold
> when the whole event is cancelled.

That last sentence is why probes are worth it. The probe had to decide something nobody
specified, which surfaced a question you did not know to ask.

**Probes apply to every layer** — backend concurrency, migration lock time, whether a 500-row
table renders smoothly, whether a layout survives German strings, whether an external API really
returns what its docs claim.

**Most tickets need zero probes. Zero is normal.** For anything not genuinely uncertain, do the
cheaper thing: hand an agent the trace and ask for 30 ranked ways it breaks. Ten minutes, no
code.

---

### Step 3 · DECIDE — write the ADRs

**You produce:** `docs/adr/NNNN-*.md`, about 20 lines each.

Every answer that had more than one defensible option becomes one ADR. An agent drafts it; you
approve it.

```markdown
# ADR-0007: A hold is a database row, not a cache entry with a TTL

## Decision
A hold is a row with an `expires_at` timestamp. A background job removes expired rows.

## Why
Staff must see held seats on the dashboard while a buyer is still paying. A support call
asking "why does it say sold out?" has to be answerable. A cache entry is invisible to every
query the dashboard makes, and it disappears on restart, which silently oversells.

## Rejected
- Cache entry with a TTL. Simpler, expires for free. Invisible to staff, lost on restart.
- No hold; check capacity at payment time. Buyers fail at the worst possible moment.

## Consequences
Expired holds need a sweeper job. "Active hold" becomes a predicate in several queries.
```

**The Rejected section is the load-bearing part.** It is what stops someone in six months from
"simplifying" this to a cache TTL. An ADR without rejected options is half an ADR.

**Never edit a merged ADR.** To change a decision, write a new one and mark the old
`superseded by ADR-NNNN`.

---

### Step 4 · STATE — write the domain rules

**You produce:** `docs/ssot/<AREA>.md`. One file per domain area. Target 60 lines.

```markdown
---
domain: Capacity
prefix: CAP
status: active
---

## Rules
- **CAP-1** — Available capacity is never negative. The system refuses an order that would
  make it negative.
- **CAP-2** — A hold reserves seats for 10 minutes. An expired or released hold frees its
  seats immediately.
- **CAP-3** — A cancelled order frees exactly the seats it held.

## Boundaries
The system does not sync with the partner sales channel. Staff enter partner sales by hand.
We stay authoritative for every seat. See ADR-0011.
```

Three rules keep it useful:

1. **Present tense, no history.** Never "in v2 we added". The moment it takes a changelog voice
   it grows forever and stops being read. History is git.
2. **Keep it short.** Six domains at 60 lines each means an agent reads the *whole tree* every
   session for almost nothing. A 2,000-line tree does not get read. This is a **context budget**
   rule, not a style preference.
3. **It shrinks over time.** As rules become tests, the prose thins. What stays is the rules
   that *cannot* be tests — scope boundaries, business policy, who is authoritative. Those are
   exactly why the file exists.

---

### Step 5 · PROVE — the rules as failing tests

**You produce:** `tests/invariants/<area>/CAP-1.test.ts`, red.

```ts
// @invariant CAP-1
describe('CAP-1: available capacity is never negative', () => {
  it('refuses an order larger than what remains', async () => { /* ... */ })
  it('holds the line when 20 buyers race for the last seat', async () => { /* ... */ })
  it.prop([arbitraryOperationSequence()])('never goes negative', async (ops) => { /* ... */ })
})
```

The `// @invariant CAP-1` marker is required — it is how the sync check pairs prose to test.

The prose and the test may say the same thing. **Only the test is authoritative.** The SSOT is
the human-readable index into the tests.

**Append-only.** Add freely, strengthen freely. Weakening or deleting one needs a human and an
ADR. **Every bug found later becomes a new invariant**, not a unit test — that is how the suite
accumulates domain knowledge nobody could have written on day one.

Prefer property tests. "For any sequence of operations, X holds" catches what enumerated cases
miss.

---

### Step 6 · SHAPE — the contracts

**You produce:** Zod schemas in `packages/contracts/`. That is all a contract is.

```ts
export const CreateOrderRequest = z.object({
  idempotencyKey: z.uuid(),     // buyers double-submit; see ADR-0009
  holdId: z.string(),
  quotedTotalCents: Cents,      // server rejects if the price moved; see ADR-0012
})
export type CreateOrderRequest = z.infer<typeof CreateOrderRequest>
```

Server validates with it. Client imports the type. Change a field and the other side fails to
typecheck. That is what "frozen contract" means — nothing more mystical.

Those comments pointing at ADRs are the discoverability mechanism at the code layer.

**Never define a shape twice.** OpenAPI, JSON Schema, typed clients, and Python models are all
*generated* from these files. If a Python service needs these types, generate them; never
hand-write them there.

---

### Step 7 · SPLIT — tickets

**You produce:** `specs/<feature>/tickets/NN-name.md`.

```yaml
---
invariants: [CAP-1, CAP-2]
adrs: [ADR-0007]
contracts: none        # none | additive | breaking
---
```

**That frontmatter is the gate.** You cannot fill it in without reading the SSOT, which is
exactly the point. CI fails if any ID does not resolve.

**Slice by tracer bullet, not by layer.** Not "schema, then API, then UI" — nothing works until
all three land and integration errors surface at the end. Instead each ticket makes one thing
work end to end, however thin.

About 400 changed lines. **Only one in-flight ticket may touch `packages/contracts/`.**

---

### Step 8 · BUILD

Implement until the tests pass. One rule matters here:

| Test | Written | Implementer may edit |
|---|---|---|
| `tests/invariants/` | before the ticket, from the SSOT | **No.** CI blocks it. |
| contract tests | before the ticket, from the trace | **No.** CI blocks it. |
| unit tests | during implementation | Yes — disposable |

When `CAP-1` goes red, the cheapest way to make it green is to change `CAP-1`. An agent that
*can* do that *will*. Separating who writes which tests is what makes AI-written code safe at
volume.

---

### Step 9 · HARVEST — drain the scaffolding

**Run:** the `harvest` skill, at merge.

Nobody "updates the docs". You run one pass with one question:

> **What did we learn building this that is not visible in the code, and still true next year?**

That, and only that, moves into the durable layer:

```
docs/ssot/CAPACITY.md    + CAP-7 — cancelling an event releases every active hold
docs/adr/0016-*.md       new — the sweeper runs every 30s, not on read
specs/ticketing-v1/      status: shipped. Never touched again.
CODEMAP.md               regenerated
```

Nothing hand-written lists the new endpoints. That is derivable — generate it.

**Look hardest at what a reviewer questioned.** A question a human had to ask is a fact that was
not written down.

The spec folder then freezes as a historical record. Nobody reads it again. That is fine — it
did its job.

---

## Part 4 — The two entry points

### A. New domain (you have never built in this area)

Full nine stages. About two days before the first line of application code.

That feels expensive. It replaces the two weeks you would otherwise spend discovering, in
production, that capacity should have been modelled differently.

### B. A feature on an existing domain

Start with **triage**, which takes two minutes:

> **Does this touch an existing invariant, or contradict an ADR?**
>
> - **Yes** → domain change. **Stop.** A human decides. The SSOT changes first, in its own
>   commit, with a new ADR. Code follows.
> - **No** → additive. Go fast.

Then: trace the new flow only → split → build → harvest.

**Worked example.** A ticket asks for waitlists: when an event sells out, buyers join a queue.
Triage finds CAP-1 (capacity never negative) and ADR-0007 (holds are rows). A waitlist entry is
not a hold and consumes no capacity, so neither is contradicted. **Additive — go fast.**

Had the ticket instead said "let staff oversell by 5%", triage hits CAP-1 head-on. That stops
and goes to a human, because it is a business decision wearing a technical costume.

You cannot answer the triage question without reading the SSOT. That is why the gate exists, and
why ticket frontmatter is machine-checked.

---

## Part 5 — What is actually enforced

Most of this document is advice. **Four checks are not.** They run in `mise run check` and in
CI, and they fail the build.

| Check | Catches |
|---|---|
| `ssot-invariant-sync` | An SSOT rule with no test. A test citing a rule that does not exist. Two SSOTs claiming one prefix. |
| `ticket-frontmatter` | A ticket naming no invariants, or naming IDs that do not resolve. A breaking contract change with no ADR. |
| `codemap-drift` | A hand-edited or stale `CODEMAP.md`. |
| `adr-index-sync` | An ADR missing from the index — one nobody will ever find. |
| `root-layout` | A stray `src/`, `lib/`, or `utils/` at the root. |
| `invariant-guard` | A PR touching invariant tests *and* application code together, without the `invariant-change` label. |

Plus, once a database exists: migration checksum validation and destructive-change linting,
both provided by the migration tool rather than written here.

One command, everywhere. Humans, agents, git hooks, and CI all run the same thing:

```bash
mise run check
```

If they diverge, "it passes locally" stops meaning anything.

Hooks are fast feedback; **CI is the authority.** Pre-commit stays under 5 seconds — a slow
pre-commit does not improve quality, it teaches everyone to reach for `--no-verify`, after which
nothing is enforced at all.

---

## Part 6 — Questions this answers

**"Should I document this new endpoint?"**
No. It is derivable — generate the OpenAPI. Document *why* it takes a quoted total.

**"The SSOT and the code disagree."**
That is a bug in one of them. Stop and resolve it. Never pick one silently.

**"This rule is in the SSOT and in a test. Is that duplication?"**
No. The same statement in two places is fine. Two places claiming *authority* is not. The test
is authoritative; the SSOT is the index into it.

**"I need to update a shipped spec."**
You do not. What you learned belongs in the SSOT or an ADR. Put it there.

**"If an AI writes the trace, what is the point?"**
The point was never the writing. It is the **review**. The trace is the only artifact small
enough for a human to apply judgment to and specific enough for that judgment to matter.

**"Nobody will read a 20-line ADR from last year."**
An agent will, in about 40 milliseconds, because the index is greppable. That is the audience.

**"This document is getting long."**
Then it holds something derivable, or it holds history. Move the derivable part to a generator.
Move the history to git.

**"Do I really need all nine stages for a one-line fix?"**
No. Triage, fix, done. The full loop is for new domains. For a normal feature it is under two
hours.

---

## Cheat sheet

```
STARTING A FEATURE
  existing domain?  → triage: touches an invariant or contradicts an ADR?
                        yes → stop, human decides, SSOT first
                        no  → go
  new domain?       → /spec, then the full nine stages

WRITING
  a rule that must always hold ......... docs/ssot/  + a test citing its ID
  why we chose this .................... docs/adr/   (with Rejected — required)
  what the code does ................... nowhere. Generate it.
  a shape crossing a boundary .......... packages/contracts/
  a table or column .................... database/schema/  — never a migration
  a color or spacing value ............. packages/tokens/  — never a literal
  scaffolding for this feature ......... specs/<feature>/  (dies at merge)

SKILLS
  /discover ..... orient before touching anything
  /spec ......... interrogate → trace  (then YOU review it for 10 minutes)
  /probe ........ only for what you cannot reason out. Usually skip.
  /ticketize .... approved trace → tickets with checked frontmatter
  /harvest ...... at merge: drain into SSOT + ADRs, freeze the spec

NEVER
  hand-edit CODEMAP.md, generated OpenAPI, or anything under a dist/ or migrations/ dir
  hand-write a migration — edit database/schema/ and generate
  run an infra or schema apply — agents plan, CI applies
  define the same schema twice
  weaken or delete an invariant without a human + an ADR
  edit tests/invariants/ in the same PR as application code
  use --no-verify
  write prose that describes what the code does

ONE COMMAND
  mise run check
```
