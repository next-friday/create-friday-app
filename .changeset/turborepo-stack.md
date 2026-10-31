---
"@next-friday/create-app": minor
---

Add a `turborepo` stack. Generated projects are a pnpm workspace with a Next.js app in `apps/app` and a Payload backoffice in `apps/backoffice`. `pnpm dev` starts the app on port 3000 and the backoffice on port 3001. The backoffice API is REST at `/api`. The company checks, hooks, and CI match the other templates. Deploy to Railway updates both services on the same commit.
