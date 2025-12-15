#!/bin/sh
set -e

echo "🔐 Handling Docker secrets..."

# Create directories for copied secrets (as root, before switching user)
mkdir -p /tmp/secrets/keys /tmp/secrets/tls

# Copy secrets to a location the app user can read
if [ -f "/run/secrets/private_key" ]; then
    cp /run/secrets/private_key /tmp/secrets/keys/private.pem
    echo "✓ Copied private key"
fi

if [ -f "/run/secrets/public_key" ]; then
    cp /run/secrets/public_key /tmp/secrets/keys/public.pem
    echo "✓ Copied public key"
fi

if [ -f "/run/secrets/tls_key" ]; then
    cp /run/secrets/tls_key /tmp/secrets/tls/backend.key
    echo "✓ Copied TLS key"
fi

if [ -f "/run/secrets/tls_cert" ]; then
    cp /run/secrets/tls_cert /tmp/secrets/tls/backend.crt
    echo "✓ Copied TLS cert"
fi

if [ -f "/run/secrets/tls_ca" ]; then
    cp /run/secrets/tls_ca /tmp/secrets/tls/ca.crt
    echo "✓ Copied TLS CA"
fi

# Set proper permissions for the app user
chmod -R 644 /tmp/secrets/keys/* /tmp/secrets/tls/* 2>/dev/null || true
chown -R appuser:appgroup /tmp/secrets

echo "✅ Secrets ready"

# Fix logs directory permissions (in case volume mount changed ownership)
echo "📝 Setting up logs directory..."
mkdir -p /app/logs
chown -R appuser:appgroup /app/logs
chmod -R 755 /app/logs
echo "✓ Logs directory ready"

echo "🚀 Starting application as appuser..."

# Switch to appuser and execute the main command
exec gosu appuser "$@"