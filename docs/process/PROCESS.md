# The Process

How work moves from an idea to merged code. Read this once, fully. Everything else is reference.

If you only read one file, read `ONEPAGER.md` instead. This document is the detailed version.

---

> ### The example used throughout
>
> Every example below comes from one small system: **an app that sells tickets to events.**
>
> - An event has a fixed number of seats.
> - A buyer picks an event, **holds** seats while they enter payment, then confirms.
> - Staff can cancel an order, which returns those seats to the pool.
>
> That is the whole domain. You now know everything you need to follow every example in this
> document. Replace it with your own domain; the shape does not change.

---

## Why this exists

An agent writes a feature in an hour. It cannot know the things you decided and never wrote
down. Three examples from the ticketing app:

- Seats are counted per ticket type, not per numbered seat, because most events are general
  admission and numbering them would double the work for no gain.
- A hold lasts 10 minutes, because that is how long the payment provider keeps a session open.
- Sales made through a partner site are entered by staff, not synced, because the partner has
  no webhook.

None of that is in the code. An agent reading the code sees *that* holds expire. It cannot see
*why* 10 minutes, and it will happily change the number.

So this process separates three things that most teams mix together.

| Kind | Example | Where it goes |
|---|---|---|
| What the system does | the order endpoint | code |
| What must always be true | capacity never goes negative | `tests/invariants/` |
| Why we chose this | holds are rows, not cache entries, because staff must see them | `docs/adr/` |

Prose describing the first kind always rots. Prose capturing the third kind never does.

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

The agent asks. You answer. The agent does not write the feature. Its job is to find the
questions you have not asked yourself.

```
Q: A buyer is on the payment screen. Are those seats held, or still on sale?
A: Held.
Q: For how long?
A: 10 minutes. That is how long the payment provider keeps a session open.
Q: Payment fails at minute 3. Release the seats now, or wait out the 10?
A: Now.
Q: Do you sell the same seats anywhere else?
A: Yes, through a partner site.
Q: Then who is authoritative for a seat that both systems could sell?
A: We are. The partner has no webhook, so staff enter partner sales by hand.
Q: Can staff oversell an event on purpose?
A: No. Never.
Q: Are seats numbered, or general admission?
A: General admission. We count by ticket type.
```

Twenty minutes. Keep going until the agent runs out of questions with more than one defensible
answer.

Notice what happened. The question "who is authoritative?" produced a rule that no amount of
reading the code would ever reveal, and that a new agent would otherwise guess at.

### TRACE.md — the fake session log

A trace is **curl output that you made up before the code exists**. Real endpoints, real field
names, real values.

```
## Flow: buyer purchases two tickets

### 1. Buyer opens the event page
GET /api/events/evt_18/availability
→ 200
{ "available": 3, "unitPriceCents": 4500, "currency": "USD" }

### 2. Buyer clicks Buy. We hold the seats.
POST /api/holds
{ "eventId": "evt_18", "ticketTypeId": "ga", "quantity": 2 }
→ 201 { "holdId": "hold_a1b2", "expiresAt": "2026-08-17T10:10:00Z" }

### 3. Buyer submits payment
POST /api/orders
{ "idempotencyKey": "c7f3a...", "holdId": "hold_a1b2",
  "buyer": { "name": "Alex Kim", "email": "alex@example.com" },
  "quotedTotalCents": 9000 }
→ 201 { "orderId": "ord_9k2", "status": "confirmed", "totalCents": 9000 }

### 4. Availability drops
GET /api/events/evt_18/availability
→ 200 { "available": 1, "unitPriceCents": 4500, "currency": "USD" }

## Flow: staff cancels the order

### 5. Staff cancels
POST /api/orders/ord_9k2/cancel
→ 200 { "orderId": "ord_9k2", "status": "cancelled" }

### 6. Seats return
GET /api/events/evt_18/availability
→ 200 { "available": 3, ... }
```

**The agent writes this in two minutes. You review it for ten. The review is the point.**

You cannot review a PRD. It is prose, you nod along, and you catch nothing. You cannot review
2,000 lines of implementation. You do not have the working memory. You *can* review 40 lines of
concrete JSON, where every field name and status code is a decision you accept or reject.

A trace does three jobs.

1. **It compresses the design into something you can judge in five minutes.** This is the one
   cheap checkpoint where your taste applies.
2. **It catches misunderstanding early.** If the agent returned `available: 2` after a
   cancellation instead of 3, you see it in three seconds. Baked into 2,000 lines, you find it
   in QA.
3. **It removes guessing downstream.** Contracts, tests, and tickets are derived from the trace.
   Without one, the executor invents field names.

Approving a trace you did not read carefully collapses the whole process. Those ten minutes are
where you are the engineer.

Write one trace per major flow. Six flows is normal for a new product. **Always trace the
reversal path** — cancel, refund, expire, undo. Most bugs live there, and step 5 above is the
step people skip.

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

In the trace above, one blank appeared: two buyers click Buy on the last seat at the same
instant. Nobody knows what the code would do, because there is no code. That is a probe.

### A probe is a throwaway script

