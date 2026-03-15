# VoicePilot - Unified Container
# Includes: Backend (FastAPI) + Frontend (React) + Demo Project

# Use Debian-based image instead of Alpine for better ARM64 compatibility
FROM node:20-bookworm AS frontend-builder

WORKDIR /app/frontend
COPY voicepilot/frontend/package*.json ./

# Add verbose logging and retry config for npm ci
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm ci --verbose

COPY voicepilot/frontend/ ./
RUN npm run build

FROM python:3.11-slim-bookworm

WORKDIR /app

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
