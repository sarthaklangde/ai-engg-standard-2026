# Architecture Decision Records

**Death rule: permanent. Append-only. A merged ADR is never edited.**

One decision per file. About 20 lines. If it takes more than three minutes to write, it will not
get written, and the decision will be lost.

## Rules

1. **Never edit a merged ADR.** To change a decision, write a new one. Set the old one's status
   to `superseded by ADR-NNNN` and change nothing else. History stays readable.
2. **The Rejected section is required.** It is the load-bearing part. It stops someone in six
   months from "fixing" the decision and re-litigating it. An ADR without rejected options is
   half an ADR.
3. **Write one whenever you answered a question that had more than one defensible answer.**
   If the answer was obvious, skip it.
4. An agent drafts it. A human approves it. It is one of two documents where your judgment gets
   recorded — the other is the SSOT.
5. Number sequentially. Never reuse a number. Never renumber.
6. Add a line to the index below in the same PR.

## When to write one

| Situation | ADR? |
|---|---|
| You picked one of several defensible designs | yes |
| A probe told you something surprising | yes |
| You decided a business rule, not a technical one | yes |
| You deliberately excluded something from scope | yes |
| You changed an existing invariant | yes, always |
| There was only one reasonable option | no |
| It is visible in the code | no |

## Index

One line per ADR. Newest at the bottom. Grep this before proposing anything.

| ID | Title | Status |
|---|---|---|
| — | none yet | — |

<!-- 0001 | Example title | accepted -->
