---
"@next-friday/create-app": patch
---

Stop installing `graphql` in generated `payload` projects. The API is REST at `/api`, and Payload's GraphQL API stays disabled. pnpm no longer auto-installs the `graphql` peer.
