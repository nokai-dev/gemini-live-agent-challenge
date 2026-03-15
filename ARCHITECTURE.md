# Hackathon Automation Architecture

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              YOU (The Human)                                    │
│                                    │                                            │
│                                    ▼                                            │
│                         "Start hackathon [URL]"                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ABSTRACT COORDINATOR (Main Agent)                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐       │
│  │  • Maintains SOUL.md, TOOLS.md, MEMORY.md, ARCHITECTURE.md          │       │
│  │  • Knows general hackathon principles                                 │       │
│  │  • Spawns orchestrators per hackathon                                 │       │
│  │  • Runs cron jobs (audit + improvement)                               │       │
│  └─────────────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      HACKATHON ORCHESTRATOR (Per-Instance)                      │
│                                                                                 │
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                    PHASE 1: RESEARCH & DISCOVERY                          ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                           ║  │
│  ║   🔴 CRITICAL: MUST SHOW USER THE GEMINI DEEP RESEARCH PROMPT            ║  │
│  ║                                                                           ║  │
│  ║   BEFORE any research execution:                                          ║  │
│  ║   1. Construct Gemini Deep Research prompt                               ║  │
│  ║   2. SHOW prompt to user for approval/modification                        ║  │
│  ║   3. WAIT for user "approved" or "modify: [changes]"                     ║  │
│  ║   4. ONLY then execute deep research                                     ║  │
│  ║                                                                           ║  │
│  ║   ┌─────────────────────────────────────────────────────────────────┐    ║  │
│  ║   │  PROMPT TEMPLATE (Show to user):                                 │    ║  │
│  ║   │  ─────────────────────────────────────────────────────────────   │    ║  │
│  ║   │  "Conduct deep research on [HACKATHON NAME] hackathon:          │    ║  │
│  ║   │                                                                   │    ║  │
│  ║   │  1. JUROR ANALYSIS: Who are the judges? What are their           │    ║  │
│  ║   │     backgrounds? What do they care about? Past projects?        │    ║  │
│  ║   │                                                                   │    ║  │
│  ║   │  2. PAST WINNERS: What won similar hackathons? Why?             │    ║  │
│  ║   │     Patterns in winning projects?                               │    ║  │
│  ║   │                                                                   │    ║  │
│  ║   │  3. BOUNTY ALIGNMENT: Which prizes ($X Grand Prize, etc.)        │    ║  │
│  ║   │     align with which problem types?                             │    ║  │
│  ║   │                                                                   │    ║  │
│  ║   │  4. PROBLEM VALIDATION: What are REAL, PAINFUL problems         │    ║  │
│  ║   │     that fit the hackathon theme? Market size? Existing         │    ║  │
│  ║   │     solutions? Why are they insufficient?                       │    ║  │
│  ║   │                                                                   │    ║  │
│  ║   │  5. TECHNICAL CONSTRAINTS: What stack is required?               │    ║  │
│  ║   │     What are the technical differentiators?                     │    ║  │
│  ║   │                                                                   │    ║  │
│  ║   │  6. JUDGING CRITERIA DEEP DIVE: What scores highest on           │    ║  │
│  ║   │     Innovation (40%)? Technical (30%)? Demo (30%)?            │    ║  │
│  ║   │                                                                   │    ║  │
│  ║   │  Return structured analysis with 10+ validated problem-        │    ║  │
│  ║   │  solution pairs that could win this specific hackathon."      │    ║  │
│  ║   │  ─────────────────────────────────────────────────────────────   │    ║  │
│  ║   └─────────────────────────────────────────────────────────────────┘    ║  │
│  ║                              │                                           ║  │
│  ║                              ▼                                           ║  │
│  ║   ┌─────────────────────────────────────────────────────────────────┐    ║  │
│  ║   │  USER MUST APPROVE:                                              │    ║  │
│  ║   │  • "Approved" → Execute deep research                            │    ║  │
│  ║   │  • "Modify: [changes]" → Revise prompt, show again               │    ║  │
│  ║   │  • "Add: [additional research areas]" → Update prompt            │    ║  │
│  ║   └─────────────────────────────────────────────────────────────────┘    ║  │
│  ║                              │                                           ║  │
│  ║                              ▼                                           ║  │
│  ║   ┌─────────────────────┐         ┌─────────────────────┐               ║  │
│  ║   │ hackathon-researcher│         │ disruptive-thinker  │               ║  │
│  ║   │ (Deep Research)     │         │ (Radical Alternatives)              ║  │
│  ║   │ • Juror backgrounds │         │ • Challenge assumptions               ║  │
│  ║   │ • Bounty alignment  │         │ • "Opposite" thinking                 ║  │
│  ║   │ • Past winners      │         │ • Cross-industry patterns             ║  │
│  ║   │ • Problem validation│         │ • 3-5 radical ideas                   ║  │
│  ║   │ • 10+ ideas         │         │                                       ║  │
│  ║   └──────────┬──────────┘         └──────────┬──────────┘               ║  │
│  ║              │                               │                           ║  │
│  ║              └───────────────┬───────────────┘                           ║  │
│  ║                              ▼                                           ║  │
│  ║                    Combined Idea Pool (10+ ideas)                        ║  │
│  ║                    TIME: 30+ min (MOST IMPORTANT)                         ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                          │
                                          ▼
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                    PHASE 2: MANDATORY CRITIQUE                              ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                           ║  │
│  ║   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   ║  │
│  ║   │  Originality │ │   Judging    │ │    Market    │ │  Disruptive  │   ║  │
│  ║   │    Critic    │ │   Criteria   │ │  Viability   │ │    Critic    │   ║  │
│  ║   │              │ │    Critic    │ │    Critic    │ │              │   ║  │
│  ║   │ "Will judges │ │ "Maximize    │ │ "Will judges │ │ "What are we │   ║  │
│  ║   │  remember?"  │ │   score?"    │ │  buy this?"  │ │  missing?"   │   ║  │
│  ║   └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘   ║  │
│  ║          │                │                │                │           ║  │
│  ║          └────────────────┴────────────────┴────────────────┘           ║  │
│  ║                              │                                           ║  │
│  ║                              ▼                                           ║  │
│  ║                    All Ideas Scored 0-10                                 ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                          │
                                          ▼
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                    PHASE 3: RESCUE & RE-CRITIQUE (if needed)              ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                           ║  │
│  ║   IF any idea scores < 6/10:                                              ║  │
│  ║   ┌─────────────────────────────────────────────────────────────────┐    ║  │
│  ║   │                    idea-rescue agent                             │    ║  │
│  ║   │  • Generate 5-7 new ideas                                        │    ║  │
│  ║   │  • ⚠️ MUST go through ALL 4 critics again                        │    ║  │
│  ║   │  • No exemptions, no shortcuts                                   │    ║  │
│  ║   └─────────────────────────────────────────────────────────────────┘    ║  │
│  ║                                                                           ║  │
│  ║   Output: Top 5 problem-solutions with scores                             ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                          │
                                          ▼
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                    PHASE 4: USER SELECTION (🔴 HARD BLOCK)                  ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                           ║  │
│  ║   ┌─────────────────────────────────────────────────────────────────┐    ║  │
│  ║   │  Present to User:                                               │    ║  │
│  ║   │  • Top 5 ideas with scores                                       │    ║  │
│  ║   │  • Problem statement                                             │    ║  │
│  ║   │  • Proposed solution                                             │    ║  │
│  ║   │  • Demo flow outline                                             │    ║  │
│  ║   │  • All 4 critic scores                                           │    ║  │
│  ║   │  • Winning rationale                                             │    ║  │
│  ║   └─────────────────────────────────────────────────────────────────┘    ║  │
│  ║                                                                           ║  │
│  ║   ⚠️  WAIT FOR EXPLICIT USER APPROVAL                                     ║  │
│  ║   ⚠️  NO CODE UNTIL USER SAYS "BUILD THIS ONE"                            ║  │
│  ║   ⚠️  USER CAN REJECT ALL AND REQUEST NEW BATCH                           ║  │
│  ║                                                                           ║  │
│  ║   ┌─────────────────────────────────────────────────────────────────┐    ║  │
│  ║   │  [  BLOCKED  ]  ←───  [  AWAITING APPROVAL  ]  ←───  [  BLOCKED  ]  │    ║  │
│  ║   └─────────────────────────────────────────────────────────────────┘    ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                          │
                                          ▼
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                    PHASE 5: BUILD (Only After Approval)                   ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                           ║  │
│  ║   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   ║  │
│  ║   │   Frontend   │ │   Backend    │ │     UX       │ │   DevOps     │   ║  │
│  ║   │    Agent     │ │    Agent     │ │   Agent      │ │    Agent     │   ║  │
│  ║   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   ║  │
│  ║                                                                           ║  │
│  ║   + scope-guardian (continuous feature creep protection)                  ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                          │
                                          ▼
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                    PHASE 6-10: AUDIT → DEMO → DEPLOY                      ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                           ║  │
│  ║   Channel 6:  audit-agent.py         → Quality checks                     ║  │
│  ║   Channel 7:  demo-script-writer     → 90s demo script                    ║  │
│  ║   Channel 8:  demo-rehearsal         → Timing & polish                   ║  │
│  ║   Channel 9:  submission-optimizer → Devpost optimization               ║  │
│  ║   Channel 10: sponsor-validator      → Creative sponsor usage             ║  │
│  ║   Channel 11: final-polish           → 2h before deadline                 ║  │
│  ║   Channel 12: deploy                 → OCI image → GHCR → VPS             ║  │
│  ║                                                                           ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Critical Rules Summary

