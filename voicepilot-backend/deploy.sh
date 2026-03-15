#!/bin/bash

# VoicePilot Backend Deployment Script for Google Cloud Run

set -e

echo "🚀 VoicePilot Backend Deployment"
echo "================================="
echo ""

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-your-project-id}"
SERVICE_NAME="voicepilot-backend"
REGION="${GOOGLE_CLOUD_REGION:-us-central1}"
IMAGE_TAG="${1:-latest}"

echo "Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Service Name: $SERVICE_NAME"
echo "  Region: $REGION"
echo "  Image Tag: $IMAGE_TAG"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "Please install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
echo "🔐 Checking gcloud authentication..."
gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1
if [ $? -ne 0 ]; then
    echo "❌ Error: Not authenticated with gcloud"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set project
echo "📁 Setting project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com || true
gcloud services enable cloudbuild.googleapis.com || true
gcloud services enable vertexai.googleapis.com || true

# Build and push container
echo "📦 Building container image..."
gcloud builds submit --tag "gcr.io/$PROJECT_ID/$SERVICE_NAME:$IMAGE_TAG"

# Deploy to Cloud Run
echo "☁️  Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "gcr.io/$PROJECT_ID/$SERVICE_NAME:$IMAGE_TAG" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_LOCATION=$REGION" \
  --memory 512Mi \
  --cpu 1 \
  --concurrency 80 \
  --max-instances 10 \
  --timeout 300

# Get service URL
echo ""
echo "✅ Deployment complete!"
echo ""
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format="value(status.url)")
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "Test the API:"
echo "  curl $SERVICE_URL/health"
echo ""
