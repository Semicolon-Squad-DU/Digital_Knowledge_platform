FROM node:22-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/frontend apps/frontend
COPY packages/shared packages/shared
RUN npm run build --workspace=apps/frontend

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S dkp && adduser -S dkp -G dkp

# Standalone output is rooted at the monorepo root (node_modules + package.json
# live at the top, with the actual app nested under apps/frontend) — copy it
# verbatim rather than flattening, so Node's module resolution keeps working.
COPY --from=build /repo/apps/frontend/.next/standalone ./
COPY --from=build /repo/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build /repo/apps/frontend/public ./apps/frontend/public

USER dkp
EXPOSE 3000
CMD ["node", "apps/frontend/server.js"]
