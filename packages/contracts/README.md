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
