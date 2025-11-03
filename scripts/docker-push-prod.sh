#!/bin/bash
# docker-push-prod.sh - Build multi-arch and push to registry

set -e

IMAGE_NAME="phunpt01/nodejs-backend"
VERSION="v$(date +%Y%m%d)"
CACHE_DIR="/tmp/docker-cache"
PLATFORMS="linux/amd64,linux/arm64"

echo "🚀 Building multi-arch and pushing to Docker Hub..."

docker buildx build \
  --platform "$PLATFORMS" \
  -t "$IMAGE_NAME:latest" \
  -t "$IMAGE_NAME:$VERSION" \
  --cache-from type=local,src="$CACHE_DIR" \
  --push \
  .

echo "✅ Multi-arch images pushed to Docker Hub!"
echo "📦 Available on:"
echo "   - $IMAGE_NAME:latest"
echo "   - $IMAGE_NAME:$VERSION"
echo ""
echo "🌐 Deploy on server with: ./scripts/docker-compose-prod.sh"