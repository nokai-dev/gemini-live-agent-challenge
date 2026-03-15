# VoicePilot Backend

AI-powered frontend development assistant backend. Processes screenshots + voice commands to generate code changes.

## Features

- 🎙️ **Voice Command Processing**: Understands natural language commands
- 📸 **Screenshot Analysis**: Identifies UI elements from screen captures
- 🤖 **Gemini AI Integration**: Uses Google's Gemini Live API for multimodal understanding
- 📝 **Code Generation**: Generates React/styled-components code changes
- ☁️ **Cloud Run Ready**: Deployed on Google Cloud Run
- 📚 **API Documentation**: Interactive Swagger UI at `/api-docs`
- 🔍 **Request Correlation IDs**: Track requests across logs with `x-request-id` headers
- 📝 **Structured Logging**: JSON-formatted logs with timestamps and metadata
- 🛡️ **Rate Limiting**: 100 requests per 15 minutes per IP (health checks excluded)

## API Endpoints

### GET /api-docs

Interactive API documentation powered by Swagger UI. Explore all endpoints, schemas, and test requests directly in the browser.

### POST /api/analyze

Analyze a screenshot + audio command and return code changes.

**Request:**
```json
{
  "screenshot": "base64_encoded_image",
  "audio": "base64_encoded_audio",
  "selection": {
    "x": 100,
    "y": 200,
    "width": 150,
    "height": 50
  }
}
```

**Response:**
```json
{
  "targetFile": "src/components/Button.tsx",
  "codeChange": "background-color: #3b82f6;",
  "description": "Change button background to blue",
  "confidence": 0.92,
  "element": "button",
  "intent": "change color to blue"
}
```

### POST /api/analyze/apply

Apply a code change to the file system.

**Request:**
```json
{
  "filePath": "src/components/Button.tsx",
  "codeChange": "background-color: #3b82f6;"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully applied changes to src/components/Button.tsx"
}
```

### POST /api/analyze/demo

Demo endpoint with hardcoded responses for testing.

**Request:**
```json
{
  "demoType": "button-blue"
}
```

Available demo types:
- `button-blue`: Change button to blue
- `card-padding`: Add padding to card
- `text-bigger`: Increase font size
- `grid-layout`: Change to grid layout

### GET /health

Health check endpoint.

## Demo Commands

The backend supports these voice commands:

| Command | Element | Result |
|---------|---------|--------|
| "make this blue" | button | `background-color: #3b82f6;` |
| "add padding" | card | `padding: 1rem;` |
| "bigger font" | text | `font-size: 1.25rem;` |
| "grid layout" | container | `display: grid; grid-template-columns: repeat(3, 1fr);` |

## Setup

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Google Cloud credentials
```

3. Run in development mode:
```bash
npm run dev
```

### Build

```bash
npm run build
npm start
```

### Deploy to Cloud Run

1. Build and push the container:
```bash
gcloud builds submit --config cloudbuild.yaml
```

2. Or deploy manually:
```bash
# Build container
docker build -t gcr.io/PROJECT_ID/voicepilot-backend .

# Push to Container Registry
docker push gcr.io/PROJECT_ID/voicepilot-backend

# Deploy to Cloud Run
gcloud run deploy voicepilot-backend \
  --image gcr.io/PROJECT_ID/voicepilot-backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8080 |
| `GOOGLE_CLOUD_PROJECT` | GCP Project ID | - |
| `GOOGLE_CLOUD_LOCATION` | GCP Region | us-central1 |
| `NODE_ENV` | Environment | production |
| `ALLOWED_ORIGINS` | CORS origins | - |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Screenshot │     │    Audio    │     │ Selection │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Gemini    │
                    │   Live API  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Code      │
                    │  Generator  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Code Change │
                    │  Response   │
                    └─────────────┘
```

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **AI**: Google Gemini Live API (Vertex AI)
- **Deployment**: Google Cloud Run
- **Container**: Docker

## License

MIT
