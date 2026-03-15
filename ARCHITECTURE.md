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
│  │  • Knows empirically validated hackathon winning principles       │       │
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
│  ║                    PHASE 1: RUBRIC ANALYSIS                                ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                           ║  │
│  ║   🔴 CRITICAL: VALIDATE RUBRIC BEFORE ANY RESEARCH                        ║  │
│  ║                                                                           ║  │
│  ║   Read: Rules, Prizes, Sponsor Tracks, Judging Criteria                 ║  │
│  ║   Identify: What does THIS specific hackathon reward?                     ║  │
│  ║   Adjust: Scoring weights based on event type                            ║  │
│  ║                                                                           ║  │
│  ║   Different hackathons reward different things:                          ║  │
│  ║   • Google Cloud: Enterprise utility, sponsor tech showcase              ║  │
│  ║   • DevPost General: Demo wow, emotional resonance                       ║  │
│  ║   • Creative Storytellers: Multimodal innovation, narrative             ║  │
│  ║   • Live Agents: Real-time interaction, barge-in, low-latency            ║  │
│  ║                                                                           ║  │
│  ║   Output: Validated rubric weights for this specific event               ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                          │
                                          ▼
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                    PHASE 2: GEMINI DEEP RESEARCH (PARALLEL)                ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                           ║  │
│  ║   🔴 CRITICAL: MUST SHOW USER THE RESEARCH PROMPTS FIRST                  ║  │
│  ║                                                                           ║  │
│  ║   BEFORE any research execution:                                          ║  │
│  ║   1. Construct TWO Gemini Deep Research prompts                          ║  │
│  ║   2. SHOW prompts to user for approval                                    ║  │
│  ║   3. WAIT for "approved" or "modify: [changes]"                          ║  │
│  ║   4. ONLY then execute deep research                                     ║  │
│  ║                                                                           ║  │
│  ║   ┌─────────────────────────────────────────────────────────────────┐    ║  │
│  ║   │  RESEARCH A: PAST WINNERS ANALYSIS                               │    ║  │
│  ║   │  • Past winners of THIS specific hackathon                       │    ║  │
│  ║   │  • What they built and why they won                              │    ║  │
│  ║   │  • Demo patterns that scored well                                │    ║  │
│  ║   │  • Technical differentiators                                     │    ║  │
│  ║   │  • What separates winners from runners-up                        │    ║  │
│  ║   └─────────────────────────────────────────────────────────────────┘    ║  │
│  ║                                                                           ║  │
│  ║   ┌─────────────────────────────────────────────────────────────────┐    ║  │
│  ║   │  RESEARCH B: PROBLEM SPACE ANALYSIS                              │    ║  │
│  ║   │  • What problem is the hackathon trying to solve?              │    ║  │
│  ║   │  • Who has this problem and why is it painful?                   │    ║  │
│  ║   │  • Existing solutions and their gaps                             │    ║  │
│  ║   │  • What would a winning solution look like?                      │    ║  │
│  ║   │  • Deep understanding of the issue at hand                       │    ║  │
│  ║   └─────────────────────────────────────────────────────────────────┘    ║  │
│  ║                                                                           ║  │
│  ║   Output: Deep research reports for both A and B                        ║  │
│  ║   TIME: 30+ min per research (MOST IMPORTANT)                          ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                          │
                                          ▼
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                    PHASE 3: DISRUPTIVE THINKER                             ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                           ║  │
│  ║   Spawn: disruptive-thinker (PARALLEL)                                   ║  │
│  ║   • Challenge ALL assumptions                                            ║  │
│  ║   • "What if we did the opposite?"                                        ║  │
│  ║   • Cross-industry pattern breaking                                        ║  │
│  ║   • Output: 3-5 radical alternative approaches                           ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                          │
                                          ▼
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                    PHASE 4: IDEA SYNTHESIS                                 ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                           ║  │
│  ║   Synthesize: Research A + Research B + Disruptive                        ║  │
│  ║   Generate: 10+ validated problem-solution pairs                         ║  │
│  ║   Focus: Empathy engines, workflow eliminators, magic moments            ║  │
│  ║   Output: Ranked ideas with winning rationale                              ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                          │
                                          ▼
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                    PHASE 5: DEMO SCRIPT VALIDATION                         ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                           ║  │
│  ║   For each top idea: Write 90-second demo script                          ║  │
│  ║                                                                           ║  │
│  ║   Test: Can we show the "magic moment" visually?                          ║  │
│  ║   Test: Is the empathy hook clear in 10 seconds?                        ║  │
│  ║   Test: Does it make sponsor tech look powerful?                        ║  │
│  ║   Test: Can we build this in 24-48 hours?                                 ║  │
│  ║                                                                           ║  │
│  ║   Output: Top 5 ideas with validated demo scripts                          ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                          │
                                          ▼
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                    PHASE 6: USER SELECTION (🔴 HARD BLOCK)                 ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                           ║  │
│  ║   Present to User:                                                         ║  │
│  ║   • Problem statement (severe human constraint)                            ║  │
│  ║   • 90-second demo flow outline                                           ║  │
│  ║   • Empathy hook (why judges will care)                                   ║  │
│  ║   • Why it wins THIS hackathon                                           ║  │
│  ║   • Sponsor tech showcase angle                                          ║  │
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
│  ║                    PHASE 7: BUILD (Only After Approval)                    ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                           ║  │
│  ║   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   ║  │
│  ║   │   Frontend   │ │   Backend    │ │     UX       │ │   DevOps     │   ║  │
│  ║   │    Agent     │ │    Agent     │ │   Agent      │ │    Agent     │   ║  │
│  ║   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   ║  │
│  ║                                                                           ║  │
│  ║   + scope-guardian (continuous feature creep protection)                  ║  │
│  ║                                                                           ║  │
│  ║   RULES:                                                                   ║  │
│  ║   • Focus on demo-visible parts first                                     ║  │
│  ║   • Hardcoded/mock data acceptable for demo                              ║  │
│  ║   • Working > Impressive-but-broken                                       ║  │
│  ║   • 90-second demo is the spec                                            ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                          │
                                          ▼
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                    PHASE 8-11: DEMO → SUBMISSION → DEPLOY                  ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                           ║  │
│  ║   Channel 8:  demo-video-producer    → Cinematic 90s trailer             ║  │
│  ║   Channel 9:  submission-optimizer     → Devpost page as landing page       ║  │
│  ║   Channel 10: final-polish           → 2h before deadline                 ║  │
│  ║   Channel 11: audit-agent            → Rubric alignment check             ║  │
│  ║   Channel 12: deploy                 → OCI image → GHCR → VPS             ║  │
│  ║                                                                           ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## The Three Winning Archetypes (From 20+ Actual Winners)

