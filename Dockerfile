# =============================================================================
# Stage 1: The "Builder" Stage
# =============================================================================
FROM node:22-trixie-slim AS builder

WORKDIR /app

# Install Java Runtime Environment (required by node-plantuml)
RUN apt-get update && \
    apt-get install -y default-jre-headless && \
    rm -rf /var/lib/apt/lists/*
    
# Copy package.json and package-lock.json first to leverage Docker's layer caching
COPY package*.json ./

# Install all dependencies, including devDependencies needed for the build
RUN npm ci

# Copy the rest of application's source code
COPY src ./src
COPY tsconfig*.json *.config.* *.json .nvmrc ./

# Run the build script defined in package.json
RUN npm run build

# =============================================================================
# Stage 2: The "Production" Stage
# =============================================================================
FROM node:22-trixie-slim

# Install required packages: curl for health checks, gosu for user switching
RUN apt-get update && \
    apt-get install -y curl gosu && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create a dedicated user and group for the application
RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup appuser

# Copy package manifests and set ownership
COPY --chown=appuser:appgroup package*.json ./

# Install ONLY production dependencies
RUN HUSKY=0 npm ci --omit=dev

# Copy the compiled code from the builder stage
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist

# Create logs directory with proper ownership
RUN mkdir -p logs && chown appuser:appgroup logs

# Expose ports
EXPOSE 3000 3443

# Use entrypoint script to handle secrets, then start as appuser
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/app/index.js"]