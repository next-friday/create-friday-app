# Runs on any OCI platform (Railway, Fly.io, Cloud Run). On Vercel, deploy without it. The platform sets `PORT`.
FROM node:24.22.1-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS build
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/app/package.json apps/app/package.json
COPY apps/backoffice/package.json apps/backoffice/package.json
RUN npm install --global "pnpm@$(node --print 'require("./package.json").packageManager.split("+")[0].split("@")[1]')"
RUN pnpm install --frozen-lockfile --ignore-scripts --filter ./apps/app...
COPY apps/app/next.config.ts apps/app/postcss.config.mjs apps/app/tsconfig.json apps/app/
COPY apps/app/app apps/app/app
RUN pnpm --filter ./apps/app build

FROM node:24.22.1-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0
WORKDIR /app
# Apply Alpine security fixes released after the base image, and drop npm, corepack, and yarn: the app never runs them, and their bundled dependencies carry their own CVEs.
RUN apk upgrade --no-cache \
  && rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*
# Next.js writes .next/cache at runtime. Add `COPY --from=build --chown=node:node /app/apps/app/public ./apps/app/public` when the app has a public/ folder.
COPY --from=build --chown=node:node /app/apps/app/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/app/.next/static ./apps/app/.next/static
USER 1000
HEALTHCHECK --interval=30s --timeout=5s CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then(response => process.exit(response.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "apps/app/server.js"]