### Archetype 1: The Empathy & Accessibility Engine ⭐⭐⭐
**Examples:** VITE VERE (cognitive disability), Gaze Link (ALS), ViddyScribe (blind)

**Characteristics:**
- Addresses severe human constraints (disability, crisis, severe pain)
- Hyper-specific niche (not broad platforms)
- Social impact + technical execution = unbeatable
- Market size IGNORED by judges

**Why They Win:** "Juries are human; moved by technology that alleviates suffering"

### Archetype 2: The Frictionless Workflow Eliminator
**Examples:** tl;dd (dashboard fatigue), OpsPilot (DevOps on-call), SalesShortcut

**Characteristics:**
- Eliminates one recognizable daily annoyance
- Corporate/enterprise context but specific problem
- Instant utility, clear before/after
- One feature, not platform

**Why They Win:** "Instantly recognizable corporate annoyance + elegant solution"

### Archetype 3: The Illusion of Magic
**Examples:** Jayu (autonomous cursor), Outdraw AI (AI as game opponent)

**Characteristics:**
- Novel interaction paradigm feels futuristic
- Contrarian use of sponsor technology
- High "demo wow" factor
- Relatively straightforward API calls

**Why They Win:** "Arrests attention of fatigued judges with spectacle"

## What Actually Wins (Empirically Validated)

### The Real Scoring Function

```
Score = Rubric Fit (40%) + Demo Confidence (30%) + Story/Impact (20%) + Future Potential (10%)
```

**NOT:**
- ❌ Technical Complexity
- ❌ Market Size (TAM)
- ❌ Defensible Moat
- ❌ "Saturated Market" penalties

### Key Insights from 20+ Winners

| What Theoretically Matters | What Actually Matters |
|---------------------------|----------------------|
| Market Viability ($12B TAM) | **IGNORED** - Judges don't audit business models |
| Defensible Moat | **IGNORED** - Winners have zero moats |
| Technical Complexity | **PENALIZED** - If not visible in demo |
| "Saturated Market" | **WRONG** - Winners enter saturated markets with twists |
| Broad Market Appeal | **PENALIZED** - Hyper-specific niches win |
| Production-Ready Code | **IGNORED** - Hardcoded data acceptable |
| Novel Innovation | **"Novel Enough"** - Not radically new |
| Impressive Stack | **Familiar Tools** - Speed > complexity |

### The Winning Formula

**Before Coding:**
1. Read rules, prizes, sponsor tracks, judging criteria line by line
2. Choose the track where your idea fits most naturally
3. Decide the exact 90-second demo flow before building

**During Build:**
1. Keep the core idea to one killer workflow, not many features
2. Use familiar stack, templates, sample data if needed
3. Make it visually understandable fast
4. Focus on demo-visible parts first

**For Submission:**
1. Treat the Devpost page like a landing page, not an afterthought
2. Record the demo early and make it visual, short, criteria-aware
3. Explain: what it is, who it helps, why it matters, how sponsor tech was used
4. Include GIFs, images, markdown emphasis

## Critical Rules Summary

