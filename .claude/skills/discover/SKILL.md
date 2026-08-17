---
name: discover
description: Orient in this repository before proposing any change. Use at the start of any task that touches a domain area, when asked "how does X work here", or before editing code you have not read in this session. Loads the domain rules, the decisions, and the code map in the right order.
---

# Discover

Orient before you act. Structure is cheap to rediscover. Intent is impossible to rediscover.
So: read the intent, generate the structure, grep for the implementation.

## Do this, in order

**1. Read `CODEMAP.md`.** It lists every app and package. It is generated. Never edit it.

**2. Read every file in `docs/ssot/`.** All of them, not only the one you think is relevant. The
tree is kept small for exactly this reason. This is the domain, and it is not visible in code.

**3. Grep `docs/adr/README.md` for the topic.** Open every ADR that matches. Read the
**Rejected** section of each. It tells you what has already been tried and refused, which stops
you proposing it again.

**4. Read `packages/contracts/` for the shapes you will touch.** The inline comments point to
the SSOT rule or ADR that explains each field.

**5. Only now, grep the code.**

## The triage gate

Before you propose an implementation, answer this out loud:

> Does this change touch an existing invariant, or contradict an ADR?

- **Yes.** Stop. This is a domain change. Tell the human. The SSOT changes first, in its own
  commit, with a new ADR. Code follows.
- **No.** Additive. Continue.

You cannot answer this without step 2. That is why step 2 exists.

## Report back

State these four things before writing code.

1. **Rules that constrain this work** — the rule IDs, `CAP-1`, `ORD-3`.
2. **Decisions that constrain this work** — the ADR numbers, and what each forbids.
3. **Where the code lives** — the files, from the code map plus a grep.
4. **What is not written down** — anything you had to infer. Say so plainly. If it matters, it
   should become an ADR before the work starts, not after.

## What not to do

- Do not start from the code alone. The code says what happens, never why.
- Do not trust a comment over a test. Invariant tests are authoritative.
- Do not resolve a disagreement between the SSOT and the code silently. That is a bug in one of
  them. Stop and report it.
