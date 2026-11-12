---
"@next-friday/create-app": minor
---

`pnpm depcruise` reads TypeScript 7 sources through the SWC parser: every stack gains the `@swc/core` dev dependency and `"parser": "swc"` in `.dependency-cruiser.json`.
