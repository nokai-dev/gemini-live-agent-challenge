# MEMORY.md - Long-term Memory

## Hackathon Automation System

### Philosophy

The most important phase is **research and brainstorming**. Never rush this. Deep analysis of jurors, bounties, market fit, and problem validation comes before any code is written.

### Pipeline Architecture

**Phase 1: Research & Discovery**
- Spawn `hackathon-researcher` sub-agent for specific hackathon analysis
- Deep juror research (backgrounds, preferences, past winners)
- Bounty extraction and alignment
- Market validation and problem analysis
- Extended brainstorming (minimum 30 min deep research)
- Generate 10+ ideas, rank top 3

**Phase 2: Ideation & Validation**
- Select winning idea with detailed rationale
- Validate originality and market fit
- Define technical approach

**Phase 3: Build with Agency**
- Spawn relevant agents from 188-agency pool
- Frontend, backend, UX, DevOps agents as needed
- Parallel workstreams, continuous integration
- Commit regularly

**Phase 4: Audit**
- Automated quality checks
- Originality, functionality, requirements
- Code review

**Phase 5: Demo Preparation**
- Spawn `demo-script-writer` sub-agent
- Create 3-5 minute demo script
- Talking points and backup plans

**Phase 6: Deploy**
- Build OCI image
- Push to GHCR
- VPS-ready with `docker pull`

### Active Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| hackathon-audit | Every 6h | Submission quality check |
| hackathon-improvement | Every 6h | Continuous improvement cycle |

### Notification Targets

- Telegram: 5386760580 (primary)
- GitHub Issues: Auto-create on failures

### Key Principle

**Generalize the knowledge, specialize the execution.**

- MEMORY.md stays general (this file)
- Specific hackathon details go to sub-agents
- Each hackathon gets its own research agent
- Agency agents are reusable building blocks

---

*Last updated: 2026-03-15*
