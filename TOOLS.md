# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## Git Configuration

### Identity
- **Name:** no-kay
- **Email:** dev@nokai.moe

### GitHub
- **Username:** nokai-dev
- **Token:** `__GITHUB_TOKEN_REDACTED__`
- **Default Repo:** gemini-live-agent-challenge
- **Token File:** `/data/.openclaw/workspace/TOKENS.md` (gitignored)
- **Repository Policy:** PRIVATE by default
  - All new repos created as private
  - Only make public if explicitly requested

### OCI Images (Required for all hackathons)
- **Registry:** ghcr.io
- **Pattern:** `ghcr.io/nokai-dev/{repo}/{project}:latest`
- **Auto-build:** GitHub Actions workflow required (`.github/workflows/build-oci.yml`)
- **Multi-arch:** MUST support linux/amd64 AND linux/arm64 (use QEMU in Actions)
- **Verification:** Check GitHub Actions tab after push

---

### Global Auto-Commit

**Command:**
```bash
# Start watching all repos
python3 ~/.openclaw/skills/git-autocommit/git_autocommit.py start

# Check status
python3 ~/.openclaw/skills/git-autocommit/git_autocommit.py status

# View logs
tail -f /tmp/openclaw-git-autocommit.log
```

**Config:** `~/.openclaw/git-autocommit.json`

---

Add whatever helps you do your job. This is your cheat sheet.
