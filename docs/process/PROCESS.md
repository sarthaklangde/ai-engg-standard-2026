# The Process

How work moves from an idea to merged code. Read this once, fully. Everything else is reference.

The examples use a hotel booking system. Replace the domain, keep the shape.

---

## Why this exists

An agent writes a feature in an hour. It cannot know why you sell inventory by room type and
not by room, or that Airbnb stays authoritative until December. That knowledge is not in the
code and cannot be recovered from it.

So this process separates three things that most teams mix together.

| Kind | Example | Where it goes |
|---|---|---|
| What the system does | the booking endpoint | code |
| What must always be true | availability never goes negative | `tests/invariants/` |
| Why we chose this | room type, not room, because managers reshuffle daily | `docs/adr/` |

Prose that describes the first kind always rots. Prose that captures the third kind never does.

---

## The nine stages

```
SPEC → PROBE → DECIDE → STATE → PROVE → SHAPE → SPLIT → BUILD → HARVEST
```

The first six produce no application code. That is intended. They cost about two days on a new
domain and a few hours on a feature. They remove the guessing that costs weeks later.

---

## 1. SPEC — interrogate, then trace

**Two artifacts. Both are scaffolding. Both die at merge.**

### DECISIONS.md — the interrogation

The agent asks. You answer. The agent does not write the feature. It finds the questions you
have not asked yourself. This is the step that fixes "developers do not think hard enough".

```
Q: Are these rooms live on Airbnb while our site sells them?
A: Yes, until at least December 2026.
Q: Then who is authoritative for a given night?
A: Airbnb for its own bookings. The manager blocks those by hand. No sync.
Q: Does a guest hold the room while entering payment?
A: Yes, 15 minutes.
Q: Payment fails at minute 3. Release now, or wait out the 15?
A: Now.
Q: Is inventory counted per physical room, or per room type?
A: Per type for selling. The specific room is assigned separately.
Q: Can a manager overbook by one on purpose?
A: No. Never.
```

Keep going until the agent runs out of questions. Twenty minutes.

### TRACE.md — the fake session log

A trace is **curl output that you made up before the code exists**. Real endpoints, real field
names, real values.

```
## Flow: guest books two nights

### 1. Guest opens the room page
GET /api/room-types/deluxe/availability?from=2026-09-01&to=2026-09-03
→ 200
{ "available": 3,
  "nights": [ {"date":"2026-09-01","amountVnd":1200000},
              {"date":"2026-09-02","amountVnd":1200000} ] }

### 2. Guest clicks Book. We hold the room.
POST /api/holds
{ "roomTypeId":"deluxe", "checkIn":"2026-09-01", "checkOut":"2026-09-03" }
→ 201 { "holdId":"hold_a1b2", "expiresAt":"2026-08-14T10:15:00Z" }

### 3. Guest submits the payment form
POST /api/bookings
{ "idempotencyKey":"c7f3...", "holdId":"hold_a1b2",
  "guest":{"name":"Lan Nguyen","email":"lan@example.com"},
  "quotedTotalVnd":2400000 }
→ 201 { "bookingId":"bk_9k2", "status":"confirmed", "totalVnd":2400000 }

### 4. Availability drops
GET /api/room-types/deluxe/availability?from=2026-09-01&to=2026-09-03
→ 200 { "available": 2, ... }
```

**The agent writes this in two minutes. You review it for ten. The review is the point.**

You cannot review a PRD. It is prose, you nod along, and you catch nothing. You cannot review
2,000 lines of implementation. You do not have the working memory. You *can* review 40 lines of
concrete JSON, where every field name and status code is a decision you accept or reject.

A trace does three jobs.

1. **It compresses the design into something you can judge in five minutes.** This is the one
   cheap checkpoint where your taste applies.
2. **It catches misunderstanding early.** If the agent treated `checkOut` as a night you sell,
   you see it in three seconds. Baked into 2,000 lines, you find it in QA.
3. **It removes guessing downstream.** Contracts, tests, and tickets are derived from the
   trace. Without one, the executor invents field names.

Approving a trace you did not read carefully collapses the whole process. Those ten minutes are
where you are the engineer.

