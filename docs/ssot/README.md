# Domain SSOTs

**Death rule: permanent. Kept current. Shrinks over time.**

One file per domain area. The SSOT is the authoritative statement of how that area works.
When the code and the SSOT disagree, one of them is a bug. Resolve it. Never tolerate it.

## Rules

1. **One file per domain area.** Name it `UPPER_SNAKE_CASE.md`. Do not split an area across
   files. Do not merge two areas into one file.
2. **Present tense. No history.** Describe the system as if it always worked this way. No "in
   v2 we added". The moment a document takes a changelog voice it grows forever and stops being
   read. History is git and `specs/`.
3. **Every rule carries an ID.** Declare the prefix in the frontmatter. Number the rules
   `CAP-1`, `CAP-2`, and so on. Never reuse an ID, even after a rule is removed.
4. **Every rule that can be a test must have one.** Mark the test `// @invariant CAP-1`.
   `tooling/checks/ssot-invariant-sync.mjs` fails the build if a rule has no test, or a test
   cites a rule that does not exist.
5. **Keep it short.** Target 60 lines. Six domains at 60 lines each means an agent reads the
   whole tree every session for almost nothing. A 2,000-line tree does not get read. This is a
   context budget rule, not a style preference.
6. **It shrinks.** As rules become tests, the prose thins. Keep the rules that cannot be tests —
   scope boundaries, business policy, external authority. Those are why the file exists.
7. **Update it in the same PR as the behavior change.** A PR that changes how an area works and
   leaves its SSOT stale is incomplete.
8. **Changing a rule needs a human and an ADR.** Adding one does not.
9. **Write it in ASD-STE100.** Short sentences. Active voice. One instruction per sentence.

## Frontmatter

```yaml
---
domain: Capacity       # human name of the area
prefix: CAP            # rule ID prefix, unique across all SSOTs
status: active         # active | draft
---
```

## Rule format

The check script matches this exact shape. Keep it.

```markdown
- **CAP-1** — Available capacity is never negative. The system refuses an order that would make
  it negative.
```

## What goes here, and what does not

| Content | Here? |
|---|---|
| A rule that must always hold | yes, with an ID and a test |
| A scope boundary — what the system does not do | yes, no test possible |
| Who is authoritative for external data | yes |
| The reasoning behind the rule | no — that is an ADR, link to it |
| A list of endpoints or fields | no — that is derivable, generate it |
| A history of how the area changed | no — that is git |
| An implementation detail | no |

Start `TEMPLATE.md` when you write your first one, then delete the template.