```js
// probe-oversell.mjs
// Question: does check-then-insert oversell the last seat?
await db.execute(`CREATE TABLE cap (event text, sold int)`)
await db.execute(`INSERT INTO cap VALUES ('evt_18', 9)`)   // capacity 10, 9 sold

const buy = async () => {
  const { sold } = await db.one(`SELECT sold FROM cap WHERE event='evt_18'`)
  if (sold >= 10) return 'rejected'
  await db.execute(`UPDATE cap SET sold = sold + 1 WHERE event='evt_18'`)
  return 'confirmed'
}

const r = await Promise.all(Array.from({ length: 20 }, buy))
console.log(r.filter(x => x === 'confirmed').length)   // → 4. Bad. Expected 1.
```

Twenty minutes. Then delete the file.

### The output is a sentence, not code

> Naive `SELECT then UPDATE` let 4 of 20 concurrent buyers through when 1 seat remained. This
> needs `SELECT FOR UPDATE` on the capacity row, or a database constraint. Holding the row lock
> for the whole request adds ~3ms under this load — acceptable. Separately: nothing in the trace
> says what happens to an active hold when staff cancel the whole event.

That last sentence is what you cannot get any other way. The probe had to make a decision nobody
specified, and that surfaced a question you did not know to ask.

### Probes apply to every layer

| Layer | A question you cannot think your way to | The probe |
|---|---|---|
| Backend | Does check-then-insert oversell under load? | 50 lines, 20 writers, count |
| Migration | Does this index lock the table? Does the backfill finish? | run it on a database branch, time it |
| Frontend | Does a 500-row seating chart stay smooth while scrolling? | render it with fake data, scroll |
| Layout | Does this design survive German, where strings run 30% longer? | paste real strings in, look |
| External | Does the payment provider actually return the field its docs promise? | one call, print the raw response |
| Performance | Is this query fast enough at 50,000 orders? | seed a branch, run it, record the number |

### Discipline

- **Write the question down first.** One sentence. If you cannot, you are building, not probing.
- **Smallest thing that answers it.** No types, no error handling, no structure.
- **Never commit it.** `probe-*` is in `.gitignore`.
- **If you start making it nice, stop.** You have drifted into implementation.

**Most tickets need zero probes. Zero is the normal number.** Probe a new domain, an unknown
external dependency, or an unknown non-functional property. Nothing else.

### The cheaper substitute

For anything not genuinely uncertain, run an adversarial pass on the trace instead. Give an
agent the `TRACE.md` and ask it to break the flow — 30 failure modes, ranked. Ten minutes, no
code. Use this by default. Probe only what survives it.

---

## 3. DECIDE — write the ADRs

Every non-obvious decision from SPEC and PROBE becomes one ADR. Append-only. Never edited.
About 20 lines. If it takes more than three minutes to write, it will not get written.

```markdown
# ADR-0007: A hold is a database row, not a cache entry with a TTL

Date: 2026-08-17
Status: accepted

## Decision
A hold is a row in the `holds` table with an `expires_at` timestamp. A background job
removes expired rows. Holds are not stored in the cache.

## Why
Staff need to see held seats on the event dashboard while a buyer is still paying. A support
call asking "why does it say sold out?" has to be answerable. A cache entry is invisible to
every query the dashboard makes, and it disappears on a restart, which silently oversells.

## Rejected
- Cache entry with a TTL. Simpler and expires for free. Invisible to staff, and lost on
  restart.
- No hold at all; check capacity at payment time. Buyers reach the payment screen and then
  fail, which is the worst place to fail.

## Consequences
Expired holds need a sweeper job. Every capacity query must exclude expired holds, so
"active hold" is a predicate that appears in several queries and must stay consistent.
```

**The Rejected section is the load-bearing part.** It stops someone in six months from
"simplifying" this to a cache TTL and re-litigating a decision you already made. An ADR without
rejected options is half an ADR.

Superseding: write a new ADR. Set the old one's status to `superseded by ADR-0031`. Change
nothing else in it. History stays readable.

---

## 4. STATE — write the SSOT

One file per domain area. Present tense. No history. Every rule carries an ID.

```markdown
---
domain: Capacity
prefix: CAP
status: active
---

# SSOT — Capacity

Decisions: ADR-0007, ADR-0009, ADR-0011
Executable form: `tests/invariants/capacity/`

## Model

An event has a capacity for each ticket type. Capacity is the number of seats we can sell. It
does not change when someone buys.

Available capacity is the capacity, minus confirmed orders, minus active holds, minus staff
blocks.

A hold is active when it has not expired and has not been released. See ADR-0007.

## Rules

- **CAP-1** — Available capacity is never negative. The system refuses an order that would make
  it negative.
- **CAP-2** — A hold reserves seats for 10 minutes. An expired or released hold frees its seats
  immediately.
- **CAP-3** — A cancelled order frees exactly the seats it held.
- **CAP-4** — A change to an order acquires the new seats before it frees the old seats. If it
  cannot acquire them, the order does not change.
- **CAP-5** — A staff block consumes capacity in the same way as an order.
- **CAP-6** — Two orders never hold the same numbered seat for the same event.

## Boundaries

The system does not sync with the partner sales channel. Staff enter partner sales by hand,
as staff blocks. We stay authoritative for every seat. See ADR-0011.
```

