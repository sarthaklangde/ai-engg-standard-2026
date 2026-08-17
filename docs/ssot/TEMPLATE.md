---
domain: Area Name
prefix: XX
status: draft
---

# SSOT — Area Name

Decisions: ADR-NNNN, ADR-NNNN
Executable form: `tests/invariants/<area>/`

## Model

Define the nouns and how they relate. Define any unit, boundary, or interval convention that a
reader could otherwise get wrong. Keep it to a few short paragraphs.

State the things that cause bugs when left implicit: which end of a range is exclusive, which
timezone a date belongs to, whether a count is total or remaining.

## Rules

Number every rule. Each one gets a test unless it cannot have one.

- **XX-1** — State the rule in the present tense. One rule per bullet.
- **XX-2** — State what the system refuses, not only what it allows.
- **XX-3** — State what happens on the reversal path: cancel, undo, expire.

## Boundaries

What this area does not do. Who is authoritative for anything this area does not own. These
rules usually cannot be tests, and they are the main reason this file exists.
