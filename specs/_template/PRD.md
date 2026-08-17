# PRD — <feature>

Status: draft | approved | shipped
Frozen: <date, once shipped>

Optional. Write one only when a feature is large enough that the trace alone does not convey
the intent. Most features do not need one.

**Frozen at merge. Never updated.**

---

## Problem

Who has this problem, and what does it cost them today. Two paragraphs.

## Scope

### In

- <thing>

### Out

- <thing, and one line on why it is out>

Explicit exclusions are more valuable than inclusions. They stop scope creep later, and they
tell the next reader that you considered the thing and said no.

## Success

How you will know this worked. State something measurable, or state that it is qualitative and
say who judges it.

## Flows

Point to `TRACE.md`. Do not restate the flows here — one source per fact.

## Risks

What could make this the wrong thing to build. What you are unsure about. What you assumed.

## Domain areas touched

| Area | New or existing | Invariants affected |
|---|---|---|
| `AVAILABILITY` | existing | AV-1, AV-2 |
