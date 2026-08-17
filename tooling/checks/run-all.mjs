#!/usr/bin/env node
//
// Runs every documentation gate and reports them together.
//
// Runs all checks even after one fails, so you fix the whole set in one pass
// instead of discovering them one at a time.

import { spawnSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

const CHECKS = [
  ['ssot-invariant-sync.mjs', []],
  ['ticket-frontmatter.mjs', []],
  ['codemap-gen.mjs', ['--check']],
]

let failed = 0
for (const [script, args] of CHECKS) {
  const result = spawnSync(process.execPath, [join(here, script), ...args], { stdio: 'inherit' })
  if (result.status !== 0) failed++
}

if (failed > 0) {
  console.error(`\n${failed} documentation gate(s) failed.`)
  console.error('These are gates, not guidelines. See docs/process/DOCUMENT_TYPES.md.\n')
  process.exit(1)
}
