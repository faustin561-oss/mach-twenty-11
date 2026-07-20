FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
# prisma/ and scripts/ are copied here, before `npm ci`, because
# postinstall (package.json) runs `node scripts/db-sync.js generate`,
# which shells out to `prisma generate` — that needs the schema files to
# already exist in the build context. Without this, `npm ci` fails right
# after the lockfile itself resolves correctly, trading one build
# failure for a different one.
#
# Deliberately NOT setting NODE_ENV=production here: npm skips
# devDependencies by default when NODE_ENV=production, but tailwindcss/
# postcss/autoprefixer are devDependencies genuinely needed at *build*
# time (next build's CSS pipeline), not just for local dev — setting it
# here would silently break the Tailwind build. Whatever schema
# postinstall generates against in this stage doesn't matter either way:
# the builder stage below explicitly regenerates against the correct
# production schema before building, overwriting it.
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY scripts ./scripts
RUN npm ci

FROM base AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# build:production runs `prisma generate --schema=prisma/schema.production.prisma`
# (the real Postgres schema) then `next build` directly — NOT via
# `npm run build`, which matters: `npm run build` would trigger the
# `prebuild` npm lifecycle hook (check-env.js + a `prisma db push`
# attempt), and there is no reachable database during a Docker image
# build. The previous version of this file ran a bare `npx prisma
# generate` with no --schema flag, which silently defaults to the SQLite
# dev schema — meaning even a "successful" build would have shipped a
# Prisma Client generated against the wrong database engine for a real
# Postgres production deployment.
RUN npm run build:production

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["npm", "run", "start"]
