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
| `contracts` | Zod schemas. The one source of truth for every boundary shape. |
| `config-*` | Shared tool configuration: lint, tsconfig, test setup |
| `<domain>-core` | Pure domain logic with no I/O, when it is shared by two apps |

Do not add a top-level source directory outside `apps/` and `packages/`.
