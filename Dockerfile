FROM node:20-alpine

WORKDIR /app

# Copy configuration files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (only dev as we compile on the fly with ts-node)
# Install dependencies using cache mounts for faster rebuilds
RUN --mount=type=cache,target=/root/.npm npm install

# Copy source code
COPY . .

# Build the application safely
RUN npm run build

# Start the compiled script
CMD ["npm", "run", "start:prod"]