| Rule | Description | Violation Consequence |
|------|-------------|----------------------|
| **🔴 SHOW GEMINI DEEP RESEARCH PROMPT** | Must show user the prompt BEFORE execution | Stop, show prompt, wait for approval |
| **🔴 NEVER BUILD WITHOUT APPROVAL** | Present ideas → Wait for user → THEN build | Stop immediately, apologize, restart |
| **🔴 ALL IDEAS MUST BE CRITIQUED** | Every idea through all 4 critics | Re-run critique if skipped |
| **🔴 RESCUE IDEAS GET FULL CRITIQUE** | No exemptions for rescue-generated ideas | Re-run full critique pipeline |
| **🔴 USER CAN REJECT ALL** | Always offer "none of these, try again" | Present new batch if requested |

## Gemini Deep Research Protocol

### Step 1: Construct Prompt
```
"Conduct deep research on [HACKATHON NAME] hackathon:

1. JUROR ANALYSIS: Who are the judges? What are their backgrounds? 
   What do they care about? Past projects they've praised?

2. PAST WINNERS: What won similar hackathons? Why? Patterns in 
   winning projects? What made them memorable?

3. BOUNTY ALIGNMENT: Which prizes align with which problem types?
   Grand Prize vs Category prizes vs Special prizes?

4. PROBLEM VALIDATION: What are REAL, PAINFUL problems that fit 
   the theme? Market size? Existing solutions? Why insufficient?

5. TECHNICAL CONSTRAINTS: Required stack? Technical differentiators?
   What would impress judges technically?

6. JUDGING CRITERIA DEEP DIVE: What scores highest on each criterion?
   Innovation (40%)? Technical (30%)? Demo (30%)?

Return structured analysis with 10+ validated problem-solution pairs 
that could win this specific hackathon."
```

