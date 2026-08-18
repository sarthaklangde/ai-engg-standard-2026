#!/usr/bin/env node
//
// Every ADR file appears in the index, and every index row points at a real file.
//
// The index is how an agent finds a decision without opening forty files. An ADR
// missing from it is an ADR nobody will ever read, which makes writing it wasted
// work and leaves the decision open to being re-litigated.

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, report } from './lib.mjs'

const dir = join(ROOT, 'docs', 'adr')
const indexPath = join(dir, 'README.md')
const failures = []

if (!existsSync(indexPath)) {
  failures.push('docs/adr/README.md is missing — it holds the decision index')
}

const files = existsSync(dir)
  ? readdirSync(dir).filter((n) => /^\d{4}-.+\.md$/.test(n) && !n.startsWith('0000-'))
  : []

const index = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : ''
const indexed = new Set(
  [...index.matchAll(/^\|\s*(\d{4})\s*\|/gm)].map((m) => m[1]),
)

for (const name of files) {
  const num = name.slice(0, 4)
  if (!indexed.has(num)) {
    failures.push(`ADR-${num} (${name}) is not in the index — add a row to docs/adr/README.md`)
  }
}

for (const num of indexed) {
  if (!files.some((n) => n.startsWith(`${num}-`))) {
    failures.push(`docs/adr/README.md lists ADR-${num}, but no such file exists`)
  }
}

process.exit(
  report('adr-index-sync', failures, files.length === 0 ? '(no ADRs yet)' : `${files.length} ADRs indexed`),
)
