# VoicePilot

**AI-Powered Code Editing via Voice and Screen Capture**

[![Backend Tests](https://github.com/nokai-dev/voicepilot/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/nokai-dev/voicepilot/actions)
[![codecov](https://codecov.io/gh/nokai-dev/voicepilot/graph/badge.svg?token=YOUR_TOKEN)](https://codecov.io/gh/nokai-dev/voicepilot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

VoicePilot is an Electron-based desktop application that enables developers to edit React code using natural voice commands and screen capture analysis powered by Google's Gemini Live API.

## 🎯 Project Overview

VoicePilot bridges the gap between visual design intent and code implementation by allowing developers to:
- **Speak** natural language commands ("Make this button blue")
- **Point** at UI elements on screen
- **See** instant code changes reflected in a live preview

### Key Features

- 🎤 **Voice Commands**: Natural language code editing
- 👁️ **Screen Analysis**: AI understands visual context
- ⚡ **Real-time Preview**: Instant visual feedback
- 🔧 **React Integration**: Direct JSX file modification
- 🎨 **Component Registry**: Hardcoded mappings for demo reliability

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     VOICEPILOT ELECTRON APP                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    MAIN PROCESS (Node.js)                 │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │   Window     │  │   Screen     │  │    File      │   │  │
│  │  │   Manager    │  │   Capture    │  │   System     │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                        IPC Communication                        │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  RENDERER PROCESS (React)                 │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              Control Panel UI                      │  │  │
│  │  │  ┌──────────────┐  ┌──────────────┐              │  │  │
│  │  │  │ Start/Stop   │  │   Status     │              │  │  │
│  │  │  │   Capture    │  │   Display    │              │  │  │
│  │  │  └──────────────┘  └──────────────┘              │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GOOGLE CLOUD RUN                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    FASTAPI BACKEND                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │   Health     │  │  WebSocket   │  │   Code       │   │  │
│  │  │   Check      │  │   Handler    │  │   Modify     │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GEMINI LIVE API (Google)                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Input: Video Stream + Audio Stream                      │  │
│  │  Output: Code modification commands                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
voicepilot/
├── backend/
│   ├── src/
│   │   └── main.py              # FastAPI application
│   ├── Dockerfile               # Container configuration
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── main/                # Electron main process
│   │   │   ├── main.ts
│   │   │   └── preload.ts
│   │   └── renderer/            # React UI
│   │       ├── components/
│   │       ├── styles/
│   │       ├── App.tsx
│   │       └── index.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.*.json
├── demo-project/
│   └── LandingPage.html         # Demo React app
├── docs/
│   └── architecture.png         # Architecture diagram
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Google Cloud account with Gemini API access
- Docker (for deployment)

### Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8080
HOST=0.0.0.0
```

### Running Locally

#### 1. Start the Backend

```bash
cd voicepilot/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/main.py
```

The backend will start on `http://localhost:8080`.

#### 2. Start the Frontend

```bash
cd voicepilot/frontend
npm install
npm run dev
```

The Electron app will launch automatically.

## 🐳 Deployment to Google Cloud Run

### Step 1: Set up GCP Project

```bash
# Set your project ID
export PROJECT_ID=your-project-id
export REGION=us-central1

# Authenticate
gcloud auth login
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### Step 2: Build and Push Container

```bash
cd voicepilot/backend

# Build the container
gcloud builds submit --tag gcr.io/$PROJECT_ID/voicepilot-backend

# Or use Docker directly
docker build -t gcr.io/$PROJECT_ID/voicepilot-backend .
docker push gcr.io/$PROJECT_ID/voicepilot-backend
```

### Step 3: Deploy to Cloud Run

```bash
# Deploy the service
gcloud run deploy voicepilot-backend \
  --image gcr.io/$PROJECT_ID/voicepilot-backend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=your_api_key" \
  --memory 1Gi \
  --cpu 1 \
  --concurrency 80 \
  --max-instances 10
```

### Step 4: Update Frontend

Update the `VITE_BACKEND_URL` in `frontend/.env`:

```bash
VITE_BACKEND_URL=wss://your-service-url.run.app
```

Then rebuild the frontend:

```bash
cd voicepilot/frontend
npm run package
```

## 📦 Building for Distribution

### macOS

```bash
cd voicepilot/frontend
npm run package
# Output: release/VoicePilot-1.0.0.dmg
```

### Windows

```bash
cd voicepilot/frontend
npm run package
# Output: release/VoicePilot Setup 1.0.0.exe
```

### Linux

```bash
cd voicepilot/frontend
npm run package
# Output: release/VoicePilot-1.0.0.AppImage
```

## 🔌 API Endpoints

### Health Check

```bash
GET /health

Response:
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

### WebSocket Voice Session

```bash
WS /ws/voice

Message Types:
- { "type": "audio", "data": "base64_audio" }
- { "type": "screen", "data": "base64_image" }
- { "type": "command", "data": "voice command text" }
- { "type": "ping" }

Response:
{ 
  "type": "modification",
  "component": "Button",
  "action": "change_color",
  "property": "backgroundColor",
  "value": "#3B82F6",
  "confidence": 0.95
}
```

### Code Modification

```bash
POST /api/modify

Request:
{
  "file": "LandingPage.jsx",
  "component": "Button",
  "property": "backgroundColor",
  "value": "#3B82F6"
}

Response:
{
  "success": true,
  "modification": {
    "file": "LandingPage.jsx",
    "component": "Button",
    "property": "backgroundColor",
    "oldValue": "#6B7280",
    "newValue": "#3B82F6"
  }
}
```

## 🎬 Demo Script

### 90-Second Demo Flow

1. **Opening (0-10s)**
   - Show VoicePilot control panel
   - "Meet VoicePilot - edit code with your voice"

2. **Problem (10-25s)**
   - Show traditional coding workflow
   - Switching between editor, browser, design tools
   - "Constant context switching kills flow"

3. **Solution (25-60s)**
   - Click "Start Session"
   - Speak: "Make the button blue"
   - Show screen capture highlighting the button
   - Show code change and instant preview update
   - Speak: "Add more padding to the hero section"
   - Show the change applied

4. **Magic Moment (60-80s)**
   - Speak: "Make the title bigger"
   - AI understands context, makes precise change
   - "No keyboard, no mouse, just your voice"

5. **Future (80-90s)**
   - "VoicePilot - The future of code editing"
   - Show GitHub repo and deployed URL

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Desktop App** | Electron 28 | Cross-platform wrapper |
| **Frontend** | React 18 + TypeScript | UI components |
| **Build Tool** | Vite | Fast development |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Backend** | FastAPI + Python 3.11 | API server |
| **AI/ML** | Gemini Live API | Multimodal understanding |
| **Cloud** | Google Cloud Run | Serverless hosting |
| **Container** | Docker | Deployment packaging |

## 📝 Development Notes

### Backend Development

```bash
cd voicepilot/backend

# Run with auto-reload
uvicorn src.main:app --reload --port 8080

# Run tests
pytest tests/
```

### Frontend Development

```bash
cd voicepilot/frontend

# Development mode
npm run dev

# Build for production
npm run build

# Package Electron app
npm run package
```

## 🔧 Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError: No module named 'fastapi'`
**Solution**: Run `pip install -r requirements.txt`

**Problem**: `WebSocket connection failed`
**Solution**: Check that `GEMINI_API_KEY` is set and backend is running

### Frontend Issues

**Problem**: `Cannot find module 'electron'`
**Solution**: Run `npm install` in the frontend directory

**Problem**: White screen after packaging
**Solution**: Check that all files are included in `package.json` build.files

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Built for the Gemini Live API Challenge
- Powered by Google's Gemini Live API
- Electron + React + FastAPI stack

## 🔗 Links

- **Live Backend**: https://voicepilot-backend-[PROJECT_ID].run.app
- **GitHub Repo**: https://github.com/[USERNAME]/voicepilot
- **Demo Video**: [YouTube Link]

---

**Built with ❤️ for the Gemini Live API Challenge**