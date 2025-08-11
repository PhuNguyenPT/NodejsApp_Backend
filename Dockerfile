# =============================================================================
# Stage 1: The "Builder" Stage
# =============================================================================
# Use the specific Node.js version from your package.json and .nvmrc
FROM node:22.17.0-bookworm-slim AS builder

# Set the working directory inside the container
WORKDIR /app

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
FROM node:22.17.0-bookworm-slim

WORKDIR /app

# Copy the package manifests again
COPY package*.json ./

# Install ONLY production dependencies, skipping devDependencies
RUN npm install --omit=dev --ignore-scripts

# Copy the compiled code from the "builder" stage
COPY --from=builder /app/dist ./dist

RUN mkdir -p logs

# Copy the public/private keys if they are needed in the container
# Note: A more secure method is to use Docker secrets or inject them as env vars
COPY public.pem ./
COPY private.pem ./

# --- Security Best Practice: Run as a non-root user ---
# Create a dedicated user and group for the application
RUN groupadd --system appgroup && \
    useradd --system --gid appgroup appuser

# FIX: Change ownership of all necessary app files to the new user
RUN chown -R appuser:appgroup /app/logs ./public.pem ./private.pem

# Switch to the new user
USER appuser
# --- End Security Best Practice ---

# Expose the port the application will run on
# This is documentation; the actual port mapping is done in docker-compose or `docker run`
EXPOSE 3000

# The command to start the application, taken from your package.json "start" script
# We use the array form, which is the preferred syntax for CMD
CMD [ "node", "dist/app/index.js" ]