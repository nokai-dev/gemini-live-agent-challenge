#!/bin/bash
# Build OCI image for Echo-Chamber

set -e

VERSION="${1:-latest}"
IMAGE_NAME="echo-chamber"

echo "Building ${IMAGE_NAME}:${VERSION}..."

# Check for builder
if command -v docker &> /dev/null; then
    BUILDER="docker"
elif command -v podman &> /dev/null; then
    BUILDER="podman"
else
    echo "Error: No OCI builder found"
    exit 1
fi

# Build
$BUILDER build -f backend/Dockerfile -t ${IMAGE_NAME}:${VERSION} .
$BUILDER build -f frontend/Dockerfile -t ${IMAGE_NAME}-frontend:${VERSION} .

echo "✅ Build complete!"
echo ""
echo "To run:"
echo "  docker-compose up"
echo ""
echo "To push to GHCR:"
echo "  docker tag ${IMAGE_NAME}:${VERSION} ghcr.io/nokai-dev/${IMAGE_NAME}:${VERSION}"
echo "  docker push ghcr.io/nokai-dev/${IMAGE_NAME}:${VERSION}"