Write one trace per major flow. Six flows is a normal number for a new product.

---

## 2. PROBE — answer what you cannot think your way to

**A probe answers a question you cannot answer by reasoning.** That is the whole definition.

The test:

> Can I settle this by thinking, or by reading the docs? → **Do that. No probe.**
> Is running it the only way to know? → **Probe.**

Two kinds of blank appear when you write a trace. Tell them apart.

| Blank | Meaning | What to do |
|---|---|---|
| "I do not know what we want here" | a preference | decide it, write an ADR |
| "I do not know what would happen here" | a fact about the world | probe it |

The trace generates the probes. That is how the two connect.

### A probe is a throwaway script

```js
// probe-concurrency.mjs
// Question: does check-then-insert overbook?
await db.execute(`CREATE TABLE inv (night date, room text, taken int)`)
await db.execute(`INSERT INTO inv VALUES ('2026-09-01','deluxe',0)`)

const book = async () => {
  const { taken } = await db.one(`SELECT taken FROM inv WHERE night='2026-09-01'`)
  if (taken >= 1) return 'rejected'
  await db.execute(`UPDATE inv SET taken = taken + 1 WHERE night='2026-09-01'`)
  return 'confirmed'
}

const r = await Promise.all(Array.from({ length: 20 }, book))
console.log(r.filter(x => x === 'confirmed').length)   // → 4. Bad.
```

Twenty minutes. Then delete the file.

### The output is a sentence, not code

> Naive `SELECT count → INSERT` lets 4 of 20 concurrent requests through on inventory 1. This
> needs `SELECT FOR UPDATE` on a per-night row, or a unique constraint. Per-night rows make a
> 30-day by 5-room-type calendar query touch 150 rows — 12ms, fine. Separately: nothing in the
> trace says what a manager block does to an existing hold.

That paragraph produced two ADRs, one invariant test, and one gap in the trace. The last
sentence is what you cannot get any other way. The probe had to make a decision you never
specified, and that surfaced a question you did not know to ask.

### Probes apply to every layer

| Layer | A question you cannot think your way to | The probe |
|---|---|---|
| Backend | Does check-then-insert overbook under load? | 50 lines, 20 writers, count |
| Migration | Does this index lock the table? Does the backfill finish? | run it on a DB branch, time it |
| Frontend | Does a 90-day calendar with price labels stay smooth? | render it with fake data, scroll |
| Frontend | Does this layout survive Vietnamese strings, 30% longer? | paste real strings in, look |
| External | Does the scraper actually return amenities? | one URL, print the output |
| Perf | Is this query fast enough at 50k rows? | seed a branch, run it |

### Discipline

- **Write the question down first.** One sentence. If you cannot, you are building, not probing.
- **Smallest thing that answers it.** No types, no error handling, no structure.
- **Never commit it.** `probe-*` is in `.gitignore`.
- **If you start making it nice, stop.** You have drifted into implementation.

**Most tickets need zero probes. Zero is the normal number.** Probe a new domain, an unknown
external dependency, or an unknown non-functional property. Nothing else.

### The cheaper substitute

For everything that is not genuinely uncertain, run an adversarial pass on the trace instead.
Give an agent the `TRACE.md` and ask it to break the flow. Thirty failure modes, ranked. Ten
minutes, no code. Use this by default. Probe only what survives it.

---

## 3. DECIDE — write the ADRs

Every non-obvious decision from SPEC and PROBE becomes one ADR. Append-only. Never edited.
About 20 lines. If it takes more than three minutes to write, it will not get written.

```markdown
# ADR-0007: Availability is tracked per room type, not per unit

Date: 2026-08-14
Status: accepted

## Decision
Availability is held against `room_type`. Units are assigned to a booking separately.
A unit may be reassigned at any time before check-in.

## Why
Managers reshuffle guests between identical rooms every day: maintenance, group adjacency,
early checkout. Binding a booking to a unit at reservation time makes every reshuffle an
availability mutation. It also lets a reshuffle fail for reasons the guest cannot see.

## Rejected
- Per-unit availability. Correct by construction. Makes the most common manager operation
  expensive and failure-prone.
- Assign the unit only at check-in. The manager calendar must show allocation before arrival.

## Consequences
`unit_id` is nullable on a confirmed booking. Any unit-row calendar must render
unassigned bookings.
```

