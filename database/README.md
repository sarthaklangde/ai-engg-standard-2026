# database/

**Death rule: `schema/` is hand-written and evolves. `migrations/` is generated once, then
permanent.**

This directory is applied to a database by CI. Nothing imports it. That is why it sits at the
root and not in `packages/`.

```
database/
├── atlas.hcl            config: environments, dev database, lint policy
├── schema/              ← HAND-WRITTEN. The desired state. The contract.
│   ├── 01_identity.sql
│   └── 02_orders.sql
├── migrations/          ← GENERATED. Frozen the moment they merge.
│   ├── 20260818103000_init.sql
│   └── atlas.sum        integrity hashes, maintained by Atlas
└── seed/
    └── dev.sql          use the values from your TRACE.md
```

## The two directories are opposites

| | `schema/` | `migrations/` |
|---|---|---|
| Written by | a human or an agent | `atlas migrate diff` |
| Edited after merge | yes, freely | **never** |
| Reviewed as | a schema diff, seconds | not reviewed — the schema diff was |

**Nobody writes DDL by hand.** You state the schema you want; a deterministic tool computes the
change. Under AI authorship this matters more, not less: an agent-written migration is a sample
from a distribution, while `diff(old, new)` is a function. It moves the highest-stakes artifact
in the system out of the layer that hallucinates.

The reviewable artifact becomes a three-line schema diff instead of forty lines of `ALTER` with
a backfill. That is the same move the trace makes: compress the decision into something a human
can actually judge.

## Rules

1. **Edit `schema/` only.** Never hand-write a file in `migrations/`.
2. **One file per database schema**, named after the domain that owns it. This lines up with
   per-service ownership.
3. **`migrations/` is append-only.** `atlas migrate validate` enforces this through `atlas.sum`,
   which also catches out-of-order insertion. Wire it into CI.
4. **`atlas migrate lint` gates every change.** It catches destructive changes, a `NOT NULL`
   added without a default, backwards-incompatible type changes, and index creation that locks.
   This is how "expand-contract, never destructive in one step" stops being prose.
5. **Only one in-flight ticket may touch `schema/`.** Two agents diffing against different base
   schemas produce migrations that conflict semantically while merging cleanly.
6. **A rename needs a human and an ADR.** See the trap below.
7. **CI applies migrations. Services never do.** A service that migrates at startup races its
   own replicas, and a worker booting mid-deploy applies a change the API is not ready for.

## The trap: renames

An agent renames a column in `schema/`. Atlas diffs and produces:

```sql
ALTER TABLE orders DROP COLUMN status;
ALTER TABLE orders ADD COLUMN state text;
```

Data loss, and the schema diff looked entirely reasonable. `atlas migrate lint` flags the drop
as destructive, which is exactly why the lint gate is not optional. Treat a rename as the same
tier of change as weakening an invariant.

## Types

**Atlas does not generate application types.** It manages DDL and nothing else. Type generation
is a separate chain, and it runs after migrations apply.

Generate per owned schema, not one shared package for everything. A shared models package that
every service imports rebuilds the coupling that schema-per-service ownership removes.

## Ownership

One writer per table. Everyone else reads through the owning service's API.

Enforce it with database roles, not documentation — a service that only holds `SELECT` on
another's tables cannot write to them, whatever an agent decides at 2am. Record the ownership
map in an ADR.

## Setup note

Atlas computes diffs by applying your schema to a real, empty database and introspecting the
result — the engine is the parser. That means **Docker must be available locally and in CI**:

```hcl
env "local" {
  dev = "docker://postgres/16/dev"   # created and destroyed per command
}
```

Every schema-diffing tool needs this. Atlas is explicit where ORM-based tools hide it behind a
connection you had already configured.
