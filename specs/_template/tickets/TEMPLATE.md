---
invariants: [XX-1, XX-2]
adrs: [ADR-0000]
contracts: none
---

<!--
  FRONTMATTER IS THE TRIAGE GATE. tooling/checks/ticket-frontmatter.mjs verifies it.

  invariants  Rule IDs from docs/ssot/ that this ticket must not break.
              Every ID must exist. Use [none] only when the ticket touches no
              domain rule at all, which is rare.
  adrs        ADR numbers whose decisions constrain this work. May be empty.
  contracts   none | additive | breaking
              "breaking" needs an ADR and serializes: only one in-flight ticket
              may touch packages/contracts at a time.

  You cannot fill this in without reading the SSOT. That is the point.
-->

# <ticket title>

## Goal

One sentence. What a user or another system can do after this ticket that they could not
before.

## Scope

What this ticket changes. Name the files or modules if you know them.

Out of scope: what a reader might reasonably assume is included, and is not.

## Done when

- [ ] `tests/invariants/<area>/XX-1.test.ts` is green
- [ ] contract tests for `<endpoint>` are green
- [ ] `mise run check` is green
- [ ] docs updated in this PR if behavior in a domain area changed

## Notes

Anything the implementer would otherwise guess. Link the trace section this implements.
