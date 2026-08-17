# Day One

The decisions you must make before you write code. Each one is cheap now and brutal to reverse
later. Work through this list, write an ADR for each answer, then start.

Do not skip this because the answers seem obvious. They are obvious right up to the point where
you have 40,000 rows and three services built on the wrong assumption.

---

## 1. Clone and strip

```bash
git clone <this> my-project && cd my-project
rm -rf .git && git init
mise install
```

Then edit these, in order:

- `README.md` — replace with your project
- `AGENTS.md` — section 8, set the real verification commands
- `mise.toml` — pin the runtimes you use
- `docs/engineering-standards/CONTRIBUTION_POLICY.md` — set the reviewer names and branch model
- Delete `docs/ssot/TEMPLATE.md` once your first real SSOT lands

---

## 2. The forced decisions

Answer each. Write one ADR per answer. Numbers 1 to 6 are the ones that hurt.

### Tenancy

- Is this multi-tenant? If you might sell it to a second customer, the answer is yes.
- What is the tenant? An organisation, a customer, a workspace?
- **Every table gets a tenant column from the first migration.** Retrofitting row-level tenancy
  is the single most expensive thing on this list.
- How does a request resolve its tenant? Subdomain, path, token claim?
- Is cross-tenant read ever legal? Name the exact case, or write "never".

### Identity and roles

- One identity system, or two? A staff login and a customer login are different products.
- Name the roles now. Platform-level, tenant-admin, tenant-staff is the usual minimum.
- Is the auth method the same for every app? Say so explicitly, in one place.

### Money

- Which currencies? Store minor units as integers. Never a float. Never a string.
- Where does rounding happen? Once, at one layer. Name it.
- What is the order of operations for discount, fee, and tax? Write it down.
- Is a price locked at transaction time, or recomputed? Almost always locked.
- Are there legal invoicing requirements? Find out now, not at launch.

### Dates and time

- Which timezone is the business in? Does it observe DST?
- Which fields are **local dates** and which are **instants**? They are different types.
- Are ranges half-open? Say it once, in a shared type, and never argue again.
- Never let a language `Date` object cross a service boundary. Strings at the edge.

### Idempotency and concurrency

- Which write operations must be idempotent? Every one a user can double-submit.
- Where does the idempotency key come from? Client-generated, in the contract.
- Which resource has contention? That is your first probe.

### Audit and history

- Which entities need a full history rather than current state? Anything a human disputes.
- Append-only event log, or updated rows plus an audit table? Decide before the first schema.

### The rest

- **Environments.** Local, preview per PR, staging, production. Use database branching.
- **Secrets.** Where they live per environment. Who rotates them.
- **Blast radius.** An agent with production credentials will eventually run a destructive
  command. Give agent environments non-production roles only. Deploys run through CI.
- **Observability.** Error tracking on day one. Not after the first lost transaction.
- **File storage.** If you import images from anywhere, copy them to your own storage. Remote
  URLs rot and hosts block hotlinking.

---

## 3. Name your domains

List the domain areas. Each gets one SSOT file when its first feature is designed. Do not create
the files yet.

A booking product, for example: `AVAILABILITY`, `BOOKING`, `PRICING`, `IDENTITY`, `INVENTORY`.

Four to eight areas is normal. If you have twenty, you are naming features, not domains.

---

## 4. First feature: run the full loop

Pick the thinnest slice that touches every layer. For a booking product: a guest books two
nights, the manager sees it, the manager cancels, availability returns.

Run every stage in `PROCESS.md` on that one slice, even though it feels heavy. It proves the
process, the toolchain, and the CI gates at the same time, on work small enough to throw away
if the process is wrong.

Do not write a PRD for the whole product first. The trace plus one probe gives you a better
specification than a blind PRD, and it costs less.

---

## 5. Turn the gates on

Do this before the second feature, not after the tenth.

- Branch protection: no direct push, PR plus green CI.
- `mise run check` wired into `lefthook` and CI.
- The four checks in `tooling/checks/` running and failing the build.
- A preview environment per PR, with its own database branch.

The standard is advice until CI enforces it. A rule that only lives in a document is a rule an
agent ignores at no cost.

---

## Checklist

- [ ] Repo cloned, git history reset, `mise install` run
- [ ] `AGENTS.md` verification commands are real
- [ ] Tenancy decided, ADR written
- [ ] Identity and roles decided, ADR written
- [ ] Money representation decided, ADR written
- [ ] Date and time types decided, ADR written
- [ ] Idempotency approach decided, ADR written
- [ ] Audit and history approach decided, ADR written
- [ ] Domain areas named
- [ ] Environments and secrets set up
- [ ] Agent credentials scoped to non-production
- [ ] First slice run through all nine stages
- [ ] CI gates on and failing correctly
