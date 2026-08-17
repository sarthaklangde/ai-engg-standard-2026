#!/usr/bin/env node
//
// Proves that the prose and the tests agree.
//
// Fails when:
//   - an SSOT rule has no test that cites it
//   - a test cites a rule that does not exist in any SSOT
//   - two SSOTs claim the same rule prefix
//   - an SSOT has no `prefix:` in its frontmatter
//
// This is the check that turns "documentation does not drift" from an
// aspiration into a build failure.

import { readSsots, readInvariantMarkers, rel, report } from './lib.mjs'

const ssots = readSsots()
const markers = readInvariantMarkers()
const failures = []

const broken = ssots.filter((s) => s.error)
for (const s of broken) failures.push(`${rel(s.file)} — ${s.error}`)

const active = ssots.filter((s) => !s.error)

// Two SSOTs must never share a prefix, or a rule ID becomes ambiguous.
const byPrefix = new Map()
for (const s of active) {
  const seen = byPrefix.get(s.prefix)
  if (seen) failures.push(`prefix "${s.prefix}" is claimed by ${rel(seen.file)} and ${rel(s.file)}`)
  else byPrefix.set(s.prefix, s)
}

const declared = new Map() // id -> ssot
for (const s of active) {
  for (const rule of s.rules) {
    if (!rule.id.startsWith(`${s.prefix}-`)) {
      failures.push(
        `${rel(s.file)}:${rule.line} — rule ${rule.id} does not use this file's prefix "${s.prefix}"`,
      )
      continue
    }
    if (declared.has(rule.id)) {
      failures.push(`${rule.id} is declared twice: ${rel(declared.get(rule.id).file)} and ${rel(s.file)}`)
    }
    declared.set(rule.id, s)
  }
}

// Every rule needs a test.
for (const [id, ssot] of declared) {
  if (!markers.has(id)) {
    failures.push(
      `${id} (${rel(ssot.file)}) has no test — add "// @invariant ${id}" to a file under tests/invariants/`,
    )
  }
}

// Every test must cite a rule that exists.
for (const [id, files] of markers) {
  if (!declared.has(id)) {
    failures.push(`${files[0]} cites ${id}, which no SSOT declares`)
  }
}

const ruleCount = declared.size
process.exit(
  report(
    'ssot-invariant-sync',
    failures,
    ruleCount === 0 ? '(no rules declared yet)' : `${ruleCount} rules, all proven`,
  ),
)
