FROM docker.io/library/node:20-alpine AS builder
# Set working directory
WORKDIR /app
# Install turbo globally
RUN npm install -g turbo
# Copy all files
COPY . .
# Prune to just the backend app
RUN turbo prune --scope=@hydra/backend --docker

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
# Build the backend and its dependencies
RUN npx turbo run build --filter=@hydra/backend

# Runner stage
FROM docker.io/library/node:20-alpine AS runner
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=builder /app/data/ ./data/

ENV NODE_ENV=production

# The script command
CMD ["npm", "run", "start", "--workspace=apps/backend"]
