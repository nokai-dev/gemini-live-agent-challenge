# VoicePilot - Unified Container with Extensive Logging
# Includes: Backend (FastAPI) + Frontend (React) + Demo Project

FROM node:20-bookworm AS frontend-builder

WORKDIR /app/frontend

# Log Node version
RUN echo "=== Node Version ===" && node -v && npm -v

COPY voicepilot/frontend/package*.json ./
RUN echo "=== Package.json contents ===" && cat package.json

# Add verbose logging and retry config for npm ci
RUN echo "=== Starting npm ci ===" && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm ci --verbose 2>&1 | tee /tmp/npm-install.log && \
    echo "=== npm ci completed ==="

COPY voicepilot/frontend/ ./
RUN echo "=== Building frontend ===" && \
    npm run build 2>&1 | tee /tmp/npm-build.log && \
    echo "=== Frontend build completed ===" && \
    ls -la /app/frontend/dist/ && \
    echo "=== Dist directory contents ==="

FROM python:3.11-slim-bookworm

WORKDIR /app

# Log Python version
RUN echo "=== Python Version ===" && python --version

# Backend setup
COPY voicepilot/backend/requirements.txt ./
RUN echo "=== Installing Python dependencies ===" && \
    pip install --no-cache-dir -r requirements.txt 2>&1 | tee /tmp/pip-install.log && \
    echo "=== Python dependencies installed ==="

COPY voicepilot/backend/src/ ./backend/

# Frontend static files
# Copy renderer folder contents (the actual web frontend) to static root
COPY --from=frontend-builder /app/frontend/dist/renderer/ ./static/
RUN echo "=== Static files copied ===" && \
    ls -la /app/static/ && \
    echo "=== Static directory size ===" && \
    du -sh /app/static/

# Demo project
COPY voicepilot/demo-project/ ./demo-project/
RUN echo "=== Demo project copied ===" && \
    ls -la /app/demo-project/

# Main application
COPY voicepilot/backend/src/main.py ./
RUN echo "=== Main.py copied ===" && \
    ls -la /app/

EXPOSE 8080

ENV PYTHONUNBUFFERED=1
ENV DEMO_PROJECT_PATH=/app/demo-project
ENV STATIC_FILES_PATH=/app/static
ENV LOG_LEVEL=DEBUG

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--log-level", "debug"]
