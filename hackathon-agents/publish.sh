#!/bin/bash
set -e

VERSION="1.0.0"
IMAGE_NAME="hackathon-agent-swarm"
DOCKERHUB_USER="${DOCKERHUB_USER:-yourusername}"

echo "Publishing $IMAGE_NAME:$VERSION to Docker Hub..."
echo "User: $DOCKERHUB_USER"

# Tag for Docker Hub
docker tag $IMAGE_NAME:$VERSION $DOCKERHUB_USER/$IMAGE_NAME:$VERSION
docker tag $IMAGE_NAME:latest $DOCKERHUB_USER/$IMAGE_NAME:latest

# Push
docker push $DOCKERHUB_USER/$IMAGE_NAME:$VERSION
docker push $DOCKERHUB_USER/$IMAGE_NAME:latest

echo ""
echo "✅ Published!"
echo ""
echo "Users can now run:"
echo "  docker pull $DOCKERHUB_USER/$IMAGE_NAME:latest"
echo "  docker run -e DEVPOST_URL=... $DOCKERHUB_USER/$IMAGE_NAME:latest"
