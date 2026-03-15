#!/bin/bash

# VoicePilot Deployment Script
# Usage: ./deploy.sh [PROJECT_ID]

set -e

PROJECT_ID=${1:-"voicepilot-hackathon"}
REGION="us-central1"
SERVICE_NAME="voicepilot-backend"

echo "🚀 VoicePilot Deployment Script"
echo "================================"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi

# Set project
echo "📋 Setting GCP project..."
gcloud config set project $PROJECT_ID

# Enable APIs
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Build and push container
echo "🐳 Building container image..."
cd backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --concurrency 80 \
  --max-instances 10 \
  --min-instances 0

# Get service URL
echo "🔗 Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo ""
echo "✅ Deployment Complete!"
echo "======================"
echo "Service URL: $SERVICE_URL"
echo ""
echo "Test endpoints:"
echo "  Health: $SERVICE_URL/health"
echo "  Ready:  $SERVICE_URL/ready"
echo ""
echo "Update your frontend .env file:"
echo "  VITE_BACKEND_URL=$SERVICE_URL"