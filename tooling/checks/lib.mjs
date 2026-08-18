// Shared parsing for the repository checks.
//
// Plain .mjs on purpose: these scripts must run with bare `node` on any machine,
// with no build step, no loader flag, and no dependency install. A check that
// cannot run is a check that gets skipped.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

export const ROOT = process.cwd()

/** Extensions scanned for `@invariant` markers. Add a language, add it here. */
export const INVARIANT_TEST_EXTS = [
  '.ts', '.tsx', '.js', '.jsx', '.mjs',
  '.py', '.go', '.rb', '.rs', '.java', '.kt', '.sql',
]

/** Top-level directories this standard sanctions. Anything else needs an ADR. */
export const SANCTIONED_ROOTS = new Set([
  'apps', 'packages',            // build graph: entry points and exports
  'database', 'infra', 'tooling', // operational: applied by CI, imported by nothing
  'docs', 'specs', 'tests',      // process
])

const GREY = '\x1b[90m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const BOLD = '\x1b[1m'
const OFF = '\x1b[0m'

export const fmt = {
  fail: (s) => `${RED}✗${OFF} ${s}`,
  pass: (s) => `${GREEN}✓${OFF} ${s}`,
  dim: (s) => `${GREY}${s}${OFF}`,
  bold: (s) => `${BOLD}${s}${OFF}`,
}

/** Recursively list files under `dir` whose name ends with one of `exts`. */
export function walk(dir, exts, acc = []) {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, exts, acc)
    else if (exts.some((e) => entry.endsWith(e))) acc.push(full)
  }
  return acc
}

/**
 * Parse the leading `---` block. Supports `key: value` and `key: [a, b]`.
 * Deliberately not a full YAML parser — the frontmatter in this repo is a
 * fixed, tiny shape, and a dependency here would defeat the point.
 */
export function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (!match) return null
  const out = {}
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line.trim())
    if (!kv) continue
    const [, key, raw] = kv
    const value = raw.replace(/\s+#.*$/, '').trim()
    if (value.startsWith('[')) {
      out[key] = value
        .slice(1, value.lastIndexOf(']'))
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    } else {
      out[key] = value.replace(/^["']|["']$/g, '')
    }
  }
  return out
}

const SSOT_DIR = join(ROOT, 'docs', 'ssot')
const SKIP_SSOT = new Set(['README.md', 'TEMPLATE.md'])

/**
 * Read every active SSOT.
 * Returns [{ file, domain, prefix, rules: [{ id, line }] }].
 * Files marked `status: draft` are skipped — a draft has no test obligation yet.
 */
export function readSsots() {
  if (!existsSync(SSOT_DIR)) return []
  const out = []
  for (const name of readdirSync(SSOT_DIR)) {
    if (!name.endsWith('.md') || SKIP_SSOT.has(name)) continue
    const file = join(SSOT_DIR, name)
    const text = readFileSync(file, 'utf8')
    const fm = parseFrontmatter(text)

    if (!fm || !fm.prefix) {
      out.push({ file, error: 'missing frontmatter with a `prefix:` field' })
      continue
    }
    if (fm.status === 'draft') continue

    const rules = []
    text.split(/\r?\n/).forEach((line, i) => {
      const m = /^-\s+\*\*([A-Z]{2,6}-\d+)\*\*/.exec(line)
      if (m) rules.push({ id: m[1], line: i + 1 })
    })
    out.push({ file, domain: fm.domain ?? name, prefix: fm.prefix, rules })
  }
  return out
}

/** Read committed ADR numbers. Returns a Set of strings like "ADR-0007". */
export function readAdrs() {
  const dir = join(ROOT, 'docs', 'adr')
  if (!existsSync(dir)) return new Set()
  const ids = new Set()
  for (const name of readdirSync(dir)) {
    const m = /^(\d{4})-.+\.md$/.exec(name)
    if (m && m[1] !== '0000') ids.add(`ADR-${m[1]}`)
  }
  return ids
}

/**
 * Every `@invariant XX-1` marker under tests/invariants.
 *
 * Language-agnostic on purpose: the marker is a comment, and a Python backend
 * writes `# @invariant CAP-1` in pytest exactly as TypeScript writes `//`.
 * A check that only sees one language silently reports every rule as untested.
 */
export function readInvariantMarkers() {
  const files = walk(join(ROOT, 'tests', 'invariants'), INVARIANT_TEST_EXTS)
  const found = new Map() // id -> [files]
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const m of text.matchAll(/@invariant\s+([A-Z]{2,6}-\d+)/g)) {
      const list = found.get(m[1]) ?? []
      list.push(rel(file))
      found.set(m[1], list)
    }
  }
  return found
}

/** Ticket files, excluding anything under a `_template` directory. */
export function readTickets() {
  return walk(join(ROOT, 'specs'), ['.md']).filter(
    (f) => f.includes(`${sep()}tickets${sep()}`) && !f.includes('_template'),
  )
}

function sep() {
  return process.platform === 'win32' ? '\\' : '/'
}

export function rel(file) {
  return relative(ROOT, file)
}

export function report(name, failures, passMessage) {
  if (failures.length === 0) {
    console.log(fmt.pass(`${name} ${fmt.dim(passMessage)}`))
    return 0
  }
  console.error(fmt.fail(fmt.bold(name)))
  for (const f of failures) console.error(`    ${f}`)
  console.error('')
  return 1
}
