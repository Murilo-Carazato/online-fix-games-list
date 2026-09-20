FROM docker.io/library/node:20-alpine AS builder
WORKDIR /app
RUN npm install -g turbo
COPY . .
# Prune to just the web frontend
RUN turbo prune --scope=web --docker

FROM docker.io/library/node:20-alpine AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm ci
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
# Note: Ensure API endpoint is known during build if needed
RUN npx turbo run build --filter=web

FROM docker.io/library/node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Next.js standalone mode is recommended, but we run via next start for simplicity if not enabled
COPY --from=installer /app/ .

EXPOSE 3000

CMD ["npx", "turbo", "run", "start", "--filter=web"]
