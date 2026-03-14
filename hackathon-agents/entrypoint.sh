#!/bin/bash
set -e

if [ -z "$DEVPOST_URL" ]; then
  echo "Error: DEVPOST_URL environment variable is required"
  echo "Usage: docker run -e DEVPOST_URL=https://devpost.com/hackathons/... hackathon-agent-swarm"
  exit 1
fi

echo "🚀 Hackathon Agent Swarm v1.0.0"
echo "================================"
echo "Target: $DEVPOST_URL"
echo ""

# Check for required API keys
if [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "Warning: No LLM API key found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY"
fi

# Run the orchestrator
exec openclaw agent run /app/agents/orchestrator.md --input "$DEVPOST_URL"
