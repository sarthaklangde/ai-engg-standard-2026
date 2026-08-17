# Contribution Policy

**Status:** Active · **Scope:** the whole repository, from day one.

The single policy for branches, tickets, pull requests, and releases. Engineering rules for
code, tests, and documentation are in [ENGINEERING_STANDARDS.md](./ENGINEERING_STANDARDS.md).
How work moves from an idea to merged code is in [../process/PROCESS.md](../process/PROCESS.md).

Replace `<OWNER>` with the person who approves production releases when you adopt this.

Write every document in ASD-STE100 Simplified Technical English.

## 1. Branches

**This section is canonical. Other documents point here.**

### The two branches

- `dev` receives all work. Every pull request targets `dev`. `dev` deploys to staging.
- `main` is production. It changes only through the release gates. Nobody pushes to it directly.
- No other long-lived branches exist. Keep it that way.

A single-branch trunk model is a valid alternative for a solo project. Choose one, write it
here, and do not run both.

### Your branches

1. Cut fresh from `dev`: `git checkout dev && git pull && git checkout -b name/feature/short`.
2. Name it `name/type/short`. Types: `feature`, `fix`, `chore`.
3. Keep it small and short-lived. Days, not weeks.
4. Rebase on `dev` when the branch gets old. An old branch hides regressions.
5. Do not keep a personal long-lived branch. The answer is config, a flag, or smaller PRs.

### Worktrees

Check a branch out as a worktree to work on several in parallel. Create it from `dev`. The
naming and branch rules do not change. Remove the worktree after the merge.

**Cap parallel work at three tickets.** The bottleneck is human review, not agent capacity.
Four queued PRs from one reviewer is a queue, not throughput.

**Only one in-flight ticket may touch `packages/contracts/`.** Two agents adding subtly
different versions of the same schema produce a semantic merge conflict, which is far worse than
a textual one.

### After the merge

1. Delete the remote branch. Turn on the repository setting that does this automatically.
2. Delete the local branch.
3. Remove the worktree: `git worktree remove <path>`, then `git worktree prune`.

### What the host enforces

- No direct pushes and no force-pushes to `main` or `dev`.
- Every pull request needs one approval and green CI.
- Head branches deleted automatically after merge.

## 2. Releases and release gates

Releases are event-driven. Ship when the work is ready.

1. Pull requests merge into `dev` continuously, after review.
2. `<OWNER>` decides when to cut a release.
3. Check the gates at that moment.
4. All green: merge `dev` into `main`, tag the release, deploy production from the tag.

The gates:

- The full test suite is green, including invariants.
- `mise run check` is green on `dev`.
- Additional gates apply once their layers exist.

If a gate is red, fix it, or get a one-line written waiver from `<OWNER>`. No silent exceptions.

## 3. The tests went red

**Canonical statement of the freeze rules.**

1. Decide first: our bug, or an outside system down? Staging and vendors are outside systems.
2. Our bug: freeze `dev`. Merge only fixes or reverts until green. The author of the breakage
   fixes it. A revert is always acceptable.
3. Outside system: record it as blocked, with an owner and an expiry date. Do not freeze. Never
   disable a test silently.
4. You cannot tell after one hour: revert the suspect merge.

## 4. Production is broken

1. Cut an emergency branch from `main`.
2. Get one approval. Run the targeted tests.
3. Deploy.
4. Merge the fix back into `dev` the same day. Mandatory. A fix that stays only on `main` is
   lost at the next release.

## 5. Every task starts with a ticket

- The ticket is the spec. It states what you will build and how it will be proven.
- Its frontmatter names the invariants and ADRs that constrain it. CI checks that they resolve.
- The ticket stays alive. When you discover something during the work, update the ticket.
- The ticket lives in `specs/<feature>/tickets/`. Mirror it to your tracker if you use one.

## 6. Pick the tier

- **Trivial** — a small fix, a dependency bump, a config tweak. State the problem, the expected
  result, and the evidence. The PR review covers it.
- **Standard** — normal feature work. State the flow, the scenarios, the edge cases, what is out
  of scope, and the done checklist. Write scenarios as given, when, then.
- **High-risk** — auth, payments, migrations, core business records, external integrations, or
  anything that changes an invariant. All standard content, plus what can go wrong and how to
  roll it back.

If you are unsure of the tier, pick the higher one.

## 7. Write scenarios people can follow

1. Write behavior, not implementation.
2. Cover the unhappy paths: failure, cancel, retry, bad input.
3. The scenarios become the tests, the QA steps, and the reviewer checklist. Write once, use
   three times.

## 8. Opening a pull request

1. Target `dev`.
2. Link the ticket.
3. Fill the template. State what changed. Paste the evidence.
4. If the work changed the design, update the ticket first, then record the drift.
5. Keep pull requests small. Several small ones beat one large one.
6. Ask one other person for review.

## 9. Reviewing a pull request

1. Read the diff. Post only findings that need action.
2. Check with your own eyes. Does it do what the ticket says? Do the scenarios pass? Did
   anything unrelated get in?
3. Check the durable layer: did a decision get made without an ADR? Did behavior change in a
   domain without its SSOT moving?
4. Approve when every finding is closed.

**A question you had to ask is a fact that was not written down.** Say so in the review. It
belongs in an ADR or an SSOT, and the harvest step should catch it.

## 10. When is it done

- [ ] Every scenario in the ticket passes.
- [ ] `mise run check` is green on the branch.
- [ ] The ticket shows what you actually built.
- [ ] A second person approved.
- [ ] The harvest ran: SSOT and ADRs updated, spec frozen, generated files regenerated.

A ticket is not approvable when its done checklist is vague.

## 11. Templates

The templates live in `.github/`. The forms are the enforcement: the host blocks empty required
fields.

## 12. Intake

- The product owner supplies user stories.
- A developer runs the `spec` skill against them: interrogate, then trace.
- The human reviews the trace line by line. This is the design approval.
- `ticketize` splits the approved trace into tickets.

**Do not write a PRD for a whole product before the first trace.** A trace plus one probe gives
a better specification, and costs less.

Write each user story as one page: actor, goal, trigger, success, out of scope, priority.

## 13. Deployment

Deploy demos and production from a tagged artifact only. Never from a branch.
