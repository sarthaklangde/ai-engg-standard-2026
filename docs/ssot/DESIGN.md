---
domain: Design System
prefix: DS
status: draft
---

# SSOT — Design System

Decisions: ADR-NNNN
Executable form: `tests/invariants/design/`

> **This file ships as `status: draft`.** A draft carries no test obligation, so the checks skip
> it. Set it to `active` when you write the first `DS` test, and the sync gate starts holding
> you to it. Delete any rule below that does not apply to your product.

## Why design belongs in an SSOT

Design has the same three layers as any other domain. The tokens are the contract, the rules
below are the invariants, and the reasoning is in ADRs.

Most of these rules are machine-checkable, which matters because they are the rules that decay
fastest when an agent writes UI. A model reaches for `#3B82F6` because it looks right, and three
sprints later you have forty blues and no way to change the brand color.

## Model

A token is a named design value. `packages/tokens/src/tokens.json` is the only place a raw value
is written. Every other form — CSS custom properties, the framework preset, typed constants — is
generated from it.

A primitive is a component with one correct implementation across every app: a button, an input,
a dialog. A pattern is a component whose meaning is specific to one app. Primitives are shared.
Patterns are not.

## Rules

- **DS-1** — No raw color value appears outside the token source. Components reference tokens.
- **DS-2** — Spacing uses steps from the scale. No arbitrary pixel values.
- **DS-3** — Every interactive element has a visible focus state that meets contrast
  requirements.
- **DS-4** — Text and interactive elements meet WCAG AA contrast in every supported theme.
- **DS-5** — Every shared component renders correctly in every supported theme.
- **DS-6** — Every image has alternative text, or is marked decorative.
- **DS-7** — The generated token output matches the token source. CI fails on drift.

## Boundaries

These rules cannot be tests. They are the reason this file exists rather than only the test
suite.

- Voice and tone belong to the brand guidelines, not to this repository.
- Logo placement, clear space, and permitted variations are stated in the brand guidelines.
  Link them here.
- Which primitive to reach for in an ambiguous case is a judgement call. Ask a designer; do not
  invent a new component.
- A component that exists in only one app stays in that app. Promote it when a second app needs
  the identical thing, not before.
