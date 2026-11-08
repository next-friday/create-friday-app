---
"@next-friday/create-app": patch
---

Generated Dockerfiles (`nodejs`, `nestjs`, `nextjs`, `payload`, and both `turborepo` apps) activate pnpm with `corepack enable`, which installs the version and sha512 hash in `package.json#packageManager`, instead of `npm install --global pnpm`. Their `node` base image is referenced by digest alone, and long `FROM` and `rm -rf` lines are split with backslash continuations.
