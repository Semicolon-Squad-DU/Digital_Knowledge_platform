FROM node:22-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/backend apps/backend
COPY packages/shared packages/shared
RUN npm run build --workspace=apps/backend

FROM node:22-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production
# postgresql17-client provides pg_dump/psql, used by the backup/restore jobs.
# pg_dump refuses to run against a newer server (Supabase runs PG 17), so this
# must track the target database's major version, not just "latest available".
RUN apk add --no-cache postgresql17-client
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --omit=dev --workspace=apps/backend
COPY --from=build /repo/dist ./dist

RUN addgroup -S dkp && adduser -S dkp -G dkp
USER dkp

EXPOSE 4000
CMD ["node", "dist/apps/backend/src/server.js"]
