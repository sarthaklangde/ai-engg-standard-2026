---
domain: API Errors
prefix: ERR
status: draft
---

# SSOT — API Errors

Decisions: ADR-NNNN
Executable form: `tests/invariants/api-errors/`

> Ships as `status: draft`. Set it to `active` when you write the first `ERR` test.

## Why this is frozen on day one

Every service invents its own error shape unless one is decided first. Then every client writes
a different branch to unwrap it, and the fifth consumer discovers that three endpoints return
`{error: "..."}`, two return `{message: "..."}`, and one returns a bare string with a 200.

Deciding the envelope costs an hour now. Retrofitting it costs every client, forever.

## Model

Every failure returns the same envelope. It follows RFC 9457 Problem Details, plus three
extensions this standard requires: `code`, `requestId`, and `errors`.

```json
{
  "type": "https://api.example.com/errors/insufficient-capacity",
  "title": "Insufficient capacity",
  "status": 409,
  "detail": "Only 1 seat remains for this ticket type.",
  "instance": "/api/orders",
  "code": "CAPACITY_EXCEEDED",
  "requestId": "req_01J8XZ4A7N",
  "errors": [
    { "field": "quantity", "code": "MAX_EXCEEDED", "detail": "Requested 2, 1 available." }
  ]
}
```

| Field | Purpose |
|---|---|
| `code` | **The contract.** Stable, machine-readable. Clients switch on this. |
| `detail` | For humans. May change at any time. Never parsed. |
| `requestId` | The join key to logs, traces, and support conversations. |
| `errors` | Field-level failures. Present on validation errors, absent otherwise. |
| `type`, `title`, `status`, `instance` | RFC 9457. `type` is a stable URI, not a link that must resolve. |

## Rules

- **ERR-1** — Every failure response uses this envelope. No endpoint invents its own shape.
- **ERR-2** — Every response carries a request id, on success and on failure. It appears in the
  body on errors and in a response header always.
- **ERR-3** — An error code is append-only. A code is never removed, renamed, or repurposed.
- **ERR-4** — A client switches on `code`, never on `detail`. Changing `detail` is not a
  breaking change. Changing `code` is.
- **ERR-5** — A validation failure lists every invalid field, not only the first.
- **ERR-6** — An error response never contains a stack trace, a query, an internal identifier,
  or a value the caller is not authorised to see.
- **ERR-7** — The status code states fault. `4xx` means the caller is wrong. `5xx` means we are.
  The system never returns `200` with a failure body.
- **ERR-8** — A `5xx` is logged with the request id at error level. A `4xx` is not, unless it
  indicates an attack.

## Status codes

Fix the list. An endpoint uses one of these or has an ADR explaining why not.

| Status | Meaning | `code` example |
|---|---|---|
| 400 | Malformed request | `MALFORMED_BODY` |
| 401 | Not authenticated | `UNAUTHENTICATED` |
| 403 | Authenticated, not permitted | `FORBIDDEN` |
| 404 | Does not exist, or the caller may not know it does | `NOT_FOUND` |
| 409 | Conflicts with current state | `CAPACITY_EXCEEDED`, `ALREADY_CANCELLED` |
| 410 | Existed, now permanently gone | `HOLD_EXPIRED` |
| 422 | Well-formed, semantically invalid | `VALIDATION_FAILED` |
| 429 | Rate limited. Include `Retry-After`. | `RATE_LIMITED` |
| 500 | Our bug | `INTERNAL_ERROR` |
| 503 | A dependency is unavailable. Include `Retry-After`. | `DEPENDENCY_UNAVAILABLE` |

**404 versus 403 is a decision, not a detail.** Returning 403 for a resource the caller may not
see confirms it exists. Choose one policy per resource type and write it in an ADR.

## Boundaries

- The error catalogue is generated from the code, never hand-maintained. It is derivable.
- Retry policy belongs to the client. The server states whether an error is retryable through
  the status code and `Retry-After`, and says nothing more.
- This envelope covers synchronous HTTP. Failures inside async jobs are a different contract —
  they land in the job's own record, not in a response nobody is waiting for.
