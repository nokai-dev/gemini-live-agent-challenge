# VoicePilot - Backend container with frontend static files
# Build context: ./ (voicepilot/)
# Build command: docker build -t gcr.io/PROJECT_ID/voicepilot-backend -f backend/Dockerfile .

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/src/ ./src/

# Create and copy static files directory (frontend built output)
# This is set by Cloud Run env var: STATIC_FILES_PATH=/app/static
RUN mkdir -p /app/static
COPY frontend/dist/renderer/ /app/static/

# Create and copy demo project files
# This is set by Cloud Run env var: DEMO_PROJECT_PATH=/app/demo-project
COPY demo-project/ /app/demo-project/

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8080
ENV STATIC_FILES_PATH=/app/static
ENV DEMO_PROJECT_PATH=/app/demo-project

# Expose port
EXPOSE 8080

# Run the application
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]
