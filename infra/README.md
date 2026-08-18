# infra/

**Death rule: permanent. The committed code is a claim; the provider's state is the truth.**

Infrastructure as code. Applied to a cloud by CI. Nothing imports it, which is why it sits at
the root and not in `packages/`.

Tool-agnostic — Terraform, Pulumi, OpenTofu, or compose files. The rules below hold either way.

## Rules

1. **Agents may plan. Agents may never apply.** `plan` is read-only and genuinely useful to an
   agent. `apply` runs from CI with credentials the agent environment does not hold.
2. **Enforce that with credentials, not instructions.** An instruction is a suggestion at 2am
   when something is broken. Scope the token.
3. **Drift is a gate.** Run `plan` with a non-zero exit on changes, on a schedule. Console
   clicking silently invalidates this whole directory, and you want to find out on a Tuesday
   rather than during an incident.
4. **Every platform choice gets an ADR.** "Why this host and not that one", "why one database
   and not one per service". These get re-litigated constantly by every new person and every
   agent, because the reasoning is invisible in the configuration.
5. **State is not in git.** Remote backend, locked. The state file holds secrets.
6. **Environments are directories, not branches.** `infra/envs/staging`, `infra/envs/prod`.

## Why drift detection matters here

It is the same gate as `codemap-drift`: a generated or applied artifact that disagrees with the
committed source. The difference is that infrastructure drift is invisible until you next run
`apply`, at which point it either reverts someone's emergency fix or fails in a way nobody
expects.

## Secrets

Not here. Name the mechanism per environment, name the owner, and name the rotation expectation
in `docs/integrations/` or a dedicated ADR. This directory references secrets; it never contains
them.
