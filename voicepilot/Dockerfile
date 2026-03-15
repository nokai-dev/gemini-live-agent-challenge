# VoicePilot - Unified Container
# Includes: Backend (FastAPI) + Frontend (React) + Demo Project

FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY voicepilot/frontend/package*.json ./
RUN npm ci

COPY voicepilot/frontend/ ./
RUN npm run build

FROM python:3.11-slim

WORKDIR /app

# Install Node.js for any runtime Node needs (optional)
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Backend setup
COPY voicepilot/backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY voicepilot/backend/src/ ./backend/

# Frontend static files
COPY --from=frontend-builder /app/frontend/dist/ ./static/

# Demo project
COPY voicepilot/demo-project/ ./demo-project/

# Main application
COPY voicepilot/backend/src/main.py ./

EXPOSE 8080

ENV PYTHONUNBUFFERED=1
ENV DEMO_PROJECT_PATH=/app/demo-project
ENV STATIC_FILES_PATH=/app/static

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
