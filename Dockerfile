# =============================================================================
# Stage 1: The "Builder" Stage
# =============================================================================
# Use the specific Node.js version from your package.json and .nvmrc
FROM node:22-trixie-slim AS builder

# Set the working directory inside the container
WORKDIR /app

# Install Java Runtime Environment (required by node-plantuml)
RUN apt-get update && \
    apt-get install -y default-jre-headless && \
    rm -rf /var/lib/apt/lists/*
    
# Copy package.json and package-lock.json first to leverage Docker's layer caching
COPY package*.json ./

# Install all dependencies, including devDependencies needed for the build
RUN npm install

# Copy the rest of your application's source code
COPY . .

# Run the build script defined in package.json
# This will compile TypeScript to JavaScript in the /app/dist folder
RUN npm run build

# =============================================================================
# Stage 2: The "Production" Stage
# =============================================================================
# Start from the same clean, lightweight base image
FROM node:22-trixie-slim

WORKDIR /app

# --- Security Best Practice: Create user early ---
# Create a dedicated user and group for the application BEFORE copying files
RUN groupadd --system appgroup && \
    useradd --system --gid appgroup appuser

# Copy package manifests and set ownership in one step
COPY --chown=appuser:appgroup package*.json ./

# Install ONLY production dependencies, skipping devDependencies
RUN HUSKY=0 npm install --omit=dev

# Copy the compiled code from the "builder" stage with proper ownership
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist

# Create logs directory with proper ownership
RUN mkdir -p logs && chown appuser:appgroup logs

# Switch to the new user
USER appuser
# --- End Security Best Practice ---

# Expose the port the application will run on
# This is documentation; the actual port mapping is done in docker-compose or `docker run`
EXPOSE 3000

# The command to start the application, taken from your package.json "start" script
# We use the array form, which is the preferred syntax for CMD
CMD [ "node", "dist/app/index.js" ]