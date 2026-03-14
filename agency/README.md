# Agency - Hackathon Automation

Automated agents for building and evaluating hackathon submissions.

## Audit Agent

Runs periodically to check submission quality:

```bash
# Run audit locally
python agency/audit-agent.py --path . --output AUDIT_REPORT.md

# Run with JSON output
python agency/audit-agent.py --json
```

### What it checks:

1. **Originality** - Detects boilerplate, checks code uniqueness
2. **Functionality** - Syntax validation, required files
3. **Requirements** - Gemini Live API, voice, screen awareness
4. **Completeness** - TODOs, tests, documentation

### Automated runs:

- GitHub Actions runs every 6 hours
- Creates issues if problems found
- Reports scores for each category

## Cron Integration

To run as OpenClaw cron job:

```bash
# Add to OpenClaw cron
openclaw cron add --name "hackathon-audit" \
  --schedule "0 */6 * * *" \
  --command "python agency/audit-agent.py --json"
```

## Workflow Integration

The audit runs automatically on:
- Every push to main
- Every 6 hours during hackathon
- Manual trigger via GitHub Actions
