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
