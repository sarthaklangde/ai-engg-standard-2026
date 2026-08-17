# Specs

**Death rule: scaffolding. Frozen at merge. Never updated afterward.**

One folder per feature. Everything in it is written to be thrown away.

```
specs/<feature>/
├── DECISIONS.md      the interrogation — drained at DECIDE, never read again
├── TRACE.md          the fake session log — the review surface
├── PRD.md            optional; only for features large enough to need one
└── tickets/          one file per ticket, with machine-checked frontmatter
```

## Rules

1. **Nothing here is updated after merge.** Stamp `status: shipped` and stop. If you want to
   update a shipped spec, the content belongs in `docs/ssot/` or `docs/adr/`. Put it there.
2. **`TRACE.md` is the artifact that matters.** An agent drafts it in two minutes. A human
   reviews it line by line for ten. Approving a trace you did not read carefully collapses the
   whole process.
3. **`DECISIONS.md` is drained, not maintained.** Its content moves into ADRs at the DECIDE
   stage. Nobody reads it again. That is success.
4. **Tickets need resolvable frontmatter.** `tooling/checks/ticket-frontmatter.mjs` verifies
   every invariant ID and ADR number exists.
5. Name the folder after the feature, in kebab case. `ticketing-v1`, `refunds`.

## Why these are not maintained

A shipped spec describes what you intended at one moment. The code describes what is true now.
Maintaining both means two sources for the same fact, and the prose loses every time.

The value was in writing it, and in the ten minutes you spent reviewing the trace. It is a
historical record afterward. Nobody reads it. That is fine.

Copy `_template/` to start.
