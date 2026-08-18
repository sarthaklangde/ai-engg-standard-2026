#!/usr/bin/env node
//
// No unsanctioned top-level directory.
//
// Roots are not a matter of taste. They key off a mechanical property:
//
//   apps/       has an entry point  → something runs it
//   packages/   has exports         → something imports it
//   database/   applied by CI to a database, imported by nothing
//   infra/      applied by CI to a cloud,    imported by nothing
//   tooling/    run by CI,                   imported by nothing
//
// A stray `src/`, `lib/`, `utils/`, or `common/` at the root means someone did
// not know where code goes, and that directory grows without limit because
// nothing is ever *not* a util.

import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, SANCTIONED_ROOTS, report } from './lib.mjs'

const failures = []

for (const entry of readdirSync(ROOT)) {
  if (entry.startsWith('.') || entry === 'node_modules') continue
  if (!statSync(join(ROOT, entry)).isDirectory()) continue
  if (SANCTIONED_ROOTS.has(entry)) continue
  failures.push(
    `"${entry}/" is not a sanctioned root. Put deployables in apps/, imported code in ` +
      `packages/. If it is genuinely neither, write an ADR and add it to SANCTIONED_ROOTS.`,
  )
}

process.exit(report('root-layout', failures, 'roots are sanctioned'))
