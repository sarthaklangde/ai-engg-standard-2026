# Contracts

**Death rule: evolves with the product. Changes serialize.**

Zod schemas. That is all a contract is. This package is the one hand-written source of truth for
every shape that crosses a boundary.

```ts
export const Cents = z.number().int().nonnegative()

export const CreateOrderRequest = z.object({
  idempotencyKey: z.uuid(),   // buyers double-submit; see ADR-0009
  holdId: z.string(),
  quantity: z.number().int().min(1),
  quotedTotalCents: Cents,    // server rejects if the price moved; see ADR-0012
})

export type CreateOrderRequest = z.infer<typeof CreateOrderRequest>
```

The server validates with the schema. The client imports the type. Change a field and the other
side fails to typecheck. That is what a frozen contract means in practice.

## Rules

1. **Never define the same shape twice.** Zod is the source. Everything else is generated.
2. **Only one in-flight ticket may touch this package.** Two agents adding subtly different
   versions of the same schema produce a semantic merge conflict, which is far worse than a
   textual one.
3. **A breaking change needs an ADR.** Breaking means a removed or renamed field, a narrowed
   type, or a changed status code.
4. **Comment the intent, not the type.** The type states the shape. A comment states why the
   field exists, and points to the SSOT rule or ADR that explains it. Those pointers are how an
   agent editing this file finds the reasoning without being told to look.
5. **Brand the primitives that get confused.** Money, local dates, and IDs. A `Cents` value that
   cannot be passed where a `Dollars` value is expected prevents a class of bug that tests do
   not catch.

## The error envelope is part of the contract

Success shapes get all the attention and failure shapes get invented per endpoint. Define the
error envelope once, here, and have every handler return it.

```ts
export const ErrorCode = z.enum([
  'MALFORMED_BODY', 'UNAUTHENTICATED', 'FORBIDDEN', 'NOT_FOUND',
  'VALIDATION_FAILED', 'RATE_LIMITED', 'INTERNAL_ERROR',
  // append only — never remove or repurpose a code
])

export const ProblemDetails = z.object({
  type: z.string(),          // stable URI
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),        // for humans. Never parsed by a client.
  instance: z.string().optional(),
  code: ErrorCode,           // THE contract. Clients switch on this.
  requestId: z.string(),     // join key to logs and traces
  errors: z.array(z.object({
    field: z.string(),
    code: z.string(),
    detail: z.string(),
  })).optional(),
})
```

`ErrorCode` is append-only, for the same reason an invariant is: removing one breaks every
client that branches on it. Rules in `docs/ssot/API_ERRORS.md`.

## Versioning

In a repository where the API and its clients ship together, **the type system is the
versioning**. Remove a field and the client fails to typecheck; CI catches it before anything
deploys.

That stops being true the moment you have a consumer you cannot redeploy — a mobile app, a
partner integration, a public API. Until then, a `/v1` prefix costs nothing and buys an escape
hatch, and you evolve additively inside it:

| Change | Breaking | How |
|---|---|---|
| Add a response field | no | ship it; clients ignore unknown fields |
| Add an optional request field | no | ship it |
| Add an enum value | **yes, for consumers that switch exhaustively** | treat as breaking |
| Rename or remove a field | yes | expand-contract: add the new one, migrate consumers, then remove |
| Change a type or a status code | yes | new field, or a new version |

Expand-contract is the same manoeuvre as a database migration, and for the same reason: you
cannot atomically change a producer and every consumer.

A real `/v2` is rare. When it happens it is usually a new API surface rather than an incremented
endpoint, which is why you see the prefix everywhere and the second version almost nowhere.

## Generated outputs

Never hand-write any of these. `mise run check` regenerates them and fails if the committed
copy differs.

| Output | From | Tool |
|---|---|---|
| OpenAPI document | the Zod schemas | `zod-openapi` |
| JSON Schema | the Zod schemas | `z.toJSONSchema()` |
| Typed client | the OpenAPI document | `@hey-api/openapi-ts` |

## Other languages

This repository is TypeScript by default. If a service in another language needs these shapes,
**do not hand-write them there.** Generate them.

```
packages/contracts/src/*.ts        Zod. The only hand-written source.
        ↓  z.toJSONSchema()
packages/contracts/dist/*.json     JSON Schema, generated
        ↓  datamodel-code-generator
services/<name>/models.py          Pydantic, generated, git-ignored
```

The Python service imports the generated models and never edits them. Generation runs inside
`mise run check`, and CI fails when the generated output differs from what is committed.

Wire this chain the first time a project actually needs it, and design it against that real
case. Do not build it speculatively.

## Documentation

Two artifacts, two different jobs. You want both.

| | Answers | Written by |
|---|---|---|
| OpenAPI | "what fields does this endpoint take?" | generated, always correct |
| `specs/<f>/TRACE.md` | "what does a real call look like end to end?" | a human once, then frozen |

Never hand-write an OpenAPI file. It is wrong within a week.