Three rules keep this file useful.

**Present tense, no history.** Describe the system as if it always worked this way. The moment a
document takes a changelog voice it grows forever and stops being read. History is git and
`specs/`.

**Keep it short.** Target 60 lines. Six domains at 60 lines each means an agent loads the whole
tree every session for almost nothing. A 2,000-line tree does not get read. This is a context
budget rule, not a style preference.

**Every rule that can be a test must be a test.** The prose and the test may state the same
rule. Only the test is authoritative. `tooling/checks/ssot-invariant-sync.mjs` fails the build
if a rule has no test, or a test cites a rule that does not exist.

Some rules cannot be tests. The partner-channel boundary above is one. Those are exactly why the
file exists — an agent reading the code would never learn it, and would eventually build the
sync nobody asked for.

---

## 5. PROVE — the rules as running tests

One test file per numbered rule. Written before implementation. Red.

```ts
// @invariant CAP-1
describe('CAP-1: available capacity is never negative', () => {
  it('refuses an order larger than what remains', async () => { /* ... */ })

  it('holds the line when many buyers race for the last seat', async () => {
    // 20 simultaneous orders, 1 seat left → exactly 1 confirmed, 19 rejected
  })

  it.prop([arbitraryOperationSequence()])('never goes negative', async (ops) => {
    // property test over random buy / cancel / hold / expire / block sequences
  })
})
```

The `// @invariant CAP-1` marker is how the sync check finds it. It is required.

**Invariants are append-only.** Add them freely. Strengthen them freely. Weakening or deleting
one needs a human, and an ADR in the same PR.

**Every bug found becomes a new invariant, not a unit test.** This is how the suite accumulates
domain knowledge nobody could have written on day one.

---

## 6. SHAPE — the contracts

`packages/contracts/` holds Zod schemas. That is all a contract is.

```ts
export const Cents = z.number().int().nonnegative()

export const CreateOrderRequest = z.object({
  idempotencyKey: z.uuid(),     // buyers double-submit; see ADR-0009
  holdId: z.string(),
  quantity: z.number().int().min(1),
  buyer: z.object({ name: z.string().min(1), email: z.email() }),
  quotedTotalCents: Cents,      // server rejects if the price moved; see ADR-0012
})

export type CreateOrderRequest = z.infer<typeof CreateOrderRequest>
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
invariants: [CAP-1, CAP-2]
adrs: [ADR-0007]
contracts: none          # additive only, no packages/contracts edit
---

## Goal
A buyer holds seats for 10 minutes while paying.

## Done when
- tests/invariants/capacity/CAP-2.test.ts is green
- contract tests for POST /holds and DELETE /holds/:id are green
```

That frontmatter is the triage gate in machine-checkable form. You cannot fill it in without
reading the SSOT. `tooling/checks/ticket-frontmatter.mjs` verifies every ID resolves.

Slice by tracer bullet, not by layer. Not "build the schema, then the API, then the UI" —
nothing works until all three land. Instead: each ticket makes one thing work end to end,
however thin.

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

An agent that can edit the test judging it will edit that test. When `CAP-1` goes red, the
cheapest way to make it green is to change `CAP-1`. Separating these is what makes AI-written
code safe at volume.

---

## 9. HARVEST — drain the scaffolding

At merge, nobody "updates the docs". You run one distillation pass with one question:

> What did we learn building this that is not visible in the code, and still true next year?

That, and only that, moves into the durable layer.

```
docs/ssot/CAPACITY.md    add CAP-7: cancelling an event releases every active hold
docs/adr/0016-*.md       new: the hold sweeper runs every 30 seconds, not on read,
                         because the dashboard must not depend on traffic to stay correct
specs/ticketing-v1/      stamp status: shipped. Never touch again.
CODEMAP.md               regenerate
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

A worked example. A ticket asks for waitlists: when an event sells out, buyers join a queue.
Triage finds CAP-1 (capacity never negative) and ADR-0007 (holds are rows). A waitlist entry is
not a hold and consumes no capacity, so neither is contradicted. Additive. Go fast. Had the
ticket instead asked to "let staff oversell by 5%", triage would have hit CAP-1 head-on, and
that stops and goes to a human.

---

## Working alongside other people

Another person's agent finds your context through four mechanisms, in order of importance.

1. **One entry point.** `AGENTS.md` tells every agent to read `docs/ssot/` and `CODEMAP.md`
   before proposing anything. This is the only instruction that has to survive.
2. **The SSOT tree is small enough to read whole.** This is what the shrink rule buys.
3. **The ADR index is append-only and greppable.** One line per decision.
4. **The triage gate is mandatory and machine-checked.** No ticket merges without resolvable
   `invariants:` and `adrs:` frontmatter.

The real cross-team risk is not stale documents. It is timing. One person changes CAP-4 while
another is three days into a ticket built on the old CAP-4. Two rules contain it: an invariant
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
