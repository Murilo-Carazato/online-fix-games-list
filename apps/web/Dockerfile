FROM docker.io/library/node:20-alpine AS builder
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=web --docker

FROM docker.io/library/node:20-alpine AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm ci
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN npx turbo run build --filter=web

FROM docker.io/library/node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache ca-certificates
ENV NODE_ENV=production
COPY --from=installer /app/ .

EXPOSE 3000

CMD ["npx", "turbo", "run", "start", "--filter=web"]
