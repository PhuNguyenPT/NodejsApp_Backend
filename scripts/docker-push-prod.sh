#!/bin/bash
# docker-push-prod.sh - Build multi-arch and push to registry

set -e

IMAGE_NAME="phunpt01/nodejs-backend"
VERSION="v$(date +%Y%m%d)"
CACHE_DIR="/tmp/docker-cache"
PLATFORMS="linux/amd64,linux/arm64"

echo "🚀 Building multi-arch and pushing to Docker Hub..."

# Check if mybuilder exists and is usable
BUILDER_EXISTS=false
if docker buildx inspect mybuilder >/dev/null 2>&1; then
    BUILDER_EXISTS=true
fi

if [ "$BUILDER_EXISTS" = false ]; then
    echo "📦 Creating buildx builder..."
    docker buildx create --name mybuilder --driver docker-container --use --bootstrap
else
    echo "📦 Using existing buildx builder..."
    docker buildx use mybuilder
fi

# Build and push multi-arch images
echo "📦 Building for platforms: $PLATFORMS"
docker buildx build \
  --platform "$PLATFORMS" \
  -t "$IMAGE_NAME:latest" \
  -t "$IMAGE_NAME:$VERSION" \
  --cache-from type=local,src="$CACHE_DIR" \
  --cache-to type=inline \
  --push \
  .

echo "✅ Multi-arch images pushed to Docker Hub!"
echo "📦 Available on:"
echo "    - $IMAGE_NAME:latest"
echo "    - $IMAGE_NAME:$VERSION"
echo ""
echo "🌐 Deploy on server with: ./scripts/docker-compose-prod.sh"