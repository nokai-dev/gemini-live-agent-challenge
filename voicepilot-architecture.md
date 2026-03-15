# VoicePilot — Technical Architecture

## System Overview

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
│                           GOOGLE CLOUD PLATFORM                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         VERTEX AI / GEMINI                              │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    GEMINI LIVE API                                │  │ │
│  │  │                                                                   │  │ │
│  │  │  Input:  [Video Stream] + [Audio Stream]                         │  │ │
│  │  │              ↓                           ↓                        │  │ │
│  │  │         ┌─────────┐                 ┌─────────┐                    │  │ │
│  │  │         │  Vision │                 │  Audio  │                    │  │ │
│  │  │         │  Model  │                 │  Model  │                    │  │ │
│  │  │         └────┬────┘                 └────┬────┘                    │  │ │
│  │  │              └───────────┬───────────────┘                        │  │ │
│  │  │                          ↓                                       │  │ │
│  │  │                   ┌─────────────┐                                  │  │ │
│  │  │                   │ Multimodal  │                                │  │ │
│  │  │                   │  Fusion     │                                │  │ │
│  │  │                   └──────┬──────┘                                │  │ │
│  │  │                          ↓                                       │  │ │
│  │  │  Output: {                                                       │  │ │
│  │  │    "component": "Button",                                        │  │ │
│  │  │    "action": "change_color",                                     │  │ │
│  │  │    "property": "backgroundColor",                                │  │ │
│  │  │    "value": "#3B82F6",                                           │  │ │
│  │  │    "confidence": 0.95                                              │  │ │
│  │  │  }                                                               │  │ │
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

## Component Mapping

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     VISUAL-TO-CODE MAPPING (HARDCODED)                       │
└─────────────────────────────────────────────────────────────────────────────┘

Screen Capture (x, y, width, height)
              │
              ▼
    ┌─────────────────────┐
    │  Coordinate Lookup  │
    │  Table (Hardcoded)  │
    └──────────┬──────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌───────┐  ┌───────┐  ┌───────┐
│Button │  │ Card  │  │ Text  │
│(x,y)  │  │(x,y)  │  │(x,y)  │
└───┬───┘  └───┬───┘  └───┬───┘
    │          │          │
    ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPONENT REGISTRY                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────────────────────────────────────────┐    │
│  │   Button    │───▶│  File: LandingPage.jsx                          │    │
│  │  (Primary)  │    │  Component: <Button variant="primary">         │    │
│  │             │    │  CSS: .btn-primary { background-color: ... }    │    │
│  └─────────────┘    └─────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────┐    ┌─────────────────────────────────────────────────┐    │
│  │   Hero      │───▶│  File: LandingPage.jsx                          │    │
│  │   Section   │    │  Component: <section className="hero">         │    │
│  │             │    │  CSS: .hero { padding: ... }                    │    │
│  └─────────────┘    └─────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────┐    ┌─────────────────────────────────────────────────┐    │
│  │   Heading   │───▶│  File: LandingPage.jsx                          │    │
│  │    (H1)     │    │  Component: <h1 className="hero-title">        │    │
│  │             │    │  CSS: .hero-title { font-size: ... }            │    │
│  └─────────────┘    └─────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────┐    ┌─────────────────────────────────────────────────┐    │
│  │ Feature     │───▶│  File: LandingPage.jsx                          │    │
│  │   Cards     │    │  Component: <div className="feature-grid">     │    │
│  │             │    │  CSS: .feature-grid { display: grid; ... }      │    │
│  └─────────────┘    └─────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## File Structure

```
voicepilot/
├── package.json
├── electron.js                 # Main process entry
├── preload.js                  # IPC bridge
├── src/
│   ├── main/
│   │   ├── index.js            # Main process orchestrator
│   │   ├── screenCapture.js    # desktopCapturer wrapper
│   │   ├── fileSystem.js       # File read/write
│   │   ├── geminiClient.js     # Gemini Live API client
│   │   └── componentRegistry.js # Hardcoded mappings
│   │
│   ├── renderer/
│   │   ├── index.html          # Renderer entry
│   │   ├── index.js            # React root
│   │   ├── App.jsx             # Main React app
│   │   ├── components/
│   │   │   ├── ControlPanel.jsx    # Start/stop, status
│   │   │   ├── PreviewWindow.jsx   # React preview
│   │   │   ├── HighlightOverlay.jsx # Selection visual
│   │   │   └── CommandLog.jsx      # Voice commands
│   │   └── styles/
│   │       └── main.css
│   │
│   └── shared/
│       └── constants.js        # API endpoints, config
│
├── demo/
│   └── LandingPage.jsx         # Hardcoded demo file
│
└── assets/
    └── icons/
```

## API Integration

### Gemini Live API Request

```javascript
// WebSocket connection to Gemini Live API
const ws = new WebSocket('wss://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-live:connect?key=API_KEY');

// Send setup message
ws.send(JSON.stringify({
  setup: {
    model: "models/gemini-1.5-flash-live",
    generation_config: {
      response_modalities: ["TEXT"]
    }
  }
}));

// Stream video frames (base64 encoded)
ws.send(JSON.stringify({
  realtime_input: {
    media_chunks: [{
      mime_type: "image/jpeg",
      data: base64EncodedFrame
    }]
  }
}));

// Stream audio chunks
ws.send(JSON.stringify({
  realtime_input: {
    media_chunks: [{
      mime_type: "audio/pcm",
      data: base64EncodedAudio
    }]
  }
}));
```

### Expected Response Format

```javascript
{
  "component": "Button",           // Identified component
  "componentId": "cta-primary",    // Specific instance
  "action": "change_property",     // Type of change
  "property": "backgroundColor",   // CSS property
  "value": "#3B82F6",              // New value
  "confidence": 0.95,                // AI confidence
  "explanation": "Changing button to blue" // Human-readable
}
```

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Desktop App** | Electron | Cross-platform desktop wrapper |
| **Frontend** | React 18 | UI components, preview window |
| **Build Tool** | Vite | Fast dev server, hot reload |
| **Styling** | CSS Modules | Scoped component styles |
| **AI/ML** | Gemini Live API | Multimodal understanding |
| **Cloud** | Vertex AI | Hosted model endpoint |
| **Audio** | Web Audio API | Microphone capture |
| **Video** | desktopCapturer | Screen region capture |
| **File I/O** | Node.js fs | Read/write JSX files |

## Key Technical Decisions

### 1. Electron over Web App
- **Why:** Needs file system access for code changes
- **Trade-off:** Larger bundle size, but acceptable for demo

### 2. React over Vue/Svelte
- **Why:** Most familiar to judges, best ecosystem
- **Trade-off:** Slightly more boilerplate, but better demo recognition

### 3. Direct File Edit over GitHub API
- **Why:** Zero latency, works offline, no auth complexity
- **Trade-off:** No version control, but demo doesn't need it

### 4. Hardcoded Mappings over AI Detection
- **Why:** Guaranteed accuracy for demo elements
- **Trade-off:** Limited to demo project, but 100% reliable

### 5. CSS Properties over Full Code Generation
- **Why:** Simpler to implement, instant visual feedback
- **Trade-off:** Can't add new components, but demo doesn't need to
