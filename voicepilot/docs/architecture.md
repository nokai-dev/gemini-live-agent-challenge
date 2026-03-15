# VoicePilot Architecture

## System Overview

VoicePilot is a multimodal AI-powered code editing application that combines:
- Electron desktop app for UI and file system access
- FastAPI backend for WebSocket handling and AI integration
- Google Gemini Live API for voice and vision understanding

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VOICEPILOT ELECTRON APP                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         MAIN PROCESS (Node.js)                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │   Window     │  │   Screen     │  │    File      │  │   Gemini    │ │ │
│  │  │   Manager    │  │   Capture    │  │   System     │  │   Client    │ │ │
│  │  │              │  │   Service    │  │   Service    │  │             │ │ │
│  │  │ • Create     │  │              │  │              │  │ • Connect   │ │ │
│  │  │   windows    │  │ • desktop    │  │ • Read JSX   │  │   to Live   │ │ │
│  │  │ • Manage     │  │  Capturer    │  │ • Write JSX  │  │   API       │ │ │
│  │  │   lifecycle  │  │ • Crop       │  │ • Watch      │  │ • Stream    │ │ │
│  │  │              │  │   highlight  │  │   changes    │  │   video     │ │ │
│  │  │              │  │ • Encode     │  │ • Trigger    │  │ • Stream    │ │ │
│  │  │              │  │   frames     │  │   reload     │  │   audio     │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                              IPC Communication                               │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      RENDERER PROCESS (Chromium)                        │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │ │
│  │  │                      REACT PREVIEW WINDOW                          │  │ │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │  │ │
│  │  │  │   Preview    │  │   Highlight  │  │      Command Log         │ │  │ │
│  │  │  │   Component  │  │   Overlay    │  │                          │ │  │ │
│  │  │  │              │  │   (Canvas)   │  │ • "Make this blue"       │ │  │ │
│  │  │  │ • Live React │  │              │  │ • "Add padding"          │ │  │ │
│  │  │  │   app        │  │ • Draw       │  │ • "Increase font"        │ │  │ │
│  │  │  │ • Hot reload │  │   selection  │  │ • Status indicators      │ │  │ │
│  │  │  │ • Show       │  │ • Visual     │  │                          │ │  │ │
│  │  │  │   changes    │  │   feedback   │  │                          │ │  │ │
│  │  │  └──────────────┘  └──────────────┘  └──────────────────────────┘ │  │ │
│  │  └───────────────────────────────────────────────────────────────────┘  │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │ │
│  │  │                      CONTROL PANEL                               │  │ │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │  │ │
│  │  │  │  Start/Stop  │  │   Status     │  │    Settings (Minimal)  │ │  │ │
│  │  │  │   Capture    │  │   Display    │  │                          │ │  │ │
│  │  │  │              │  │              │  │ • Target file path       │ │  │ │
│  │  │  │ [ 🔴 Start ] │  │  🎤 Listening│  │ • Gemini API key         │ │  │ │
│  │  │  │              │  │  📹 Capturing│  │ • Project directory      │ │  │ │
│  │  │  │ [ ⏹ Stop  ] │  │  🤔 Thinking │  │                          │ │  │ │
│  │  │  │              │  │  ✅ Applied  │  │                          │ │  │ │
│  │  │  └──────────────┘  └──────────────┘  └──────────────────────────┘ │  │ │
│  │  └───────────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ WebSocket / HTTP
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GOOGLE CLOUD RUN                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         FASTAPI BACKEND                                  │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    WebSocket Handler                              │  │ │
│  │  │                                                                   │  │ │
│  │  │  Input:  [Audio Stream] + [Video Stream]                         │  │ │
│  │  │              ↓                           ↓                        │  │ │
│  │  │         ┌─────────┐                 ┌─────────┐                    │  │ │
│  │  │         │  Audio  │                 │  Video  │                    │  │ │
│  │  │         │ Process │                 │ Process │                    │  │ │
│  │  │         └────┬────┘                 └────┬────┘                    │  │ │
│  │  │              └───────────┬───────────────┘                        │  │ │
│  │  │                          ↓                                       │  │ │
│  │  │                   ┌─────────────┐                                  │  │ │
│  │  │                   │  Gemini     │                                │  │ │
│  │  │                   │  Live API   │                                │  │ │
│  │  │                   │  Client     │                                │  │ │
│  │  │                   └──────┬──────┘                                │  │ │
│  │  │                          ↓                                       │  │ │
│  │  │  Output: {                                                       │  │ │
│  │  │    "component": "Button",                                        │  │ │
│  │  │    "action": "change_color",                                     │  │ │
│  │  │    "property": "backgroundColor",                                │  │ │
│  │  │    "value": "#3B82F6",                                           │  │ │
│  │  │    "confidence": 0.95                                            │  │ │
│  │  │  }                                                               │  │ │
│  │  └───────────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/WS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GEMINI LIVE API (Google)                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    MULTIMODAL AI MODEL                                 │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │ │
│  │  │  • Real-time audio understanding                                │  │ │
│  │  │  • Visual screen analysis                                       │  │ │
│  │  │  • Natural language processing                                  │  │ │
│  │  │  • Code generation capabilities                               │  │ │
│  │  └───────────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  USER   │────▶│ HIGHLIGHT│────▶│ CAPTURE │────▶│  GEMINI │────▶│ PARSE   │
│ ACTION  │     │  AREA   │     │ SCREEN  │     │  LIVE   │     │ RESPONSE│
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └────┬────┘
                                                                       │
                                  ┌──────────────────────────────────────┘
                                  ▼
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  USER   │◀────│  PREVIEW│◀────│ RELOAD  │◀────│  WRITE  │◀────│ MODIFY  │
│  SEES   │     │ CHANGE  │     │  REACT  │     │  FILE   │     │   CSS   │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
```

## Technology Stack

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

## Key Design Decisions

### 1. Electron over Web App
- **Why:** Needs file system access for code changes
- **Trade-off:** Larger bundle size, but acceptable for demo

### 2. FastAPI over Flask
- **Why:** Native async support for WebSocket handling
- **Trade-off:** Slightly more verbose, but better performance

### 3. Cloud Run over GKE
- **Why:** Serverless, auto-scaling, pay-per-use
- **Trade-off:** Cold start latency, but cost-effective

### 4. Hardcoded Mappings over AI Detection
- **Why:** Guaranteed accuracy for demo elements
- **Trade-off:** Limited to demo project, but 100% reliable

## Security Considerations

- API keys stored in environment variables
- CORS configured for specific origins
- No sensitive data logged
- WebSocket connections authenticated (future)

## Scalability

- Cloud Run auto-scales based on load
- WebSocket connections distributed across instances
- Stateless backend design
- Container image optimized for fast startup