#!/usr/bin/env node
//
// Enforces the triage gate.
//
// Every ticket must declare which domain rules it touches and which decisions
// constrain it. You cannot fill that in without reading the SSOT, which is the
// entire point: it makes reading the domain rules a precondition of doing work.
//
// Fails when:
//   - a ticket has no frontmatter
//   - `invariants:` is missing or empty
//   - an invariant ID or ADR number does not resolve
//   - `contracts:` is not one of none | additive | breaking
//   - `contracts: breaking` is declared without an ADR

import { readFileSync } from 'node:fs'
import { parseFrontmatter, readSsots, readAdrs, readTickets, rel, report } from './lib.mjs'

const CONTRACT_VALUES = new Set(['none', 'additive', 'breaking'])

const knownRules = new Set(
  readSsots()
    .filter((s) => !s.error)
    .flatMap((s) => s.rules.map((r) => r.id)),
)
const knownAdrs = readAdrs()
const tickets = readTickets()
const failures = []

for (const file of tickets) {
  const where = rel(file)
  const fm = parseFrontmatter(readFileSync(file, 'utf8'))

  if (!fm) {
    failures.push(`${where} — no frontmatter. Copy specs/_template/tickets/TEMPLATE.md.`)
    continue
  }

  const invariants = toList(fm.invariants)
  if (invariants.length === 0) {
    failures.push(`${where} — "invariants:" is empty. Use [none] only if no domain rule applies.`)
  }
  for (const id of invariants) {
    if (id === 'none') continue
    if (!knownRules.has(id)) failures.push(`${where} — invariant ${id} does not exist in any SSOT`)
  }

  for (const id of toList(fm.adrs)) {
    if (id === 'none') continue
    if (!knownAdrs.has(id)) failures.push(`${where} — ${id} does not exist in docs/adr/`)
  }

  const contracts = (fm.contracts ?? '').trim()
  if (!CONTRACT_VALUES.has(contracts)) {
    failures.push(`${where} — "contracts:" must be none, additive, or breaking (got "${contracts}")`)
  }
  if (contracts === 'breaking' && toList(fm.adrs).filter((a) => a !== 'none').length === 0) {
    failures.push(`${where} — a breaking contract change needs an ADR. Write one, then cite it.`)
  }
}

function toList(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

process.exit(
  report(
    'ticket-frontmatter',
    failures,
    tickets.length === 0 ? '(no tickets yet)' : `${tickets.length} tickets, all resolve`,
  ),
)