| Rule | Description | Why It Matters |
|------|-------------|----------------|
| **Show Research Prompts First** | TWO prompts (Winners + Problem) before execution | User must approve research direction |
| **Validate Rubric First** | Read rules/prizes/criteria before research | Different hackathons reward different things |
| **Empathy > Market** | Severe human constraints win over broad markets | Social impact + tech = highest scoring archetype |
| **Demo > Architecture** | Cinematic presentation beats backend complexity | Judges remember what they SEE |
| **Scope > Ambition** | One workflow, not platform | 90-second demo is the spec |
| **Story > Features** | Problem → User → Solution → Magic → Future | Judges remember stories |
| **Never Build Without Approval** | Present → Wait → Build | Architecture requirement |
| **Rescue Gets Full Critique** | No exemptions for rescue ideas | Quality control |

## Communication Protocol

```
Orchestrator → Parent Agent → You (human)
     │
     ├─ 📝 Gemini Deep Research Prompts → Show for approval
     ├─ Progress updates (normal)
     ├─ 🚨 AWAITING APPROVAL → Telegram 5386760580 when Phase 6 ready
     └─ Blockers → Telegram 5386760580
```

## Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| hackathon-audit | Every 6h | "Does this meet the rubric?" |
| hackathon-improvement | Every 6h | "What would make the demo 10% better?" |

### Gemini Deep Research Prompt Template

**Use this template for every hackathon. Customize the bracketed sections.**

---

**CONDUCT COMPREHENSIVE DEEP RESEARCH ON [HACKATHON NAME]**

**HACKATHON CONTEXT:**
- URL: [HACKATHON_URL]
- Prize Pool: [PRIZE_AMOUNT] (Grand Prize [AMOUNT], Category Prizes [AMOUNTS])
- Tracks: [TRACK_NAMES]
- Tech Stack: [REQUIRED_TECHNOLOGIES]
- Judging Criteria: [CRITERIA_WITH_WEIGHTS]

**RESEARCH TASK 1: PAST WINNERS ANALYSIS ([SPONSOR] Competitions [YEAR_RANGE])**

Analyze the last 15-20 winners of [SPONSOR]/DevPost hackathons, with specific focus on:
1. **What did they build?** (Project names, core functionality, track/category)
2. **Why did they win?** (What made them memorable to judges?)
3. **Demo patterns that scored well:**
   - How did they structure their 90-second demo?
   - What was their "magic moment"?
   - How did they showcase sponsor technology?
4. **Technical differentiators:**
   - What specific [SPONSOR_TECH] features did they use?
   - How did they demonstrate [KEY_CAPABILITIES]?
   - What made their technical implementation stand out?
5. **What separates winners from runners-up?**
   - Common failure patterns of non-winning projects
   - Why "better technical" projects sometimes lost to "better demo" projects

**RESEARCH TASK 2: PROBLEM SPACE ANALYSIS**

Deeply understand what this hackathon is trying to solve:

1. **Core Problem:**
   - What is the fundamental issue [THEME] is addressing?
   - Why is [KEY_CAPABILITY] important?
   - What does [HACKATHON_TAGLINE] actually mean in practice?

2. **Who has this problem and why is it painful?**
   - Specific user personas (not generic "everyone")
   - Real pain points in their daily lives/workflows
   - Why existing solutions are insufficient

3. **Existing solutions and their gaps:**
   - Current [CATEGORY] solutions - why they fail
   - Current [ALTERNATIVES] - why they're limited
   - Where is the white space for innovation?

4. **What would a winning solution look like?**
   - Specific features that would impress judges
   - Demo flow that would score 9+/10
   - Technical implementation that showcases [SPONSOR_TECH] strengths
   - Emotional hook that makes judges remember it

5. **Deep understanding of the issue:**
   - Why do users need [HACKATHON_PROMISE]?
   - What does [KEY_FEATURE] mean and why does it matter?
   - Why is [DIFFERENTIATOR] the key differentiator?

**RESEARCH TASK 3: WINNING ARCHETYPE ALIGNMENT**

Based on the Three Winning Archetypes (Empathy Engine, Workflow Eliminator, Illusion of Magic):

1. Which archetype fits best for THIS hackathon's [TRACK_NAME] track?
2. What specific problem within that archetype would win?
3. What would the 90-second demo flow look like?
4. What is the "magic moment" that would make judges say "wow"?

**OUTPUT REQUIREMENTS:**

Provide:
- 10+ validated problem-solution pairs that could win this specific hackathon
- Each must include: Problem, Solution, Demo flow, Why it wins, Archetype alignment
- Rank by winning probability for THIS specific hackathon
- Note any "disruptive" or "outside the box" angles
- Specific technical recommendations for [SPONSOR_TECH] usage

**TIME: Take as long as needed for deep, comprehensive analysis**

---

*Architecture Version: 4.0 - Updated 2026-03-15*
*Changes: Complete rewrite with TWO separate deep researches (Winners + Problem Space), mandatory prompt approval, added Gemini Deep Research Prompt Template*
