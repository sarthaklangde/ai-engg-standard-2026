# ADR-0001: Error routing follows throw versus return

Date: 2026-08-18
Status: accepted

## Decision

A developer classifies a failure as expected or unexpected. Nothing else.

- An **expected** failure returns a typed error. It is logged at `warn` and goes to the log
  store only.
- An **unexpected** failure throws. The boundary logs it at `error` and reports it to the
  exception tracker.

The error boundary performs both. A request handler never imports a logger for failures and
never imports an exception-tracker SDK.

## Why

A developer who must choose a destination will choose inconsistently, and the choice arrives at
the worst moment — while writing the failure path, when attention is already on the happy path.
Two people then make opposite choices for the same class of failure, and the exception tracker
fills with validation errors until nobody reads it.

Expected and unexpected is a distinction the developer must make anyway: it decides the status
code and whether the caller can act on the result. Routing is derived from it at no extra
cognitive cost.

The rule also makes `error` level mean something. It becomes a promise that a human or an agent
should look, which is what makes alerting on it possible at all.

## Rejected

- **Route by severity, chosen per call site.** Every call site becomes a judgement, and the two
  stores diverge within weeks.
- **Send everything to both.** The exception tracker fills with expected failures, its bill
  tracks total traffic rather than defect count, and its grouping becomes useless.
- **Log only, no exception tracker.** A log store holds a stream, not entities with state. It
  cannot say whether a failure is new or already fixed, and it cannot symbolicate a minified
  client stack trace.

## Consequences

- The typed-error path must exist before the first handler. Retrofitting it means revisiting
  every failure site.
- A spike in one expected-failure code is a real signal that no exception tracker will show. It
  is detected by a query over the log store, at P2.
- `4xx` responses never reach the exception tracker. Anyone looking for them there will not find
  them, so the log query belongs in the runbook.