**The Rejected section is the load-bearing part.** It stops someone in March from "fixing" this
and re-litigating a decision you already made. An ADR without rejected options is half an ADR.

Superseding: write a new ADR. Set the old one's status to `superseded by ADR-0031`. Change
nothing else in it. History stays readable.

---

## 4. STATE — write the SSOT

One file per domain area. Present tense. No history. Every rule carries an ID.

```markdown
---
domain: Availability
prefix: AV
status: active
---

# SSOT — Availability

Decisions: ADR-0007, ADR-0011, ADR-0012
Executable form: `tests/invariants/availability/`

## Model

A stay is a set of nights. A night is a local date in Asia/Ho_Chi_Minh.
A booking from 2026-09-01 to 2026-09-03 holds two nights: 09-01 and 09-02.
The check-out date is not a night. All ranges are half-open.

Each room type has an inventory count for each night. The count is the number of sellable
units. A booking does not change the count.

Availability for a night is the inventory count, minus confirmed bookings and active holds
that cover that night.

## Rules

- **AV-1** — Availability is never negative. The system refuses a booking that would make it
  negative.
- **AV-2** — A hold reserves nights for 15 minutes. An expired or released hold frees its
  nights immediately.
- **AV-3** — A cancelled booking frees exactly the nights it held.
- **AV-4** — A date change acquires the new nights before it frees the old nights. If it
  cannot acquire them, the booking does not change.
- **AV-5** — A unit assignment does not change availability.
- **AV-6** — Two bookings must not hold the same unit on the same night.
- **AV-7** — A manager block consumes inventory in the same way as a booking.

## Boundaries

The system does not read availability from Airbnb. The manager blocks Airbnb-sold nights by
hand. See ADR-0011.
```

Three rules keep this file useful.

**Present tense, no history.** Describe the system as if it always worked this way. The moment
a document takes a changelog voice it grows forever and stops being read. History is git and
`specs/`.

**Keep it short.** Six domains at 60 lines each means an agent loads the whole tree every
session for almost nothing. A 2,000-line doc tree does not get read. This is a context budget
rule, not a style preference.

**Every rule that can be a test must be a test.** The prose and the test may state the same
rule. Only the test is authoritative. `tooling/checks/ssot-invariant-sync.mjs` fails the build
if a rule has no test, or a test cites a rule that does not exist.

Some rules cannot be tests. The Airbnb boundary above is one. Those are exactly why the file
exists.

---

## 5. PROVE — the rules as running tests

One test file per numbered rule. Written before implementation. Red.

```ts
// @invariant AV-1
describe('AV-1: availability is never negative', () => {
  it('refuses a booking that exceeds inventory', async () => { /* ... */ })

  it('holds under concurrent booking of the last room', async () => {
    // 20 simultaneous requests, inventory 1 → exactly 1 confirmed, 19 rejected
  })

  it.prop([arbitraryBookingSequence()])('never goes negative', async (ops) => {
    // property test over random book / cancel / change / block sequences
  })
})
```

The `// @invariant AV-1` marker is how the sync check finds it. It is required.

**Invariants are append-only.** Add them freely. Strengthen them freely. Weakening or deleting
one needs a human, and an ADR in the same PR.

**Every bug found becomes a new invariant, not a unit test.** This is how the suite accumulates
domain knowledge that nobody could have written on day one.

---

## 6. SHAPE — the contracts

`packages/contracts/` holds Zod schemas. That is all a contract is.

```ts
export const LocalDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
export const Vnd = z.number().int().nonnegative()

export const CreateBookingRequest = z.object({
  idempotencyKey: z.uuid(),
  holdId: z.string(),
  checkIn: LocalDate,
  checkOut: LocalDate,          // exclusive — see SSOT AVAILABILITY, Model
  guest: z.object({ name: z.string().min(1), email: z.email() }),
  quotedTotalVnd: Vnd,          // server rejects on drift — see ADR-0014
}).refine(v => v.checkOut > v.checkIn, 'checkOut must be after checkIn')

export type CreateBookingRequest = z.infer<typeof CreateBookingRequest>
```

