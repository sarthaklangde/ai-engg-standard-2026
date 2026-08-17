# ai-engg-standard-2026

A starting point for projects where AI writes most of the code and humans own the decisions.

It contains no application code. It contains the process, the enforcement, and the documents
that keep a growing codebase honest when many agents and several people work on it at once.

## The problem it solves

An AI writes a feature in an hour. It cannot know the things you decided and never wrote down.

Take any system that sells a limited number of things — seats, licences, appointment slots.
Somebody decided a checkout hold lasts 10 minutes, because that is how long the payment provider
keeps a session open. Somebody decided partner sales are entered by hand, because the partner
has no webhook.

Neither fact is in the code. An agent reading the code sees *that* holds expire after 10
minutes, so it will change the number when a ticket asks. It sees no partner sync, so it assumes
one is missing and builds it. Multiply that by forty features and four agents, and nobody can
say what is true on purpose and what is true by accident.

Three things follow from that.

1. **Never write prose that describes code.** The code already says it. Generate it or drop it.
2. **Always write down what the code cannot say.** Decisions, rules, and rejected options.
3. **Make the rules executable.** A rule that is only prose is a rule an agent can ignore.

## How to use it

```bash
git clone <this> my-project && cd my-project && rm -rf .git && git init
mise install
```

Then work through `docs/process/NEW_PROJECT.md`. It lists the decisions you must make before
you write code. Skipping it is how projects get tenancy, money, and dates wrong.

## Read in this order

**Start with [`docs/process/ONEPAGER.md`](docs/process/ONEPAGER.md).** Read only that file and
you can work here. Everything below is reference you look up when you need it.

| Order | File | Why |
|---|---|---|
| 1 | `docs/process/ONEPAGER.md` | **Everything, in one read.** The idea, the map, the steps. |
| 2 | `docs/process/PROCESS.md` | The long version, worked through one example end to end |
| 3 | `docs/process/DOCUMENT_TYPES.md` | Lookup table: what goes where, who writes it, when it dies |
| 4 | `docs/process/NEW_PROJECT.md` | Day-one decisions, before any code |
| 5 | `AGENTS.md` | What every agent reads each session |
| 6 | `docs/engineering-standards/` | Code, tests, branches, PRs, releases |

Every example in these documents uses one system that needs no explaining: **an app that sells
tickets to events.** An event has fixed capacity, a buyer holds seats while paying, staff can
cancel an order. That is the whole domain. Substitute your own.

## Layout

```
apps/          deployable things
packages/      shared libraries; packages/contracts holds the Zod schemas
docs/ssot/     the domain rules, numbered, permanent
docs/adr/      decisions and the options you rejected, append-only
docs/process/  how to work here (human-facing)
specs/         per-feature scaffolding, frozen at merge
tests/invariants/  the SSOT rules as running tests
tooling/checks/    the scripts that make the standard binding
.claude/skills/    spec, probe, ticketize, harvest, discover
```

Every folder holds a `README.md` that states its death rule: who writes the files, and when
they stop being maintained. Read it before you add a file there.

## What is actually enforced

Most of this standard is advice. These four checks are not. They run in `mise run check` and
in CI, and they fail the build.

| Check | What it prevents |
|---|---|
| `ssot-invariant-sync` | An SSOT rule with no test, or a test citing a rule that does not exist |
| `ticket-frontmatter` | A ticket that names no invariants, or names ones that do not exist |
| `codemap-drift` | A hand-edited or stale `CODEMAP.md` |
| `ssot-with-behavior` | A PR that changes behavior in a domain and leaves its SSOT stale |

Everything else is a guideline. `docs/engineering-standards/ENGINEERING_STANDARDS.md` marks
each rule **GATE** or **GUIDELINE**. Only gate what protects production, customer data,
deployability, contracts, or agent consistency.

## Toolchain

`mise` pins the runtimes and owns the task list. `lefthook` runs the git hooks, because it is a
single binary and does not need Node for a Python package. `pnpm` for TypeScript workspaces.
Zod is the one source of truth for every schema.
