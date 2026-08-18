---
domain: Observability
prefix: OBS
status: draft
---

# SSOT — Observability

Decisions: [ADR-0001](../adr/0001-error-routing-follows-throw-versus-return.md)
Executable form: `tests/invariants/observability/`

> Ships as `status: draft`. Set it to `active` when you write the first `OBS` test.

## Model

Three signals, one decision.

| Signal | What it answers |
|---|---|
| Logs | what happened, in detail, when you already know where to look |
| Domain events | did users get through the flow |
| Exceptions | what is broken and who should fix it |

A developer never chooses a destination. They choose **expected or unexpected**, and routing
follows. See [ADR-0001](../adr/0001-error-routing-follows-throw-versus-return.md).

```
return a typed error   →  expected    →  warn   →  logs
throw                  →  unexpected  →  error  →  logs + exception tracker
```

The error boundary performs the logging and the exception report. A request handler never
imports a logger for failures and never imports an exception SDK.

## The log line

Every log line is one JSON object with these fields. A field is absent or present; it never
changes type.

```json
{
  "ts": "2026-08-18T10:15:00.123Z",
  "level": "error",
  "msg": "order rejected",
  "service": "api",
  "env": "prod",
  "release": "v1.4.2",
  "request_id": "req_01J8XZ4A7N",
  "trace_id": "4bf92f3577b34da6",
  "user_id": "usr_a1b2c3",
  "code": "CAPACITY_EXCEEDED",
  "duration_ms": 42,
  "err": { "type": "CapacityExceeded", "message": "...", "stack": "..." }
}
```

## Levels

| Level | Meaning | Destination |
|---|---|---|
| `error` | We are at fault. A human or an agent must look. | logs + exception tracker |
| `warn` | The caller was wrong, or a dependency degraded. Count it; do not page on one. | logs |
| `info` | A state transition or a completed request. The default. | logs |
| `debug` | Local investigation. Off in production. | logs |

**`error` is a promise that someone should look.** A validation failure is not an error. If
nobody would act on a line, it is not `error`, and it does not reach the exception tracker.

## Rules

- **OBS-1** — Every state transition emits exactly one domain event. Funnels are only
  trustworthy if emission is.
- **OBS-2** — Every log line is a single JSON object and carries `ts`, `level`, `msg`,
  `service`, `env`, and `release`.
- **OBS-3** — `msg` is a constant string. Values go in fields. Never interpolate an identifier
  into the message.
- **OBS-4** — Every request has a request id. It propagates to every downstream call, every log
  line, and every error response.
- **OBS-5** — A failure is logged once, at the boundary. Never log and re-throw.
- **OBS-6** — An expected failure is `warn`. An unexpected failure is `error`. Only `error`
  reaches the exception tracker.
- **OBS-7** — Logs and third-party tools receive pseudonymous identifiers only. No email, no
  name, no phone number, no address, no token.
- **OBS-8** — Log-store index labels are low cardinality: service, env, level, release. An
  identifier is a field in the body, never a label.
- **OBS-9** — An alert payload carries the rule name, severity, request id, trace id, the query
  that produced it, and the current release.

### Why OBS-3 is not a style rule

`msg: "order ord_9k2 rejected"` produces one distinct message per order and cannot be grouped or
counted. `msg: "order rejected"` with `order_id` as a field groups across every occurrence. This
one rule decides whether your logs are queryable or merely searchable.

### Why OBS-8 matters operationally

A high-cardinality index label — a user id, a request id — creates one index stream per distinct
value. This degrades the log store and the bill at the same time, and the damage is retroactive.
Identifiers belong in the JSON body, which stays queryable without being indexed.

## Alerts

Three tiers. The tier decides the route, and the route is not negotiable.

| Tier | Example | Route | Latency |
|---|---|---|---|
| **P1** | a dependency is unreachable; 5xx rate spikes | page a human | instant |
| **P2** | error rate up; p99 latency up; an expected-failure code spikes | team channel | minutes |
| **P3** | funnel conversion drops; a step stops being reached | digest | hours |

**Never page on P3.** Alert fatigue does not degrade gracefully; it fails all at once, and the
P1 page is ignored along with everything else.

An automated consumer needs OBS-9's payload to act without a human translating the alert first.
Without a stable rule name it cannot deduplicate, and it re-investigates a known problem on
every firing.

## Boundaries

- Tool choice is not stated here. These rules hold whichever log store and exception tracker a
  project uses. Record the choice in an ADR with its cost curve, so nobody re-argues it.
- Retention and sampling rates are per project and belong in that ADR.
- A failure inside an asynchronous job is recorded on the job, not in a response nobody awaits.
  The routing rule still applies.
- The mapping from a pseudonymous id to a real person lives in the product database and nowhere
  else. That is what makes a deletion request one statement.
