# Engineering Standards

> **Status:** Active · **Scope:** the whole repository, from day one.

Ground rules that align human developers and AI agents on how code is written, reviewed,
merged, and documented.

**Rule levels:**

1. **GATE vs GUIDELINE.** Only gate what protects production, customer data, deployability,
   contracts, or agent consistency. Taste-based rules are guidelines: documented and reviewed,
   never merge blockers.
2. **Enforce machine-checkable rules in CI and hooks. Document the rest.** A rule that lives
   only in a document is a rule an agent ignores at no cost.

`docs/process/PROCESS.md` covers how work moves from an idea to merged code. This document
covers the rules that apply while you do it.

---

## Quick start — before you open a PR

- [ ] The branch is named `<name>/<type>/<desc>` and was cut from the integration branch.
- [ ] You self-reviewed the diff. No debug logs, no scope creep, no dead code.
- [ ] `mise run check` is green locally. CI is green on the PR.
- [ ] The PR template is filled, every field.
- [ ] The PR title is a Conventional Commit. It becomes the squash commit.
- [ ] If behavior in a domain area changed, its `docs/ssot/<AREA>.md` changed in this PR.
- [ ] If a decision was made that had more than one defensible answer, an ADR is in this PR.
- [ ] **Agents:** you ran `discover` first, invented no env vars, routes, or contract fields,
      and cited the commands you ran.

## 1. Toolchain

| Standard | Level | Decision |
|---|---:|---|
| Runtime and task manager | **GATE** | `mise`. It pins the runtimes and owns the task list. |
| Canonical command | **GATE** | `mise run check`. Humans, agents, hooks, and CI all run it. Nothing else is authoritative. |
| Package manager | **GATE** | `pnpm` workspaces for TypeScript. `uv` for Python. |
| Git hooks | **GATE** | `lefthook`. A single binary, parallel, and it does not need Node to lint Python. |
| Pre-commit budget | **GATE** | Under 5 seconds. Format and lint staged files only. |
| Pre-push | **GATE** | Documentation gates, typecheck, invariants. |
| CI authority | **GATE** | Hooks are feedback. CI re-runs everything and is the authority. |
| `--no-verify` | **GATE** | Banned. If a hook blocks you, fix the cause. |

A slow pre-commit does not improve quality. It teaches everyone to bypass hooks, after which
nothing is enforced.

## 2. Commits

Conventional Commits are required on the **PR title and squash commit**, not on every local
commit.

| Rule | Level | Decision |
|---|---:|---|
| Format | **GATE** | `type(scope): subject` |
| Types | **GATE** | `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`, `build`, `ci`, `perf` |
| Enforcement | **GATE** | `commitlint` validates the PR title |
| AI trailer | Guideline | Set the project convention once, then follow it |

## 3. Branches

| Rule | Level | Decision |
|---|---:|---|
| Naming | **GATE** | `<name>/<type>/<desc>` |
| Flow | **GATE** | feature → integration branch → production branch |
| Protection | **GATE** | Branch protection enforces the flow |

`CONTRIBUTION_POLICY.md` section 1 is the canonical statement, including worktrees.

## 4. Pull requests

| Rule | Level | Decision |
|---|---:|---|
| Shared template | **GATE** | Required. What and why, linked ticket, testing evidence, risk and rollback, docs updated. |
| Review timing | **GATE** | Open anytime. Request review only when done, self-reviewed, CI green. |
| Self-review | **GATE** | Check for debug logs, scope creep, dead code before requesting review. |
| Simplification pass | **GATE** | Re-read your diff after the code works, before requesting review. See section 5. |
| Assumption surfacing | **GATE** | Before a multi-file change, list your assumptions in the ticket or PR. |
| Change summary | **GATE** | End every substantial PR with what changed and an honest list of concerns: fragile areas, missing coverage, unverified assumptions. |
| Quantified impact | **GATE** | State measured effects. "Adds ~200ms", not "might be slower". |
| PR size | Guideline | Target about 400 changed lines. |
| Merge strategy | **GATE** | Squash merge only. |

A known limitation reported openly beats a hidden one found in production.

## 5. Layout and code principles

| Area | Convention |
|---|---|
| Deployable things | `apps/<name>/` |
| Shared libraries | `packages/<name>/` |
| Shared schemas | `packages/contracts/` — Zod, the one hand-written source |
| Domain rules as tests | `tests/invariants/` |
| Unit tests | co-located with the code |

**There is no top-level source directory outside `apps/` and `packages/`.** An app's internal
structure is its own business; `src/modules/<feature>/` is a reasonable default inside a server.

