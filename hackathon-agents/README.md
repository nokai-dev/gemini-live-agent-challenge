# Hackathon Agent Swarm

A containerized multi-agent system for dominating Devpost hackathons.

## Quick Start

```bash
# Pull and run
docker run -e DEVPOST_URL=https://devpost.com/hackathons/your-hackathon \
           -e OPENAI_API_KEY=sk-... \
           -v $(pwd)/output:/app/output \
           hackathon-agent-swarm:latest
```

## Or Build Locally

```bash
# Clone and build
git clone <repo>
cd hackathon-agents
./build.sh

# Run with docker-compose
cp .env.example .env
# Edit .env with your DEVPOST_URL and API keys
docker-compose up
```

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `DEVPOST_URL` | The Devpost hackathon URL to analyze |
| `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` | LLM API key for agent reasoning |
| `GITHUB_TOKEN` | (Optional) For auto-pushing code to repos |

## Agents

| Agent | Role |
|-------|------|
| `jury-scout` | Deep research on jurors and their preferences |
| `bounty-analyst` | Extract bounties and generate winning ideas |
| `critic` | Validate originality and review code |
| `coder` | Build MVP with continuous feedback loops |

## Workflow

1. Send Devpost URL → triggers orchestrator
2. Jury Scout + Bounty Analyst run in parallel
3. Critic selects the best idea
4. Coder builds MVP with iterative critique
5. Final submission package delivered

## Output

Results are written to `/app/output/` (mount a volume to persist):
- Research reports
- Selected idea summary
- GitHub repo (if GITHUB_TOKEN provided)
- Demo video script
- Submission checklist

## Files

- `Dockerfile` - Container definition
- `docker-compose.yml` - Easy local runs
- `orchestrator.md` - Main entry point
- `agents/*.md` - Agent definitions
- `manifest.json` - BOM-compatible manifest
