# Invariant Tests

**Death rule: permanent. Append-only. Never weakened.**

These are the domain rules in `docs/ssot/`, expressed as running tests. The prose is the index.
**These tests are the authority.**

## Rules

1. **One marker per rule.** Every file states which rule it proves.

   ```ts
   // @invariant CAP-1
   ```

   `tooling/checks/ssot-invariant-sync.mjs` fails the build if an SSOT rule has no test, or a
   test cites a rule that does not exist.

2. **Append-only.** Add invariants freely. Strengthen them freely. Weakening or deleting one
   needs a human and an ADR in the same PR.

3. **Implementers may not edit this directory.** CI blocks a diff that touches both
   `tests/invariants/` and application code, unless the PR is labelled `invariant-change`.
   An agent that can edit the test judging its work will edit that test.

4. **Written before the implementation, from the SSOT.** Not from the code. A test derived from
   the implementation proves only that the code does what the code does.

5. **Every production bug becomes a new invariant here**, not a co-located unit test. This is
   how the suite accumulates domain knowledge nobody could have written on day one.

## What belongs here, and what does not

| Test | Here? |
|---|---|
| A property that must always hold | yes |
| Behavior under concurrency | yes |
| The reversal path — cancel, expire, undo | yes |
| A random-sequence property test | yes, these find the most |
| A specific endpoint's response shape | no — that is a contract test |
| An internal function's return value | no — that is a co-located unit test |
| A UI detail | no |

## Structure

```
tests/invariants/
├── capacity/
│   ├── CAP-1.test.ts
│   └── CAP-2.test.ts
└── ordering/
    └── ORD-1.test.ts
```

Prefer property tests over examples. A rule stated as "for any sequence of operations, X holds"
catches what enumerated cases miss, and the domain rules are exactly the kind of thing that
should hold universally.
