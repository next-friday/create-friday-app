---
paths:
  - "package.json"
  - "pnpm-lock.yaml"
  - "pnpm-workspace.yaml"
---

# Dependencies

Add a dependency when active code, tests, build tooling, or a documented contract uses it, and neither the platform nor existing project code covers the need. A maintained library that replaces custom code meets this test; `platform-and-library-first.md` sets the order. Assess cadence, license, advisories, compatibility, and transitives first. Place it in the manifest of the project that imports it, in the ecosystem category that matches its role.

Resolve a vulnerability that Dependabot or OSV-Scanner reports by upgrading the dependency. For a transitive dependency, add a pnpm override in `pnpm-workspace.yaml`. When no fix exists, record the accepted risk as `no-suppression.md` describes.
