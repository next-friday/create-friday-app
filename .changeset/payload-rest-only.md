---
"@next-friday/create-app": major
---

Generate `payload` projects with GraphQL disabled, on `graphql` 17.0.2.

`graphql` 17 breaks every Payload GraphQL request that uses variables, so generated `payload` projects set `graphQL: {disable: true}` and no longer include the `/api/graphql` and `/api/graphql-playground` routes. The REST API and the admin panel are unchanged. `graphql` stays installed because Payload requires it as a peer dependency.

Migration: use the REST API. To use GraphQL, pin `graphql` to `16.14.2`, remove `graphQL: {disable: true}`, and restore both routes from a Payload template.
