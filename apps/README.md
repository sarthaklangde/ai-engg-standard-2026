# apps/

Deployable things. One directory per deployable unit.

A web app, an API server, a worker, a scheduled job, a CLI. If it ships and runs on its own, it
belongs here. If it is imported by something else, it belongs in `packages/`.

## Rules

- One app per deployable unit. Not one per feature.
- Each app holds a `package.json` with a real `description`. `CODEMAP.md` is generated from it.
- Each app may hold its own `AGENTS.md` for rules that apply only inside it. The root
  `AGENTS.md` still applies. Nested files add; they do not replace.
- Internal structure is the app's own business. `src/modules/<feature>/` is a reasonable default
  for a server. Keep it inside the app.
- Do not add a top-level directory outside the sanctioned roots. `tooling/checks/root-layout.mjs`
  enforces this; adding one needs an ADR.

## Non-TypeScript apps

A Python or Go service lives here too, with the same rules. It gets its shared types by
generating them from `packages/contracts`. It never hand-writes a schema that already exists
there. See `packages/contracts/README.md`.
