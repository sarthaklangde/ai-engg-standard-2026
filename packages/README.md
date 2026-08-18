# packages/

Shared libraries. Not deployable on their own.

Each package holds a `package.json` with a real `description`. `CODEMAP.md` is generated from
those descriptions, so write them as if someone will read them. Someone will.

## Rules

- One package per shared concern. Do not create a package for a single function.
- A package README states what it is in two or three sentences. Nothing more. Anything longer is
  usually describing the code, which is derivable, which means it will rot.
- `contracts` is special. Read `contracts/README.md` before touching it.

## Conventional packages

| Package | Holds |
|---|---|
| `contracts` | Boundary shapes. Hand-written when one language owns them; generated when the API is the boundary. |
| `tokens` | Design tokens. Pure data, generates CSS, presets, and typed constants. |
| `ui` | Shared primitives only. Not app-specific patterns. |
| `config-*` | Shared tool configuration: lint, tsconfig, test setup |
| `<domain>-core` | Pure domain logic with no I/O, when two apps share it |

**A package needs two consumers, or a hard boundary reason** — published externally, a
different runtime, security isolation. One consumer means it belongs inside that app.

Never create `packages/utils` or `packages/common`. Those names mean "I did not know where this
goes", and they grow without limit because nothing is ever *not* a util. If you cannot name a
package after what it contains, it does not want to be a package yet.

Do not add a top-level directory outside the sanctioned roots without an ADR.
