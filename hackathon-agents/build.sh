#!/bin/bash
set -e

VERSION="1.0.0"
IMAGE_NAME="hackathon-agent-swarm"

echo "Building $IMAGE_NAME:$VERSION..."

# Build the Docker image
docker build -t $IMAGE_NAME:$VERSION -t $IMAGE_NAME:latest .

echo ""
echo "✅ Build complete!"
echo ""
echo "To run:"
echo "  docker run -e DEVPOST_URL=https://devpost.com/hackathons/... \\"
echo "           -e OPENAI_API_KEY=sk-... \\"
echo "           -v \$(pwd)/output:/app/output \\"
echo "           $IMAGE_NAME:$VERSION"
echo ""
echo "Or use docker-compose:"
echo "  DEVPOST_URL=https://... docker-compose up"
