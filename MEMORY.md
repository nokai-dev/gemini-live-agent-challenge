# MEMORY.md - Long-term Memory

## Hackathon Automation System

### Philosophy

The most important phase is **research and brainstorming**. Never rush this. Deep analysis of jurors, bounties, market fit, and problem validation comes before any code is written.

### 🔴 CRITICAL RULES - NEVER VIOLATE

**0. SHOW GEMINI DEEP RESEARCH PROMPT BEFORE EXECUTION**
   - Construct the deep research prompt with all required sections
   - SHOW it to user BEFORE any research happens
   - WAIT for "approved" or "modify: [changes]"
   - ONLY then execute Gemini Deep Research
   - **This is NOT optional - user must see and approve the prompt**

1. **NEVER BUILD WITHOUT EXPLICIT USER APPROVAL**
   - Present ideas → Wait for user selection → THEN build
   - No exceptions, no "I'll just start"
   - User must say "build this one" or equivalent

2. **CRITIQUE IS MANDATORY AND THOROUGH**
   - ALL ideas must pass through ALL critics
   - Rescue ideas are NOT exempt - they get full critique
   - No idea proceeds without scoring

3. **RESCUE IDEAS GET FULL CRITIQUE**
   - If initial ideas score < 6/10, spawn rescue
   - Rescue ideas go through SAME critique pipeline
   - No shortcuts, no "good enough" bypass

### Pipeline Architecture

**Phase 1: Research & Discovery**
- Spawn `hackathon-researcher` sub-agent for specific hackathon analysis
- Spawn `disruptive-thinker` in parallel for radical alternatives
- Deep juror research (backgrounds, preferences, past winners)
- Bounty extraction and alignment
- Market validation and problem analysis
- Extended brainstorming (minimum 30 min deep research)
- Generate 10+ ideas, rank top 3

**Phase 2: Disruptive Thinking**
- Challenge ALL assumptions
- "What if we did the opposite?"
- Cross-industry pattern breaking
- 3-5 radical alternative approaches

**Phase 3: Critique & Validation**
- Spawn 4 critics in parallel:
  1. originality-critic: "Will judges remember?"
  2. judging-criteria-critic: "Maximize score?"
  3. market-viability-critic: "Buy future?"
  4. disruptive-critic: "What are we missing?"
- ALL ideas scored 0-10
- If any < 6/10: spawn rescue + RE-CRITIQUE
- Top 5 ideas proceed

**Phase 4: User Selection (HARD BLOCK)**
- Present top 5 with scores and rationale
- ⚠️ WAIT for explicit user approval
- ⚠️ NO CODE until user says "build this one"
- User can reject all and request new batch

**Phase 5: Build with Agency**
- ONLY after user approval
- Spawn relevant agents from 188-agency pool
- Frontend, backend, UX, DevOps agents as needed
- Parallel workstreams, continuous integration
- Commit regularly

**Phase 6: Audit**
- Automated quality checks
- Originality, functionality, requirements
- Code review

**Phase 7: Demo Preparation**
- Spawn `demo-script-writer` sub-agent
- Create 3-5 minute demo script
- Talking points and backup plans

**Phase 8: Deploy**
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
