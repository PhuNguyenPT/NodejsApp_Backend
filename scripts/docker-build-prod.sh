#!/bin/bash
# docker-build-prod.sh - Build multi-arch with cache (no push)

set -e

IMAGE_NAME="phunpt01/nodejs-backend"
VERSION="v$(date +%Y%m%d)"
CACHE_DIR="/tmp/docker-cache"

echo "🏗️  Building Docker image with cache..."
mkdir -p "$CACHE_DIR"

# Build for local testing (amd64)
echo "📦 Building for local testing..."
docker buildx build \
  --platform linux/amd64 \
  -t "$IMAGE_NAME:latest" \
  --cache-from type=local,src="$CACHE_DIR" \
  --cache-to type=local,dest="$CACHE_DIR",mode=max \
  --load \
  .

echo "✅ Build complete! Image ready for testing."
echo "📦 Tagged as:"
echo "   - $IMAGE_NAME:latest"
echo ""
echo "🧪 To test locally: docker run --rm $IMAGE_NAME:latest node --version"
echo "🚀 To push: ./scripts/docker-push-prod.sh"
echo "🐳 To deploy: ./scripts/docker-compose-prod.sh"