Do not add another top-level source root without an ADR.

### Code principles

| Principle | What it means here |
|---|---|
| DRY | Extract shared logic at the third occurrence. Two is a coincidence. |
| KISS | The boring, obvious solution wins. |
| YAGNI | Build only what the ticket asks for. |
| SOLID | Apply it at module boundaries, not to every class. |

**Readability.** Do not write deep spread pyramids or nested ternary pyramids. Build objects
from the bottom up with named intermediate variables. A reader must see each step.

**Dead-code hygiene.** Remove unused imports and variables freely. For an unused function,
class, or file: list it and ask before you delete it. It may have a caller you did not find.

**Simplification pass.** After the code works, and before you request review, read the diff
again. This pass looks for quality, not bugs. Ask four questions.

1. Can an existing helper do this? Use it.
2. Is any abstraction unnecessary? Remove it.
3. Can this collapse into a simpler equivalent? Collapse it.
4. Does the change sit at the right layer? Move it if not.

## 6. Documentation

The full model is in `docs/process/DOCUMENT_TYPES.md`. The rules that gate a PR:

| Rule | Level | Standard |
|---|---:|---|
| ASD-STE100 | **GATE** | Write every document in Simplified Technical English. Rules below. |
| SSOT with behavior | **GATE** | A behavior change in a domain area updates its SSOT in the same PR. CI checks this. |
| Rule needs a test | **GATE** | Every SSOT rule has an invariant test citing its ID. CI checks this. |
| ADR for decisions | **GATE** | A decision with more than one defensible answer gets an ADR. |
| Generated files | **GATE** | Never hand-edit `CODEMAP.md` or generated OpenAPI. CI checks for drift. |
| No prose about code | **GATE** | Never write a document that describes what the code does. Generate it, or drop it. |
| TSDoc on critical functions | **GATE** | See below. |
| TODO / FIXME | **GATE** | Must link a ticket. |

### TSDoc on critical functions

A **critical function** is an exported or public API, a shared utility, a core service, or any
function on a money, auth, data-mutation, or external-integration path.

Each states four things:

| Item | Tag | What to write |
|---|---|---|
| Functionality | summary | What it does, in one or two sentences. |
| Inputs | `@param` | What each parameter means and what constrains it. Range, units, format, and what the caller must guarantee. |
| Output | `@returns` | What the value means. What empty, zero, or null means. |
| Failure modes | `@throws` | Which errors, and the condition that causes each. |

**Do not restate the TypeScript types.** The type states the shape. The TSDoc states meaning,
invariants, and failure modes. "`@param userId` — the user ID" adds nothing. "`@param userId` —
the ID of an active user; the caller must confirm the user exists" adds the constraint.

Write it in the same PR as the function. Never as a follow-up.

### ASD-STE100

- Keep sentences to about 20 words.
- Give one instruction per sentence.
- Use the active voice.
- Give one meaning to each word. Use the same term for the same thing every time.
- Remove filler. Cut "basically", "simply", "of course", "note that".
- Start each instruction with the verb.

Applies to prose. Not to code samples, command output, or quoted text.

### Inline comments

Narrate the flow only for genuinely non-obvious blocks: algorithms, multi-step orchestration,
sensitive data flows, provider edge cases. Everywhere else, comments explain **why**, state
invariants, or name an external constraint. Never restate an obvious line.

The audience includes AI reviewers. A comment that points to an SSOT rule or an ADR preserves
context an agent would otherwise infer incorrectly.

## 7. Testing

**Three kinds of test, with different rules. Do not confuse them.**

| Kind | Location | Written | Editable by the implementer |
|---|---|---|---|
| **Domain invariants** | `tests/invariants/` | before the ticket, from the SSOT | **No.** CI blocks it. |
| **Contract tests** | with the contracts | before the ticket, from the trace | **No.** CI blocks it. |
| **Unit tests** | co-located | during implementation | Yes. Disposable scaffolding. |

An agent that can edit the test judging its work will edit that test. Separating these is what
makes AI-written code safe at volume.

**Invariants are append-only.** Add freely. Strengthen freely. Weakening or deleting one needs a
human, an ADR, and the `invariant-change` label.

**Every production bug becomes a new invariant**, not a unit test. This is how the suite
accumulates domain knowledge nobody could have written on day one.

**Bug-fix protocol.** A reported bug first gets a test that reproduces it. The test must fail
against the current code. The fix is proven when it passes.

**What to assert.** Assert on effects and flows: a record was written, a state changed, a
message was sent. Never assert on incidental internals such as call counts or private helpers.
A test that cannot fail in production has no value.

