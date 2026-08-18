# tokens

**Death rule: `src/tokens.json` is hand-written and evolves. `dist/` is generated — never edit.**

Design tokens. Pure data, no framework, no components. Every frontend app imports this.

```
packages/tokens/
├── src/
│   ├── tokens.json        ← HAND-WRITTEN. The one source.
│   └── fonts/             woff2 files
└── dist/                  ← GENERATED. Drift-checked in CI.
    ├── tokens.css         custom properties + @font-face
    ├── tailwind.preset.js
    └── tokens.ts          typed constants
```

## Tokens are a contract

Exactly like a schema or an API contract: one hand-written source, every consumable form
derived from it.

```
tokens.json  →  tokens.css  +  tailwind.preset.js  +  tokens.ts
```

You never hand-write a CSS custom property, for the same reason you never hand-write an OpenAPI
document. Two sources for one fact means one of them is wrong, and you find out from a designer.

## Why this ships before components

`packages/tokens` earns its place on day one. `packages/ui` does not.

A package needs **two consumers, or a hard boundary reason** — published externally, a different
runtime, security isolation. Tokens have every consumer immediately and carry no coupling risk,
because they are data. Components carry a lot: extract a `Card` for two apps that never wanted
the same card and you get a component with fourteen boolean props that satisfies neither.

Share the vocabulary. Do not share the sentences.

## What is shared, and what is not

| Layer | Example | Shared |
|---|---|---|
| Tokens | `color.brand.600`, `space.4`, the type scale | **always** |
| Primitives | Button, Input, Dialog, Select | when a second app needs the same one |
| Patterns | a domain-specific card, a calendar row | **never** — app-specific meaning |

## The design invariants

Tokens make design rules machine-checkable. They belong in `docs/ssot/DESIGN.md` with the `DS`
prefix, and they are exactly the rules that decay fastest when an agent writes UI — a model
reaches for `#3B82F6` because it looks right, and three sprints later you have forty blues.

| Rule | Enforced by |
|---|---|
| No raw color value outside `tokens.json` | stylelint, CI |
| Spacing uses scale steps, never arbitrary px | lint rule |
| Every interactive element has a visible focus state | axe in Playwright |
| Text contrast meets WCAG AA | automated |
| Every component renders in both themes | visual regression |

## Fonts

Font files live here, and the `@font-face` rules generate into `tokens.css` — font family is a
token, so it ships with the tokens.

Two things to settle before launch, not after:

- **Licensing.** Most commercial webfonts cannot sit in a public repository. If the licence is
  restrictive, use private storage or a licensed CDN, and record the terms in
  `docs/integrations/`.
- **Self-host rather than CDN** where the licence allows. One less third party in the critical
  render path, and no external service logging your users.

## If you use a copy-in component library

A library whose model is "copy the source into your project, you own it" composes with this
cleanly. Add components into `packages/ui` **once**, not into each app, and point its config at
the package. You keep ownership of the source and still have one copy.

Then wire its theme variables to these tokens, so the library resolves colors from
`tokens.json`. Otherwise you have two color systems and the token rule cannot hold.