### Step 2: Show to User
- Display full prompt
- Ask: "Approved?" or "Modify: [changes]"
- Wait for explicit response

### Step 3: Execute Only After Approval
- Run Gemini Deep Research with approved prompt
- Save results to file
- Show summary to user

## Agent Definitions

### Research Phase
- **hackathon-researcher**: Deep research on jurors, bounties, past winners, problem validation
  - **MUST show prompt to user first**
  - **MUST get user approval before execution**
- **disruptive-thinker**: Radical alternatives, assumption challenging, cross-industry patterns

### Critique Phase (All Parallel)
- **originality-critic**: "Will judges remember this?"
- **judging-criteria-critic**: "Does this maximize rubric score?"
- **market-viability-critic**: "Will judges buy the future potential?"
- **disruptive-critic**: "What are we missing? What's the blind spot?"

### Rescue Phase (if needed)
- **idea-rescue**: Generate 5-7 new ideas → MUST re-run through ALL critics

### Build Phase (After Approval)
- **scope-guardian**: Continuous feature creep protection
- **188-agency pool**: Frontend, backend, UX, DevOps agents

## Communication Protocol

```
Orchestrator → Parent Agent → You (human)
     │
     ├─ 📝 Gemini Deep Research Prompt → Show for approval
     ├─ Progress updates (normal)
     ├─ 🚨 AWAITING APPROVAL → Telegram 5386760580 when Phase 4 is ready
     └─ Blockers → Telegram 5386760580
```

## Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| hackathon-audit | Every 6h | "Is this good enough?" |
| hackathon-improvement | Every 6h | "What would make this 10% better?" |

---

*Architecture Version: 2.1 - Updated 2026-03-15*
*Changes: Added mandatory Gemini Deep Research prompt approval step*
