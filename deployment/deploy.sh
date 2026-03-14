#!/bin/bash
# Deployment script for FocusCompanion to Google Cloud Run
# Usage: ./deploy.sh [PROJECT_ID]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${1:-""}
REGION="us-central1"
SERVICE_NAME="focuscompanion"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Validate project ID
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: PROJECT_ID is required${NC}"
    echo "Usage: ./deploy.sh PROJECT_ID"
    echo "Example: ./deploy.sh my-project-123"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  FocusCompanion Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Please install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
echo -e "${YELLOW}Checking gcloud authentication...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo -e "${RED}Error: Not authenticated with gcloud${NC}"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set project
echo -e "${YELLOW}Setting project to $PROJECT_ID...${NC}"
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable run.googleapis.com || true
gcloud services enable cloudbuild.googleapis.com || true
gcloud services enable secretmanager.googleapis.com || true
gcloud services enable aiplatform.googleapis.com || true

# Check if .env file exists
if [ ! -f "../.env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create a .env file with GEMINI_API_KEY"
    exit 1
fi

# Source .env file
export $(grep -v '^#' ../.env | xargs)

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${RED}Error: GEMINI_API_KEY not found in .env file${NC}"
    exit 1
fi

# Store API key in Secret Manager
echo -e "${YELLOW}Setting up Secret Manager...${NC}"
if ! gcloud secrets describe gemini-api-key &> /dev/null; then
    echo -e "${YELLOW}Creating secret for Gemini API key...${NC}"
    echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key \
        --data-file=- \
        --replication-policy="automatic"
else
    echo -e "${YELLOW}Updating secret for Gemini API key...${NC}"
    echo -n "$GEMINI_API_KEY" | gcloud secrets versions add gemini-api-key \
        --data-file=-
fi

# Grant Cloud Run service account access to secret
echo -e "${YELLOW}Granting service account access to secret...${NC}"
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud secrets add-iam-policy-binding gemini-api-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" || true

# Build and push Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
cd ..
docker build -f deployment/Dockerfile -t "${IMAGE_NAME}:latest" .
docker push "${IMAGE_NAME}:latest"
cd deployment

# Update cloud-run.yaml with project ID
echo -e "${YELLOW}Preparing deployment configuration...${NC}"
sed -e "s/PROJECT_ID/${PROJECT_ID}/g" cloud-run.yaml > cloud-run-deploy.yaml

# Deploy to Cloud Run
echo -e "${YELLOW}Deploying to Cloud Run...${NC}"
gcloud run services replace cloud-run-deploy.yaml --region="$REGION"

# Get service URL
echo -e "${YELLOW}Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --format="value(status.url)")

# Clean up temporary file
rm -f cloud-run-deploy.yaml

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Service URL: ${GREEN}${SERVICE_URL}${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Visit the URL above to test your deployment"
echo "2. Check logs with: gcloud logging tail -s ${SERVICE_NAME}"
echo "3. Monitor the service at: https://console.cloud.google.com/run"
echo ""
echo -e "${GREEN}Happy focusing! 🎯${NC}"