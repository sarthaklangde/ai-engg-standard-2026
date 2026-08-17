---
name: harvest
description: Drain a finished feature's scaffolding into the durable layer before merge. Use when a feature is complete, when asked to update the docs after shipping, or at the end of a PR. Proposes SSOT and ADR changes, freezes the spec, and regenerates derived files.
---

# Harvest

At merge, nobody "updates the docs". You run one distillation pass with one question:

> **What did we learn building this that is not visible in the code, and still true next year?**

That, and only that, moves into the durable layer. Everything else dies.

## 1. Find what is durable

Read the whole diff, the ticket notes, the probe results, and any review comments. Look for:

- a rule that must always hold, which no invariant covers yet → **new SSOT rule + test**
- a decision made mid-implementation that had more than one defensible answer → **new ADR**
- a scope boundary discovered during the work → **SSOT Boundaries section**
- a surprise about an external provider → **`docs/integrations/<PROVIDER>.md`**
- a bug found and fixed → **new invariant, not a unit test**

Look hardest at what a *reviewer questioned*. A question a human had to ask is a fact that was
not written down.

## 2. Propose, do not apply

Show the human the exact diffs. These two documents are where their judgment is recorded — an
agent drafts, a human approves.

```
docs/ssot/AVAILABILITY.md   + AV-8 — a manager block cancels overlapping holds
docs/adr/0016-holds-are-rows.md   new — holds are rows, not a cache TTL,
                                  because the manager calendar must display them
```

Write the SSOT edit in the house style: present tense, no history, numbered, about 20 words per
rule. Write the ADR with a real **Rejected** section.

## 3. Freeze the scaffolding

```
specs/<feature>/PRD.md      status: shipped
specs/<feature>/TRACE.md    status: shipped
specs/<feature>/DECISIONS.md  status: drained
```

**Never update a shipped spec afterward.** If content still feels live, it belongs in an SSOT or
an ADR. Move it there instead.

## 4. Regenerate, never hand-write

```
mise run codemap
mise run contracts     # if packages/contracts changed
```

Do not write prose listing new endpoints, new fields, or new tables. All derivable. Generating
it is the only version that stays true.

## 5. Verify

```
mise run check
```

Every new SSOT rule must have a test, or `ssot-invariant-sync` fails. That is the check working.

## Ask before you finish

- Is there a rule here that is only in someone's head?
- Did we make a decision that will look arbitrary in six months without its reason?
- Did the SSOT grow? If so, is any of the growth derivable, and should it be generated instead?
- Can any prose rule now become a test? Move it and thin the prose. **The SSOT should shrink as
  the system matures.**

## Do not

- Do not write a changelog entry into the SSOT. History is git.
- Do not restate in prose what the code or the contract already says.
- Do not silently edit a merged ADR. Supersede it with a new one.
- Do not skip the harvest because "nothing changed". If nothing is durable, say that explicitly
  and move on — but check first.
