# MEMORY.md - Long-term Memory

## Hackathon Automation System

### Philosophy

The most important phase is **rubric validation and deep research**. Never rush this. Deep analysis of what ACTUALLY wins hackathons (not what theoretically should win) comes before any code is written.

### 🔴 CRITICAL RULES - NEVER VIOLATE

**0. VALIDATE THE RUBRIC FIRST**
   - Read rules, prizes, sponsor tracks, judging criteria line by line
   - Identify what THIS specific hackathon rewards
   - Adjust scoring weights accordingly
   - **Different hackathons reward different things**

**0a. I ALWAYS CREATE THE DEEP RESEARCH PROMPT, USER RUNS IT**
   - I construct ONE comprehensive deep research prompt (always)
   - SHOW prompt to user for approval
   - NOTIFY user on Telegram with the prompt
   - USER runs prompt in Gemini Pro (Deep Research enabled)
   - USER gives me the research results
   - ONLY then proceed to Phase 3
   - **I DO NOT execute the research myself**

**1. EMPATHY & HYPER-SPECIFIC UTILITY > MARKET VIABILITY**
   - Severe human constraints win over broad markets
   - "ALS patients" beats "healthcare platform"
   - Social impact + technical execution = highest scoring archetype
   - Market size is IGNORED by judges

**2. DEMO WOW & NARRATIVE RESONANCE > TECHNICAL COMPLEXITY**
   - Cinematic presentation beats backend architecture
   - "Magic moment" in 90 seconds is everything
   - Visual polish > code complexity
   - If it can't be shown in demo, it doesn't exist

**3. SCOPE BEATS AMBITION**
   - One killer workflow, not many features
   - Hardcoded/mock data acceptable for demo
   - Working > Impressive-but-broken
   - 90-second demo is the spec

**4. STORYTELLING IS PART OF THE PRODUCT**
   - Problem → User → Solution → Magic → Future
   - Emotional hook in first 10 seconds
   - Trailer-like video, not screen recording
   - Judges remember stories, not features

**5. NEVER BUILD WITHOUT EXPLICIT USER APPROVAL**
   - Present ideas → Wait for user selection → THEN build
   - No exceptions, no "I'll just start"
   - User must say "build this one" or equivalent

**6. RESCUE IDEAS GET FULL RE-CRITIQUE**
   - If initial ideas score < 6/10, spawn rescue
   - Rescue ideas go through SAME critique pipeline
   - No shortcuts, no "good enough" bypass

### The Three Winning Archetypes (From 20+ Actual Winners)

**Archetype 1: The Empathy & Accessibility Engine** ⭐⭐⭐
- Addresses severe human constraints (disability, crisis, severe pain)
- Hyper-specific niche (not broad platforms)
- Social impact + technical execution = unbeatable
- Examples: VITE VERE (cognitive disability), Gaze Link (ALS), ViddyScribe (blind)

**Archetype 2: The Frictionless Workflow Eliminator**
- Eliminates one recognizable daily annoyance
- Corporate/enterprise context but specific problem
- Instant utility, clear before/after
- Examples: tl;dd (dashboard fatigue), OpsPilot (DevOps on-call)

**Archetype 3: The Illusion of Magic**
- Novel interaction paradigm feels futuristic
- Contrarian use of sponsor technology
- High "demo wow" factor
- Examples: Jayu (autonomous cursor), Outdraw AI (AI as game opponent)

### What Actually Wins (From Empirical Analysis)

**Score = Rubric Fit (40%) + Demo Confidence (30%) + Story/Impact (20%) + Future Potential (10%)**

**NOT:**
- ❌ Technical Complexity
- ❌ Market Size (TAM)
- ❌ Defensible Moat
- ❌ "Saturated Market" penalties

**Key Insights:**
- Winners have shaky business models but amazing demos
- Winners enter saturated markets with novel twists
- Winners solve weird, specific problems not "$12B markets"
- Winners are "novel enough" not "radically new"
- Winners use familiar tools, not impressive stacks
- Winners build one workflow, not platforms

### Pipeline Architecture

**Phase 1: Rubric Analysis**
- Extract: What does THIS hackathon reward?
- Read rules, prizes, sponsor tracks, judging criteria
- Identify: Which archetype fits best?
- Output: Validated rubric weights for this event

**Phase 2: Gemini Deep Research (USER EXECUTES, NOT ME)**
- 🔴 CRITICAL: I CONSTRUCT PROMPT, USER RUNS RESEARCH
- 1. Construct ONE comprehensive deep research prompt
- 2. SHOW prompt to user for approval
- 3. NOTIFY user on Telegram with the prompt
- 4. USER runs prompt in Gemini Pro (Deep Research enabled)
- 5. USER gives me the research results
- 6. ONLY then proceed to Phase 3
- Research covers: Past Winners + Problem Space + Archetype Alignment
- Output: Deep research report (provided by user)

**Phase 3: Disruptive Thinking**
- Spawn `disruptive-thinker` in parallel
- Challenge ALL assumptions
- "What if we did the opposite?"
- Output: 3-5 radical alternatives

**Phase 4: Idea Synthesis**
- Synthesize: Research A + Research B + Disruptive
- Generate: 10+ validated problem-solution pairs
- Focus: Empathy engines, workflow eliminators
- Output: Ranked ideas with winning rationale