**Required tiers per ticket:** compliant (the happy path), edge case (boundaries, empty inputs,
limits), adversarial (auth bypass, data isolation, stale state).

Prefer property tests for invariants. "For any sequence of operations, X holds" catches what
enumerated cases miss.

| Trigger | Suite | Level |
|---|---|---:|
| Every PR | Documentation gates, lint, typecheck, unit, integration, invariants | **GATE** |
| Merge to the integration branch, and daily | Full E2E against staging, real services | **GATE** |
| Always | A misbehaving production flow becomes a new test | **GATE** |

## 8. Lint baseline and suppression

- **ERROR tier** — near-zero false positives: promise correctness (`no-floating-promises`,
  `no-misused-promises`, `await-thenable`), dead code (`no-unused-vars`, `no-unreachable`),
  correctness (`eqeqeq`, `no-constant-binary-expression`), security (`no-script-url`).
- **WARN tier** — visible, not blocking: `no-explicit-any`, the `no-unsafe-*` family, complexity
  thresholds, deprecation.
- **OFF tier** — taste rules already covered by the formatter.

| Suppression | Standard |
|---|---|
| Inline disable | Must state a reason: `// eslint-disable-next-line rule -- <why>` |
| Rule off in config | Needs a PR comment and reviewer sign-off |
| Blanket justification | "Too strict" with no concrete reason is rejected |

## 9. AI agent operating rules

| Rule | Level |
|---|---:|
| Read `AGENTS.md` first. Run `discover` before touching a domain. | **GATE** |
| Never edit `tests/invariants/` alongside application code | **GATE** |
| Never hand-edit a generated file | **GATE** |
| Never use `--no-verify` | **GATE** |
| Never invent env vars, routes, contract fields, tables, or columns. Verify, or ask. | **GATE** |
| Stay in scope. No unrequested refactors. | Guideline |
| Ground data work in real data. Never infer a format or business rule from a spec alone. | Guideline |
| Verify the environment before debugging infrastructure. Check what runs, the ports, the config. | Guideline |
| Cite the verification commands you ran | Guideline |
| Surface blockers instead of shipping a workaround | Guideline |

## 10. Data isolation

**Decide the tenancy model before the first migration.** See `docs/process/NEW_PROJECT.md`.

If the system is multi-tenant: request-scoped database access on tenant routes, row-level
security respected, isolation regression tests required. A cross-tenant leak outranks every
style issue.

## 11. Environment and secrets

| Rule | Level | Decision |
|---|---:|---|
| `.env.example` | **GATE** | Kept current when env vars change |
| Secret commits | **GATE** | Never |
| Local credentials | **GATE** | No production credentials on a developer machine |
| Agent credentials | **GATE** | Agent environments get non-production roles only. Deploys run through CI. |
| Ownership and rotation | **GATE** | Name the owner and rotation expectation per secret class |

An agent with production credentials will eventually run a destructive command. Scope the
credential; do not rely on the instruction.

## 12. Database migrations

| Rule | Level | Decision |
|---|---:|---|
| New table | **GATE** | The last option. Reuse an existing structure first. |
| Molten period | Guideline | Before the first production data, migrations may reset and re-seed. State the end date. |
| Compatibility | **GATE** | Expand-contract after launch. Never destructive in one step. |
| Staging first | **GATE** | Apply and validate on a branch or staging before production |
| Rollback | **GATE** | Every migration has an explicit rollback expectation |
| Destructive changes | **GATE** | Explicit human approval |
| Review | **GATE** | Reviewed as part of the change, never a follow-up |

Pre-launch, schema change is nearly free. Say so, and set the date it stops being free.

## 13. Dependencies

New dependencies need justification in the PR. Prefer what the repo already uses. Check
maintenance health and security posture. Explain why it beats a local helper.

## 14. Exceptions

Break process for incidents, document after. A hotfix may bypass gates when the process itself
would increase production risk. The owner is notified, and the bypass is documented afterward
with the missing checks, the risk accepted, and the follow-up.

## 15. Versioning and releases

| Rule | Level | Decision |
|---|---:|---|
| Scheme | **GATE** | SemVer. Start at `1.0.0` at go-live. |
| Bump | **GATE** | Computed from Conventional Commits since the last tag. Never hand-picked. |
| Release tag | **GATE** | Every promotion to the production branch is a tagged release with a changelog entry |
| Runtime visibility | Guideline | Expose the version in the health endpoint and startup logs |

A breaking change means a change to API routes, request or response shapes, webhook contracts,
or anything a client or integration consumes.
