# What and why

<!-- What changed, and the reason. Two or three sentences. -->

Ticket: <!-- specs/<feature>/tickets/NN-name.md, and the tracker link if you use one -->

## Approach

<!-- The shape of the change. Why this way and not the obvious alternative. -->

## Testing evidence

<!-- Paste real output. "Tests pass" is not evidence. -->

```
$ mise run check
```

## The durable layer

- [ ] Behavior changed in a domain area → its `docs/ssot/<AREA>.md` changed in this PR
- [ ] A decision was made with more than one defensible answer → an ADR is in this PR
- [ ] A new rule needs proving → an invariant test cites its ID
- [ ] Generated files regenerated, not hand-edited
- [ ] The spec folder is frozen if this ships the feature

If you checked none of these, say why in one line: <!-- -->

## Invariants

<!-- Which rule IDs this work had to respect. Which are newly covered. -->

- [ ] This PR does **not** weaken or delete an invariant
- [ ] If it does: an ADR explains it, and the `invariant-change` label is applied

## Risk and rollback

<!-- What could break. How to undo it. Quantify: "adds ~200ms", not "might be slower". -->

## Concerns

<!--
Required. An honest list: fragile areas, missing coverage, assumptions you could not verify.
A known limitation reported openly beats a hidden one found in production.
Write "none" only if you genuinely have none.
-->

## Self-review

- [ ] No debug logs, no scope creep, no dead code
- [ ] Simplification pass done: reuse checked, abstractions removed, right layer
- [ ] TSDoc on every critical function added in this PR
- [ ] Agents: `discover` was run; no invented env vars, routes, or contract fields
