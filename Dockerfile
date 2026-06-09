# This was adapted from https://github.com/vercel/next.js/tree/canary/examples/with-docker
FROM node:20-alpine AS base
# Upgrade system packages for security patches
RUN apk upgrade --no-cache

# ------------------------------------------------------------------------------------------------ #
# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /
# Install dependencies with yarn
COPY package.json yarn.lock ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile --network-timeout 100000; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ------------------------------------------------------------------------------------------------ #
# Rebuild the source code only when needed
FROM base AS next-builder
WORKDIR /
# Copy the dependencies
COPY --from=deps /node_modules ./node_modules
COPY ./package.json ./package.json
COPY ./tsconfig.json ./tsconfig.json
# Copy app source code
COPY ./src ./src
COPY ./public ./public
COPY ./next.config.ts ./next.config.ts
COPY ./tailwind.config.cjs ./tailwind.config.cjs
COPY ./postcss.config.js ./postcss.config.js
COPY ./next-logger.config.js ./next-logger.config.js
COPY ./db ./db
# Set env vars
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER=true
# Optional: set BASE_PATH for deployments behind a reverse proxy (e.g. /app in standalone Docker)
ARG BASE_PATH=""
ENV NEXT_PUBLIC_BASE_PATH=${BASE_PATH}
# Compute deployment ID to avoid cache busting with git sha and use it for the build
RUN --mount=type=secret,id=sentry_auth_token \
  SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token)" \
  DEPLOYMENT_ID=$(find . -type f -not -path './node_modules/*' -print0 | sort -z | xargs -0 sha256sum | sha256sum | cut -c1-16) \
  yarn --network-timeout 100000 next build

# ------------------------------------------------------------------------------------------------ #
# Rebuild the migration scripts only when needed
FROM base AS migrations-builder
WORKDIR /
# Copy dependencies
COPY --from=deps /node_modules ./node_modules
COPY ./package.json ./package.json
# Copy migration scripts source code
COPY ./db ./db
# Compile the migration scripts
RUN yarn --network-timeout 100000 tsc ./db/*.ts ./db/**/*.ts --skipLibCheck --module CommonJS --moduleResolution Node --outDir dist

# ------------------------------------------------------------------------------------------------ #
# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_OTEL_FETCH_DISABLED=1
# Remove unnecessary node modules
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack
RUN rm -rf /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
# Copy migration script files and dependencies
COPY --from=migrations-builder /dist ./db
COPY --from=migrations-builder /node_modules/kysely ./db/node_modules/kysely
# Set the correct permission for prerender cache
RUN addgroup -g 1001 -S app
RUN adduser -S app -u 1001
RUN mkdir .next
RUN chown app:app .next
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=next-builder /public ./public
COPY --from=next-builder --chown=app:app /.next/standalone ./
COPY --from=next-builder --chown=app:app /.next/static ./.next/static
USER app
# Release metadata — passed as build-args by CI.
# VERSION: self-hosted sets at build time; cloud sets at deploy time via kubectl set env.
# GIT_SHA / RELEASED_AT: always set at build time.
ARG VERSION
ENV VERSION=${VERSION}
ARG GIT_SHA
ENV GIT_SHA=${GIT_SHA}
ARG RELEASED_AT
ENV RELEASED_AT=${RELEASED_AT}
# set hostname to localhost and expose port 3000
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
EXPOSE 3000
# wait for db to be ready if running with docker compose, run migrations, and start the server
CMD ["sh", "-c", "node db/migrator.js && node server.js"]
