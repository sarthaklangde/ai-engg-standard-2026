# External Integrations

**Death rule: permanent. Updated in the same PR as the integration changes.**

One file per external provider. `RESEND.md`, `STRIPE.md`, `AIRBNB.md`.

These documents survive because they hold what the vendor's documentation does not: what the
provider actually does when things go wrong, and what you decided to do about it.

## Required content

Each file states these, and nothing else.

| Section | Content |
|---|---|
| Purpose | What this repository uses the provider for. Two sentences. |
| Auth | The auth model, where the credential lives, and who rotates it. |
| Surface | The endpoints and webhooks this repo consumes. Only the ones used. |
| Failure modes | What the provider does when it fails, and what we do in response. Rate limits, timeouts, partial success, retries, and whether the operation is idempotent. |
| Sandbox vs production | Every behavioral difference you have found. |
| Verified example | A working, runnable snippet. Committed as a test where possible. |

## The verified example rule

A dumped copy of the vendor's documentation is a cache, not a contract. It goes stale silently
and an agent cannot tell.

What actually prevents integration mistakes is one working example, committed, that runs. Prefer
an integration test against the provider's sandbox over any amount of prose. When the provider
changes, the test fails and you find out. Prose does not fail.

## Rules

- Write down the surprise, not the happy path. The happy path is in the vendor's docs.
- Record the failure you actually hit in production, with the date and what you changed.
- If the provider is authoritative for data you also store, say so explicitly. Ambiguity about
  who owns a fact causes the worst class of bug in an integration.