**Phase 5: Demo Script Validation**
- For each top idea: Write 90-second demo script
- Test: Can we show the "magic moment" visually?
- Test: Is the empathy hook clear in 10 seconds?
- Test: Does it make sponsor tech look powerful?
- Output: Top 5 ideas with demo scripts

**Phase 6: User Selection (HARD BLOCK)**
- Present top 5 to user
- Include: Problem, Demo flow, Empathy hook
- Include: Why it wins THIS hackathon
- ⚠️ WAIT for explicit user approval
- ⚠️ NO CODE until user says "build this one"

**Phase 7: Build (Only After Approval)**
- Spawn scope-guardian + build agents
- Focus: Demo-visible parts first
- Rule: Hardcode/mock data acceptable for demo
- Rule: Working > Impressive-but-broken

**Phase 8: Demo Video**
- Spawn `demo-video-producer`
- Create: Cinematic 90-second demo video
- Format: Trailer-like, not screen recording
- Include: Problem → User → Solution → Magic → Future

**Phase 9: Submission Optimization**
- Spawn `submission-optimizer` (Devpost page)
- Treat page like landing page, not afterthought
- Include: GIFs, images, markdown emphasis

**Phase 10: Final Polish**
- Spawn `final-polish` (2h before deadline)
- Run: Audit agent for rubric alignment

**Phase 11: Deploy**
- Build OCI image → Push to GHCR → VPS ready

### Active Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| hackathon-audit | Every 6h | "Does this meet the rubric?" |
| hackathon-improvement | Every 6h | "What would make the demo 10% better?" |

### Notification Targets

- Telegram: 5386760580 (primary)
- GitHub Issues: Auto-create on failures

### Key Principle

**Generalize the knowledge, specialize the execution.**

- MEMORY.md stays general (this file)
- Specific hackathon details go to sub-agents
- Each hackathon gets its own research agent
- Agency agents are reusable building blocks

### 🔍 Data Verification Rules (Anti-Hallucination)

**When reporting on files, data, or pipeline status:**

1. **SHOW RAW OUTPUT, NOT SUMMARIES**
   - Never say "the file has data" — show `cat` or `head` output
   - Never say "the scraper is working" — show the actual output file contents
   - Never say "already collected" without verifying file has non-empty content

2. **VALIDATE AT EACH PIPELINE PHASE**
   - For any data pipeline: run a validation step before declaring success
   - After scraping, show `wc -l` AND `head -5` of the output file
   - If a phase outputs empty files, FLAG IT IMMEDIATELY as a failure

3. **RED FLAG PHRASES — VERIFY BEFORE CONTINUING**
   - "already collected" → verify with `cat`/`head`
   - "working" / "successful" → show raw output proof
   - "data is ready" → show line count AND file size
   - "the pipeline ran" → show the actual output, not just the script existing

4. **BE EXPLICIT ABOUT UNCERTAINTY**
   - If you didn't personally run a step, say "I haven't verified this"
   - If file sizes look wrong (e.g. 2 bytes for thousands of records), investigate immediately
   - If a claimed output file doesn't exist or is empty, say so clearly

5. **ALWAYS USE TWO-INPUT VERIFICATION**
   - Cross-check: file size + line count + sample content together
   - Never rely on a single indicator (like just `ls -la` file size)

### Token Management System

**Persistent Token Storage:**
- **File:** `/data/.openclaw/workspace/TOKENS.md` (gitignored)
- **Current Tokens:**
  - GitHub: `__GITHUB_TOKEN__` (use TOOLS.md or TOKENS.md for actual token)

**How to use:**
```python
# In Python scripts
import os
token = os.environ.get('GITHUB_TOKEN') or open('/data/.openclaw/workspace/TOKENS.md').read().split('```')[1].strip()
```

**Never ask for tokens twice** - check TOOLS.md and TOKENS.md first!

---

### GitHub Repository Policy

**Default: PRIVATE repositories**

When creating new GitHub repos:
```bash
# API call must include "private": true
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user/repos \
  -d '{
    "name": "repo-name",
    "private": true,  # ← ALWAYS private
    ...
  }'
```

**Projects that should be PRIVATE:**
- Hackathon analysis (competitor data)
- Personal tokens/configs
- Experimental/incomplete work
- Anything with user data

**Exception:** Only make public if explicitly asked.

---

### Global Git Auto-Commit System

**What it does:** Automatically commits and pushes code changes across ALL git repos in the workspace.

**Location:** `/data/.openclaw/workspace/.openclaw/skills/git-autocommit/`

**Commands:**
```bash
# Start auto-commit watcher (background)
python3 /data/.openclaw/workspace/.openclaw/skills/git-autocommit/git_autocommit.py start

# Check status
python3 /data/.openclaw/workspace/.openclaw/skills/git-autocommit/git_autocommit.py status

# Stop watcher
python3 /data/.openclaw/workspace/.openclaw/skills/git-autocommit/git_autocommit.py stop

# Run in foreground (for testing)
python3 /data/.openclaw/workspace/.openclaw/skills/git-autocommit/git_autocommit.py run
```

**Features:**
- Watches ALL git repos in `/data/.openclaw/workspace/`
- Commits every 30 seconds if files changed
- Auto-pushes to GitHub
- Commit message: `[repo-name] Auto-commit N files at timestamp`
- Logs to `/tmp/openclaw-git-autocommit.log`

---

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

*Last updated: 2026-03-15 - Updated with empirically validated winning framework, two-research architecture, and Gemini Deep Research Prompt Template*
