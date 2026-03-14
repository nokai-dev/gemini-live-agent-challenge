# FocusCompanion 🎯

An AI-powered focus coach that uses Gemini Live API to help you maintain deep work sessions through real-time voice interaction and screen awareness.

![FocusCompanion Demo](https://img.shields.io/badge/demo-live-brightgreen)
![Gemini Live API](https://img.shields.io/badge/Gemini-Live%20API-blue)
![Cloud Run](https://img.shields.io/badge/Cloud%20Run-deployed-orange)

## ✨ Features

- **🎙️ Real-time Voice Chat**: Natural conversation with bidirectional audio streaming
- **👁️ Screen Awareness**: Periodic screen analysis to understand your context
- **🧠 Smart Interruption Detection**: Distinguishes between productive work and distractions
- **💬 Contextual Coaching**: Gentle reminders and encouragement based on your activity
- **⏱️ Focus Sessions**: Pomodoro-style timed sessions with adaptive check-ins
- **🔒 Privacy-First**: Screen data is analyzed in real-time, never stored

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js (optional, for local development)
- Google Cloud account (for deployment)
- Gemini API key

### Local Development

1. **Clone the repository:**
```bash
git clone <repository-url>
cd gemini-live-agent-challenge
```

2. **Set up environment:**
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Create .env file
cat > .env << EOF
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CLOUD_PROJECT=your_project_id
ENVIRONMENT=development
EOF
```

3. **Run the application:**
```bash
# From the project root
python -m backend.main
```

4. **Open your browser:**
Navigate to `http://localhost:8080`

### Using the Application

1. **Start a Focus Session:**
   - Enter what you're working on (e.g., "Writing a report")
   - Select duration (15, 25, 45, or 60 minutes)
   - Click "Connect & Start"

2. **Grant Permissions:**
   - Allow microphone access for voice chat
   - Allow screen capture for context awareness (optional but recommended)

3. **During Your Session:**
   - Speak naturally to FocusCompanion
   - Click the microphone icon to interrupt
   - Screen is analyzed periodically (adaptive rate)

4. **Voice Commands:**
   - "Focus mode" - Start a session
   - "Pause" - Pause the session
   - "Resume" - Resume the session
   - "Done" - End the session

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FocusCompanion                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser    │◄───────►│   Cloud Run  │◄───────►│  Gemini     │
│   (Client)   │  WS     │   (FastAPI)  │  WS     │  Live API   │
└──────────────┘         └──────┬───────┘         └─────────────┘
                                │
                                ▼
                         ┌──────────────┐
                         │  Vision API  │
                         │  (Screen     │
                         │   Analysis)  │
                         └──────────────┘
```

### Components

- **Frontend**: Vanilla JavaScript with Web Audio API and Canvas API
- **Backend**: FastAPI with WebSocket support
- **AI**: Gemini Live API for voice, Gemini Vision API for screen analysis
- **Deployment**: Google Cloud Run with auto-scaling

## 📁 Project Structure

```
gemini-live-agent-challenge/
├── backend/
│   ├── main.py                 # FastAPI entry point
│   ├── config.py               # Configuration settings
│   ├── requirements.txt        # Python dependencies
│   ├── api/
│   │   └── websocket.py        # WebSocket handlers
│   ├── services/
│   │   ├── gemini_live.py      # Gemini Live API client
│   │   ├── vision_analyzer.py  # Screen analysis
│   │   └── interruption_detector.py  # Interruption logic
│   └── models/
│       └── session.py          # Session state models
├── frontend/
│   ├── index.html              # Main UI
│   └── static/
│       ├── css/
│       │   └── style.css       # Styling
│       └── js/
│           ├── app.js          # Main application
│           ├── audio.js        # Audio capture/playback
│           ├── screen.js       # Screen capture
│           └── websocket.js    # WebSocket client
├── deployment/
│   ├── Dockerfile              # Container definition
│   ├── cloud-run.yaml          # Cloud Run configuration
│   └── deploy.sh               # Deployment script
└── README.md                   # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Your Gemini API key | Yes |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID | For deployment |
| `ENVIRONMENT` | `development` or `production` | No |
| `PORT` | Server port (default: 8080) | No |

### Screen Capture Settings

Screen capture uses adaptive intervals:

- **Focused**: Every 60 seconds, lower quality
- **Distracted**: Every 10 seconds, higher quality
- **Normal**: Every 30 seconds, medium quality

## 🚀 Deployment

### Prerequisites

- Google Cloud SDK (`gcloud`) installed
- Docker installed
- GCP project with billing enabled

### Deploy to Cloud Run

1. **Run the deployment script:**
```bash
cd deployment
./deploy.sh YOUR_PROJECT_ID
```

2. **Or deploy manually:**
```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Build and deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/focuscompanion
gcloud run deploy focuscompanion \
  --image gcr.io/YOUR_PROJECT_ID/focuscompanion \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=your_key"
```

### Cloud Run Configuration

The service is configured with:
- **Memory**: 2GB
- **CPU**: 2 cores
- **Concurrency**: 1000 concurrent connections
- **Timeout**: 1 hour (for long focus sessions)
- **Min instances**: 0 (scales to zero when idle)
- **Max instances**: 10

## 🧪 Testing

### Local Testing

```bash
# Run the server
python -m backend.main

# In another terminal, test the health endpoint
curl http://localhost:8080/health

# Test WebSocket connection (requires wscat or similar)
```

### Screen Capture Testing

1. Open the application in browser
2. Start a focus session
3. Grant screen capture permission
4. Switch between productive apps and distracting sites
5. Verify FocusCompanion detects changes

## 🎨 Customization

### Changing the Voice

Edit `backend/services/gemini_live.py`:

```python
config = types.LiveConnectConfig(
    response_modalities=["AUDIO"],
    speech_config=types.SpeechConfig(
        voice_config=types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                voice_name="Charon"  # Change this
            )
        )
    ),
)
```

Available voices: `Charon`, `Aoede`, `Fenrir`, `Kore`, `Puck`

### Adjusting Interruption Sensitivity

Edit `backend/services/interruption_detector.py`:

```python
# Thresholds
self.distraction_threshold_seconds = 120  # Time before alerting
self.inactivity_threshold_seconds = 300  # Inactivity timeout
self.interruption_cooldown = 30  # Seconds between interruptions
```

## 🔒 Privacy & Security

- **Screen data**: Analyzed in real-time, never stored
- **Audio**: Streamed directly to Gemini API, not recorded
- **No persistent storage**: Session data is in-memory only
- **HTTPS only**: All communications encrypted
- **User control**: Can pause screen capture at any time

## 🐛 Troubleshooting

### WebSocket Connection Issues

**Problem**: Connection drops frequently

**Solution**:
- Check firewall settings
- Ensure WebSocket support is enabled
- For Cloud Run: Use `--execution-environment gen2`

### Screen Capture Not Working

**Problem**: "Screen capture not available" message

**Solution**:
- Use Chrome or Edge (best support for getDisplayMedia)
- Ensure you're on HTTPS (required for screen capture)
- Check browser permissions

### Audio Quality Issues

**Problem**: Choppy or delayed audio

**Solution**:
- Check network connection
- Reduce concurrent connections
- Adjust audio buffer size in `audio.js`

### High API Costs

**Problem**: Excessive Gemini API usage

**Solution**:
- Increase screen capture intervals
- Reduce image quality
- Set `autoscaling.knative.dev/minScale: "0"` to scale to zero

## 📊 Monitoring

### View Logs

```bash
# Local development
python -m backend.main 2>&1 | tee focuscompanion.log

# Cloud Run
gcloud logging tail -s focuscompanion --region=us-central1
```

### Metrics

Monitor these key metrics in Cloud Console:
- Request latency
- Active connections
- Error rates
- API quota usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Gemini Live API](https://ai.google.dev/)
- Deployed on [Google Cloud Run](https://cloud.google.com/run)
- Inspired by the need for better focus tools in a distracted world

## 📞 Support

For issues and feature requests, please open an issue on GitHub.

---

**Happy focusing! 🎯**