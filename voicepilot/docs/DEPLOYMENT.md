# VoicePilot Deployment Guide

## Overview

This guide covers deploying VoicePilot to Google Cloud Run for the hackathon submission.

## Prerequisites

- Google Cloud account
- gcloud CLI installed and authenticated
- Docker installed (optional, for local testing)
- GitHub account (for CI/CD)

## Quick Deployment

### Option 1: Using the Deploy Script

```bash
# Set your project ID
export PROJECT_ID=your-project-id

# Run the deployment script
./deploy.sh $PROJECT_ID
```

### Option 2: Manual Deployment

#### Step 1: Set up GCP Project

```bash
# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

#### Step 2: Build Container

```bash
cd backend

# Build with Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/voicepilot-backend

# Or build locally with Docker
docker build -t voicepilot-backend .
docker tag voicepilot-backend gcr.io/YOUR_PROJECT_ID/voicepilot-backend
docker push gcr.io/YOUR_PROJECT_ID/voicepilot-backend
```

#### Step 3: Deploy to Cloud Run

```bash
gcloud run deploy voicepilot-backend \
  --image gcr.io/YOUR_PROJECT_ID/voicepilot-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=your_api_key_here" \
  --memory 1Gi \
  --cpu 1 \
  --concurrency 80 \
  --max-instances 10
```

#### Step 4: Get Service URL

```bash
SERVICE_URL=$(gcloud run services describe voicepilot-backend --region us-central1 --format 'value(status.url)')
echo "Service URL: $SERVICE_URL"
```

## Environment Variables

Required environment variables for the backend:

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `PORT` | Server port (default: 8080) | No |
| `HOST` | Server host (default: 0.0.0.0) | No |

## Service Account Setup

### Create Service Account

```bash
# Create service account
gcloud iam service-accounts create voicepilot-sa \
  --display-name="VoicePilot Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:voicepilot-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:voicepilot-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```

### Download Service Account Key

```bash
gcloud iam service-accounts keys create key.json \
  --iam-account=voicepilot-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

**⚠️ Security Note:** Store this key securely and never commit it to version control.

## GitHub Actions CI/CD

### Setup Secrets

In your GitHub repository, add these secrets:

1. Go to Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `GCP_PROJECT_ID`: Your Google Cloud project ID
   - `GCP_SA_KEY`: Contents of the service account key.json file
   - `GEMINI_API_KEY`: Your Gemini API key

### Workflow

The deployment workflow (`.github/workflows/deploy.yml`) will:
1. Run on every push to main
2. Build the container
3. Deploy to Cloud Run
4. Comment the URL on PRs

## Verification

### Test Health Endpoint

```bash
curl https://your-service-url.run.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "VoicePilot",
  "version": "1.0.0",
  "features": {
    "gemini_api": true,
    "voice_interaction": true,
    "screen_analysis": true
  }
}
```

### Test WebSocket Connection

```javascript
const ws = new WebSocket('wss://your-service-url.run.app/ws/voice');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Received:', e.data);
ws.send(JSON.stringify({type: 'ping'}));
```

## Troubleshooting

### Container Build Fails

**Problem:** Build fails with permission error
**Solution:** 
```bash
gcloud auth configure-docker
gcloud auth application-default login
```

### Deployment Fails

**Problem:** Service doesn't start
**Solution:** Check logs:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=voicepilot-backend" --limit=50
```

### WebSocket Connection Fails

**Problem:** Can't connect to WebSocket
**Solution:** Ensure you're using `wss://` (not `ws://`) for HTTPS services

### High Latency

**Problem:** Slow response times
**Solution:** 
- Increase memory: `--memory 2Gi`
- Set minimum instances: `--min-instances 1`

## Cost Optimization

### Free Tier Limits

Google Cloud Run free tier includes:
- 2 million requests per month
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds of compute

### Cost-Saving Tips

1. Use `--min-instances 0` to scale to zero when not in use
2. Set `--max-instances` to limit concurrent costs
3. Use smaller machine types for development

## Monitoring

### View Metrics

```bash
# CPU and memory
gcloud monitoring metrics list --filter="metric.type:run.googleapis.com"

# Request count
gcloud logging read "resource.type=cloud_run_revision" --limit=10
```

### Set up Alerts

```bash
# Create alert for high error rate
gcloud alpha monitoring policies create \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-filter="resource.type=cloud_run_revision AND metric.type=run.googleapis.com/request_count" \
  --condition-comparison=COMPARISON_GT \
  --condition-threshold-value=0.05
```

## Rollback

If deployment fails, rollback to previous version:

```bash
# List revisions
gcloud run revisions list --service=voicepilot-backend

# Rollback to specific revision
gcloud run services update-traffic voicepilot-backend \
  --to-revisions=REVISION_NAME=100
```

## Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Use least privilege** - Grant minimal IAM permissions
3. **Enable audit logging** - Track all API calls
4. **Use VPC connector** - For private resource access
5. **Enable Cloud Armor** - For DDoS protection (production)

## Support

For deployment issues:
1. Check Cloud Run logs in Console
2. Review GitHub Actions logs
3. Verify environment variables are set
4. Test locally before deploying

---

**Next Steps:**
- [ ] Test deployment locally
- [ ] Set up GitHub Actions
- [ ] Configure monitoring
- [ ] Document API endpoints
- [ ] Create demo video