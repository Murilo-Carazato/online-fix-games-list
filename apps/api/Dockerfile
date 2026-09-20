FROM docker.io/library/node:20-alpine AS builder
# Set working directory
WORKDIR /app
# Install turbo globally
RUN npm install -g turbo
# Copy all files
COPY . .
# Prune to just the API
RUN turbo prune --scope=@hydra/api --docker

# Installer stage
FROM docker.io/library/node:20-alpine AS installer
WORKDIR /app
# Copy pruned package.json and lockfile
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
# Install dependencies
RUN npm ci
# Copy pruned source code
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
# Build the project
RUN npx turbo run build --filter=@hydra/api

# Runner stage
FROM docker.io/library/node:20-alpine AS runner
WORKDIR /app
COPY --from=installer /app/ .

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
