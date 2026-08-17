#!/usr/bin/env node
//
// Generates CODEMAP.md from the workspace manifests.
//
//   node tooling/checks/codemap-gen.mjs            rewrite CODEMAP.md
//   node tooling/checks/codemap-gen.mjs --check    fail if the committed copy is stale
//
// A hand-maintained index rots. This one is derived from package.json, which
// cannot drift from reality, because it *is* reality. Write a real
// `description` in every manifest — it is the only prose this file carries.

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, fmt } from './lib.mjs'

const BEGIN = '<!-- BEGIN GENERATED -->'
const END = '<!-- END GENERATED -->'
const ROOTS = ['apps', 'packages']

function collect() {
  const found = []
  for (const group of ROOTS) {
    const dir = join(ROOT, group)
    if (!existsSync(dir)) continue
    for (const entry of readdirSync(dir).sort()) {
      const pkgPath = join(dir, entry, 'package.json')
      if (!existsSync(pkgPath) || !statSync(join(dir, entry)).isDirectory()) continue
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
      found.push({
        group,
        path: `${group}/${entry}`,
        name: pkg.name ?? entry,
        description: pkg.description ?? '',
        deps: Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }),
      })
    }
  }
  return found
}

function render(entries) {
  if (entries.length === 0) {
    return '_No workspace packages yet. Run `mise run codemap` after you add the first one._'
  }

  const names = new Set(entries.map((e) => e.name))
  const lines = []

  for (const group of ROOTS) {
    const rows = entries.filter((e) => e.group === group)
    if (rows.length === 0) continue

    lines.push(`### ${group}/`, '')
    lines.push('| Path | Package | What it is | Depends on |')
    lines.push('|---|---|---|---|')
    for (const row of rows) {
      const internal = row.deps.filter((d) => names.has(d))
      const description = row.description || '_no description in package.json_'
      lines.push(
        `| \`${row.path}\` | \`${row.name}\` | ${description} | ${
          internal.length ? internal.map((d) => `\`${d}\``).join(', ') : '—'
        } |`,
      )
    }
    lines.push('')
  }

  return lines.join('\n').trimEnd()
}

const file = join(ROOT, 'CODEMAP.md')
const current = readFileSync(file, 'utf8')
const start = current.indexOf(BEGIN)
const end = current.indexOf(END)

if (start === -1 || end === -1) {
  console.error(fmt.fail(`CODEMAP.md is missing its ${BEGIN} / ${END} markers`))
  process.exit(1)
}

const next =
  current.slice(0, start + BEGIN.length) + '\n' + render(collect()) + '\n' + current.slice(end)

if (process.argv.includes('--check')) {
  if (next !== current) {
    console.error(fmt.fail('codemap-drift'))
    console.error('    CODEMAP.md is stale or was hand-edited. Run `mise run codemap`.\n')
    process.exit(1)
  }
  console.log(fmt.pass(`codemap-drift ${fmt.dim('(up to date)')}`))
  process.exit(0)
}

writeFileSync(file, next)
console.log(fmt.pass('CODEMAP.md regenerated'))