The server validates with it. The web app imports the type. Change a field and the other side
fails to typecheck. That is what a frozen contract means in practice.

Those two comments are the discoverability mechanism at the code layer. An agent editing this
file finds the intent without being told to look.

The OpenAPI document is generated from these schemas. Never hand-write one. See
`packages/contracts/README.md`, which also covers the path to other languages.

---

## 7. SPLIT — tickets

```markdown
---
invariants: [AV-1, AV-2]
adrs: [ADR-0007]
contracts: none          # additive only, no packages/contracts edit
---

## Goal
A guest holds nights for 15 minutes while paying.

## Done when
- tests/invariants/availability/AV-2.test.ts is green
- contract tests for POST /holds and DELETE /holds/:id are green
```

That frontmatter is the triage gate in machine-checkable form. You cannot fill it in without
reading the SSOT. `tooling/checks/ticket-frontmatter.mjs` verifies every ID resolves.

Keep tickets to about 400 changed lines. Only one in-flight ticket may touch
`packages/contracts/`. Schema changes serialize.

---

## 8. BUILD

Implement until the invariant and contract tests pass.

Who writes which tests matters.

| Test | Written | Editable by the implementer |
|---|---|---|
| `tests/invariants/` | before the ticket, from the SSOT | **No.** CI blocks it. |
| contract tests | before the ticket, from the trace | **No.** CI blocks it. |
| unit tests, co-located | during implementation | Yes. They are scaffolding. |

An agent that can edit the test that judges it will edit the test. Separating these is what
makes AI-written code safe at volume.

---

## 9. HARVEST — drain the scaffolding

At merge, nobody "updates the docs". You run one distillation pass with one question:

> What did we learn building this that is not visible in the code, and still true next year?

That, and only that, moves into the durable layer.

```
docs/ssot/AVAILABILITY.md   add AV-8: a block cancels overlapping holds
docs/adr/0016-*.md          new: holds are rows, not a cache TTL, because the
                            manager calendar must display them
specs/booking-v1/           stamp status: shipped. Never touch again.
CODEMAP.md                  regenerate
```

Nothing hand-written lists the new endpoints. That is derivable. Generate it.

The spec folder freezes as a historical record. Nobody reads it again. That is fine. It did its
job.

---

## Feature work on an existing system

Everything above assumes a new domain. Adding to one that exists is shorter.

```
TRIAGE   does this touch an invariant, or contradict an ADR?
         yes → domain change. Human decides. SSOT changes first, in its own commit.
         no  → additive. Go fast.
TRACE    the new flow only
SPLIT → BUILD → HARVEST
```

The triage gate is the whole game for feature 40. It costs two minutes and separates cheap work
from work that quietly breaks a rule someone decided six months ago.

---

## Working alongside other people

Another person's agent finds your context through four mechanisms, in order of importance.

1. **One entry point.** `AGENTS.md` tells every agent to read `docs/ssot/` and `CODEMAP.md`
   before proposing anything. This is the only instruction that has to survive.
2. **The SSOT tree is small enough to read whole.** This is what the shrink rule buys.
3. **The ADR index is append-only and greppable.** One line per decision.
4. **The triage gate is mandatory and machine-checked.** No ticket merges without resolvable
   `invariants:` and `adrs:` frontmatter.

The real cross-team risk is not stale documents. It is timing. One person changes AV-4 while
another is three days into a ticket built on the old AV-4. Two rules contain it: an invariant
change needs a human and an ADR, and only one in-flight ticket may touch `packages/contracts/`.
Both make such changes rare and loud, which is the only property that matters.

---

## What this costs

| Stage | New domain | Feature on an existing domain |
|---|---|---|
| SPEC | 2 hours | 20 minutes |
| PROBE | 0 to 1 day | usually zero |
| DECIDE, STATE, PROVE | half a day | 30 minutes |
| SHAPE | 1 hour | 15 minutes |
| HARVEST | 30 minutes | 15 minutes |

About two days before the first line of a new domain. Under two hours for a normal feature.
