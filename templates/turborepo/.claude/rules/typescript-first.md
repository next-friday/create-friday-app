---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# TypeScript-First

In a TypeScript-capable app or package, write source, tests, and scripts as `.ts`, and JSX as `.tsx`. Use that extension for new work and for any JavaScript file whose implementation this change already touches, then update its imports, scripts, tests, and configuration in the same change.

Keep other languages in separately maintained components. Use a non-TypeScript extension when the runtime, tool, or public contract requires it.

_Completion criterion_: Every file this change created or materially rewrote in a TypeScript-capable project uses the TypeScript extension the runtime accepts, and its imports and scripts resolve.
