# Agent Instructions

Read this file first. Read all of it. It is the only entry point.

## 1. Orient before you act

Do these four steps before you propose any change.

1. Read `CODEMAP.md`. It lists every app and package. It is generated. Never edit it by hand.
2. Read every file in `docs/ssot/`. The tree is small on purpose. Read all of it, every session.
3. Grep `docs/adr/README.md` for your topic. Open the ADRs that match.
4. Read `docs/process/PROCESS.md` if you do not know this workflow.

Do not start work from the code alone. The code states what happens. It does not state why.

## 2. What is authoritative

| Question | Authority |
|---|---|
| What are the domain rules? | `docs/ssot/<AREA>.md` |
| Are these rules enforced? | `tests/invariants/` — the tests, not the prose, are binding |
| Why is it built this way? | `docs/adr/` |
| What shape does this API take? | `packages/contracts/` — Zod schemas |
| Where does the code live? | `CODEMAP.md` |
| How do we work here? | `docs/process/PROCESS.md` |
| What are the code rules? | `docs/engineering-standards/ENGINEERING_STANDARDS.md` |
| How do branches and PRs work? | `docs/engineering-standards/CONTRIBUTION_POLICY.md` |

When two sources disagree, that is a bug. Stop and report it. Do not choose one silently.

## 3. The triage gate

Run this gate before you write code for any feature. It takes two minutes.

Ask: **does this change touch an existing invariant, or contradict an ADR?**

- **Yes.** This is a domain change. Stop. Tell the human. The SSOT changes first, in its own commit, with a new ADR. Code follows after.
- **No.** This is additive. Continue.

You cannot answer this gate without reading the SSOT. That is the point of the gate.

## 4. The workflow

```
SPEC     interrogate the human, write DECISIONS.md and TRACE.md
PROBE    only for questions you cannot answer by thinking
DECIDE   write the ADRs
STATE    write or extend docs/ssot/<AREA>.md, numbered rules
PROVE    write failing invariant tests, one per numbered rule
SHAPE    write the Zod contracts in packages/contracts/
SPLIT    write tickets, each with invariants and adrs frontmatter
BUILD    implement until the tests pass
HARVEST  drain the scaffolding into SSOT and ADRs, freeze the spec
```

Stages `SPEC` through `SHAPE` produce no application code. That is intended.

Skills exist for `spec`, `probe`, `ticketize`, `harvest`, and `discover`. Use them.

## 5. Documents: who writes them, when they die

| Document | You write it | It dies |
|---|---|---|
| `specs/<feature>/TRACE.md` | at SPEC, human reviews line by line | frozen at merge, never updated |
| `specs/<feature>/DECISIONS.md` | at SPEC | drained at DECIDE, never read again |
| `probe-*.mjs` | at PROBE | deleted the same day, never committed |
| `docs/adr/NNNN-*.md` | at DECIDE, human approves | never — append only, never edited |
| `docs/ssot/<AREA>.md` | at STATE, human approves | never — kept current, kept short |
| `tests/invariants/*` | at PROVE | never — append only |
| `packages/contracts/*` | at SHAPE | evolves with the product |
| `CODEMAP.md`, OpenAPI | a script | regenerated |

Full rules: `docs/process/DOCUMENT_TYPES.md`.

## 6. Hard rules

Never do these.

- Never write prose that describes what the code does. Generate it, or do not have it.
- Never hand-edit a generated file. `CODEMAP.md` and the OpenAPI output are generated.
- Never define the same schema twice. Zod is the source. Everything else is generated from it.
- Never weaken or delete an invariant test. Invariants are append-only. Strengthening is allowed.
- Never change `packages/contracts/` and application code in the same ticket without saying so.
- Never use `git commit --no-verify`. If a hook blocks you, fix the cause.
- Never invent an env var, route, table, column, or contract field. Verify it, or ask.
- Never leave a problem as "pre-existing".

## 7. Reporting

- State your assumptions before a multi-file change. Put them in the ticket or the PR.
- End every substantial change with what changed, and an honest list of concerns.
- Quantify effects. Write "adds ~200ms", not "might be slower".
- Report failures plainly. A known limitation stated openly beats a hidden one found in production.

## 8. Verification

One command runs everything. Humans, agents, hooks, and CI all use it.

```
mise run check          # changed packages only
mise run check --all    # everything
```

Cite the commands you ran in the PR.

## 9. Writing standard

Write every document in ASD-STE100 Simplified Technical English.

- Keep sentences to about 20 words.
- Give one instruction per sentence.
- Use the active voice.
- Give one meaning to each word. Use the same term for the same thing every time.
- Remove filler. Cut "basically", "simply", "of course", and "note that".
- Start each instruction with the verb.

This applies to prose. It does not apply to code, command output, or quoted text.

## 10. Behavior

| Protocol | What you do |
|---|---|
| Wall | If the only path forward is a hack, stop. Name the real blocker. Propose the proper fix. |
| Push-back | If an approach has clear problems, state the concrete downsides and propose an alternative. Accept an override. |
| Confusion | Stop. Name the confusion. Present the tradeoff. Wait. |

Priority order when these conflict: correctness, quality, clarity, maintainability, simplicity, honesty over appearing complete.
