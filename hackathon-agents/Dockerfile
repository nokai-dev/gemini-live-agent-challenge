FROM node:22-slim

# Install OpenClaw globally
RUN npm install -g openclaw

# Create app directory
WORKDIR /app

# Copy agent definitions
COPY . /app/agents/

# Create entrypoint script
RUN echo '#!/bin/bash\n\
if [ -z "$DEVPOST_URL" ]; then\n\
  echo "Error: Set DEVPOST_URL environment variable"\n\
  exit 1\n\
fi\n\
\n\
# Start OpenClaw with the orchestrator\n\
exec openclaw agent run /app/agents/orchestrator.md --input "$DEVPOST_URL"\n\
' > /entrypoint.sh && chmod +x /entrypoint.sh

# Expose any necessary ports (if needed for webhooks, etc.)
EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
