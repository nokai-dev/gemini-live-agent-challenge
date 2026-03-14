#!/bin/bash
# Build OCI image for FocusCompanion
# Usage: ./build-oci.sh [tag]

set -e

TAG=${1:-latest}
IMAGE_NAME="focuscompanion"

echo "Building OCI image: ${IMAGE_NAME}:${TAG}"

# Check for available builder
if command -v docker &> /dev/null; then
    BUILDER="docker"
elif command -v podman &> /dev/null; then
    BUILDER="podman"
else
    echo "Error: No OCI builder found. Install Docker or Podman."
    exit 1
fi

echo "Using builder: $BUILDER"

# Build image
$BUILDER build -f deployment/Dockerfile -t ${IMAGE_NAME}:${TAG} -t ${IMAGE_NAME}:latest .

echo ""
echo "✅ Build complete!"
echo ""
echo "To run locally:"
echo "  $BUILDER run -p 8080:8080 -e GEMINI_API_KEY=your_key ${IMAGE_NAME}:latest"
echo ""
echo "To save as tar:"
echo "  $BUILDER save -o focuscompanion-${TAG}.tar ${IMAGE_NAME}:${TAG}"
echo ""
echo "To push to registry:"
echo "  $BUILDER tag ${IMAGE_NAME}:${TAG} ghcr.io/youruser/${IMAGE_NAME}:${TAG}"
echo "  $BUILDER push ghcr.io/youruser/${IMAGE_NAME}:${TAG}"
