# Agent Enforcement and Automation Guidelines

**Date:** 2026-03-16
**Issue:** Agents sometimes don't follow architecture; need enforcement mechanisms

---

## Current Limitation: No Strict Enforcement

**Reality:** We cannot FORCE agents to follow instructions. They are LLM-based and may:
- Misinterpret instructions
- Skip steps they deem "optional"
- Hallucinate or deviate from the plan
- Fail to complete tasks fully

**What we CAN do:**
1. **Clearer instructions** — explicit, numbered steps
2. **Verification checklists** — agents must verify completion
3. **Smaller scopes** — atomic tasks that are harder to mess up
4. **Review gates** — human approval at critical points
5. **Idempotent operations** — safe to retry

---

## OCI Image Automation (Now Required)

**Rule:** Every hackathon project MUST include:

1. **Dockerfile** in project root or `/backend/`
2. **GitHub Actions workflow** at `.github/workflows/build-oci.yml`
3. **Auto-push to GHCR** on every commit to main
4. **No manual docker commands** required from user

**Template workflow:** See `gemini-live-agent-challenge/.github/workflows/build-oci.yml`

**Verification:** After build, agent MUST check GitHub Actions tab and confirm image appears at:
`ghcr.io/{username}/{repo}/{project}:latest`

---

## GitHub Token Handling (Security-Critical)

**NEVER commit tokens to git.**

**Approach A: Environment Variable (Preferred)**
```bash
# User sets in their shell profile
export GITHUB_TOKEN=ghp_...

# Agent reads from env
const token = process.env.GITHUB_TOKEN;
```

**Approach B: OpenClaw Config (if available)**
Check if OpenClaw has: `openclaw config set github.token ...`

**Approach C: Session-only (Current)**
- Tokens don't persist across sessions
- User provides token when needed
- Agent uses it immediately, doesn't store

**Current implementation:** Approach C (session-only) for security.

---

## Enforcement Strategies (Best Effort)

### 1. Pre-Flight Checklists

Agents MUST verify before claiming completion:

```
Before marking complete, verify:
- [ ] Dockerfile exists and builds successfully
- [ ] GitHub Actions workflow is in .github/workflows/
- [ ] Workflow triggers on push to main
- [ ] Image pushes to GHCR (check Actions tab)
- [ ] README includes deployment instructions
- [ ] Code is committed and pushed
```

### 2. Explicit Step Ordering

**BAD:** "Build the project and deploy it"

**GOOD:**
```
Step 1: Create Dockerfile
Step 2: Test docker build locally (if possible)
Step 3: Create .github/workflows/build-oci.yml
Step 4: Commit and push
Step 5: Verify Actions tab shows successful build
Step 6: Verify image appears on GHCR
Step 7: Report GHCR image URL to user
```

### 3. Verification Commands

Agents MUST run verification commands and report output:

```bash
# Verify GitHub Actions exists
ls -la .github/workflows/

# Verify Dockerfile exists
cat Dockerfile | head -20

# Verify workflow content has 'docker/build-push-action'
grep -q "docker/build-push-action" .github/workflows/build-oci.yml && echo "OK" || echo "FAIL"
```

### 4. Human Gates (Critical Steps)

For security-sensitive operations:
- Agent prepares the command/script
- Agent shows to user
- User approves/runs manually
- Agent verifies result

Example: GitHub token usage, destructive operations

---

## What To Do When Agents Fail

**Detection:**
- Check git status — are files actually committed?
- Check GitHub — did push succeed?
- Check Actions — did workflow run?
- Check GHCR — does image exist?

**Recovery:**
1. Re-spawn agent with MORE explicit instructions
2. Break task into smaller sub-tasks
3. Add verification checkpoints
4. Consider manual intervention for critical steps

---

## Current Architecture Gaps

**Gap 1:** No automatic verification that GitHub push succeeded
**Fix:** Agent must run `git log --oneline -3` and `git status` after push

**Gap 2:** No verification that GitHub Actions workflow is valid
**Fix:** Agent should check workflow file syntax before committing

**Gap 3:** No notification if Actions build fails
**Fix:** Agent should provide link to Actions tab, user monitors

**Gap 4:** No persistence of Git identity
**Fix:** Document in TOOLS.md, not AGENTS.md (security)

---

## Recommended: TOOLS.md Entry

Add to `/data/.openclaw/workspace/TOOLS.md`:

```markdown
### Git Identity
- Name: no-kay
- Email: dev@nokai.moe

### GitHub
- Username: nokai-dev
- Token: Use GITHUB_TOKEN env var (never commit)
- Default repo: gemini-live-agent-challenge

### OCI Images
- Registry: ghcr.io
- Pattern: ghcr.io/nokai-dev/{repo}/{project}:latest
- Auto-build via GitHub Actions (required for all projects)
```

---

## Summary

**We cannot strictly enforce agent behavior.** We can only:
1. Write clearer instructions
2. Add verification steps
3. Use smaller, atomic tasks
4. Put human gates on critical operations
5. Document expected behavior in TOOLS.md

**For this hackathon:**
- ✅ OCI automation is in place (GitHub Actions)
- ✅ Git identity is set (no-kay / dev@nokai.moe)
- ⚠️ Token handling is session-only (security)
- ⚠️ Verification is manual (check Actions tab)

**Future improvement:** Build verification agents that check other agents' work.
