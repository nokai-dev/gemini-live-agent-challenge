# 🔊 Echo-Chamber

**Multi-Agent Crisis Simulation for Gemini Live Agent Challenge**

A real-time crisis simulation where you play the CEO facing a ransomware attack, with 3 AI personas (CTO, PR Head, Hostile Actor) reacting to your decisions.

## 🎬 Demo Video

[90-second demo showing multi-agent chaos, stock crashes, and breaking news]

## 🚀 Quick Start

### Local Development

```bash
# Clone and enter directory
cd echo-chamber

# Start backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# In new terminal, start frontend
cd frontend
npm install
npm start

# Open http://localhost:3000
```

### Docker Compose

```bash
docker-compose up --build
```

### Cloud Run Deployment

```bash
gcloud builds submit --config backend/cloudbuild.yaml
```

## 🏗️ Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   React UI      │ ◄────────────────► │   FastAPI       │
│   (Dashboard)   │                    │   (WebSocket)   │
└─────────────────┘                    └────────┬────────┘
        │                                        │
        │ Stock Ticker                           │ ADK
        │ News Feed                              │ Multi-Agent
        │ Chat Log                               │ Orchestration
        │                                        │
        ▼                                        ▼
┌─────────────────┐                    ┌─────────────────┐
│   User (CEO)    │                    │  3 AI Personas  │
│   Decisions     │                    │  - CTO (Panic)  │
│   Interrupts    │                    │  - PR (Defend)  │
│                 │                    │  - Hostile      │
└─────────────────┘                    └─────────────────┘
```

## 🎭 The 3 Personas

| Role | Voice | Personality | Trigger Words |
|------|-------|-------------|---------------|
| **CTO** | Panicked, fast | Technical, catastrophic thinker | "encryption", "backups", "military-grade" |
| **PR Head** | Defensive, measured | Reputation-focused, risk-averse | "narrative", "crater", "control" |
| **Hostile Actor** | Threatening, slow | Calculated, menacing | "tick tock", "partnership", "consequences" |

## 📊 Crisis Flow

```
START
  │
  ▼
CTO: "CODE RED - Database encrypted"
  │
  ▼
PR Head: "Control the narrative"
  │
  ▼
Hostile Actor: "500 Bitcoin. 24 hours."
  │
  ▼
CTO: "Pay them NOW"
  │
  ▼
PR Head: "Stock will crater"
  │
  ▼
┌─────────────────────────────────────┐
│         CEO DECISION POINT          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │Pay      │ │Contact  │ │Negotiate│ │
│  │Ransom   │ │FBI      │ │         │ │
│  └────┬────┘ └────┬────┘ └────┬────┘ │
│       │           │           │      │
│       ▼           ▼           ▼      │
│   [Branch A] [Branch B] [Branch C]   │
│   Stock -5%  Stock -15% Stock -10%   │
└─────────────────────────────────────┘
```

## 🎮 Features

- **Real-time WebSocket**: Instant agent responses
- **Interrupt System**: Cut off agents mid-sentence
- **Stock Ticker**: Live market reaction to decisions
- **Breaking News**: Dynamic news feed based on events
- **4 Decision Branches**: Each with unique consequences
- **90-Second Demo**: Pre-scripted for hackathon presentation

## 🛠️ Tech Stack

- **Backend**: FastAPI + WebSocket
- **Frontend**: React + CSS Grid
- **Orchestration**: ADK-style multi-agent system
- **Deployment**: Cloud Run + Docker
- **State**: In-memory (Firestore-ready)

## 📁 Project Structure

```
echo-chamber/
├── backend/
│   ├── main.py              # FastAPI + WebSocket
│   ├── agents.py            # ADK orchestrator + 3 personas
│   ├── models.py            # Pydantic models
│   ├── requirements.txt
│   ├── Dockerfile
│   └── cloudbuild.yaml      # GCP deployment
├── frontend/
│   ├── src/
│   │   ├── App.js           # Dashboard UI
│   │   ├── App.css          # Dark theme styles
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── demo/
│   └── script.md            # 90-second demo script
├── docker-compose.yml
└── README.md
```

## 🎯 Demo Script

See `demo/script.md` for the 90-second presentation script.

**Key Moments:**
- 0:10 - Crisis begins (3 agents enter)
- 0:40 - CEO decision point
- 0:55 - Consequences unfold
- 1:15 - Stock crashes, news breaks

## 🔮 Future Enhancements

- [ ] Gemini Live API integration for real voice
- [ ] Firestore for persistent state
- [ ] More crisis scenarios (supply chain, PR disaster)
- [ ] Voice interruption handling
- [ ] Multiplayer CEO mode

## 📄 License

MIT - Built for Gemini Live Agent Challenge