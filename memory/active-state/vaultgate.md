# VaultGate — Active State
**Last checkpoint:** 2026-03-27 08:16 UTC — ⚠️ STALE WATCHDOG FLAG: context recovered from state file only. No independent session memory of this project. AGENTS.md BUILD VERIFICATION RULES flag this project: "VaultGate was built with @auth0/auth0-ai which does not exist on npm."

**Last updated by watchdog:** 2026-03-27 08:16 UTC
**Status:** testing (mature)
**Blocked on:** Nothing in automation — awaiting Auth0 Token Vault real credentials for live CIBA testing

## What This Is (1 paragraph)
VaultGate is an HTTP gateway (port 18792) that sits between AI agents (like OpenClaw) and external APIs (Slack, Google, GitHub). Instead of the agent holding long-lived credentials, VaultGate routes every action through Auth0 Token Vault. Write operations require explicit human approval via CIBA push notifications to Auth0 Guardian on the user's phone. Built for the "Authorized to Act" Auth0 hackathon on Devpost.

## Architecture
```
AI Agent → VaultGate (port 18792) → Auth0 Token Vault → Slack/Google/GitHub
 ↓
 CIBA push to phone
 (approve / deny)
```

## Current Status
| Component | Status | Notes |
|-----------|--------|-------|
| Express HTTP server | ✅ Working | Port 18792, health/action/status/revoke endpoints |
| Scope mapping | ✅ Working | write→CIBA required, read→no CIBA |
| Demo mode | ✅ Working | Clearly labeled [DEMO] on all simulated output |
| Test suite | ✅ Excellent | 217 tests, 100% line/stmt/function coverage on 4 core modules |
| CIBA demo (demo-try.sh) | ✅ Working | Full walkthrough, 3-poll auto-approval, no Auth0 needed |
| CIBA timeout demo | ✅ Working | demo-timeout.sh with DEMO_FORCE_TIMEOUT |
| CI-friendly demo | ✅ Working | demo-ci.sh without fuser/jq dependency |
| OCI image build | ✅ Working | GitHub Actions workflow → ghcr.io/nokai-dev/vaultgate |
| Pre-commit reality check | ✅ Working | Catches phantom packages, unmarked sims, dependency checks |
| GitHub repo | ✅ Private | github.com/nokai-dev/vaultgate |
| pre-commit hook | ⚠️ Not installed | Hook file not symlinked (samples only) |

## Test Suite Summary (15 test files, 217 tests)
| File | Tests | Coverage Target |
|------|-------|----------------|
| scopes.test.ts | 23 | getRequiredScope, requiresCIBA, getCIBABindingMessage |
| ciba.test.ts | 9 | CIBAHandler, poll loop, approval timing |
| tokenVault.test.ts | 14 | TokenVault in demo mode |
| vaultgate.test.ts | 17 | VaultGate orchestration |
| lifecycle.test.ts | 22 | Token issuance → expiry → revocation |
| index.test.ts | 7 | HTTP endpoints (supertest) |
| ciba.integration.test.ts | 16 | CIBA flow via HTTP |
| http-edge.test.ts | 28 | Error handling, edge cases, concurrency |
| ciba-edge.test.ts | 20 | Poll count variations, denial, concurrent |
| ciba-timeout.test.ts | 10 | DEMO_FORCE_TIMEOUT path, timing |
| ciba-denial.test.ts | 4 | Full denial path through tokenVault |
| gap-coverage.test.ts | 12 | Uncovered branches (real-mode, error path) |
| types.validation.test.ts | 13 | Input validation errors |
| cli.test.ts | 21 | CLI request construction |
| ci-config.test.ts | 13 | Workflow files, vitest config, package.json |

## Demo Scripts
| Script | Purpose | Command |
|--------|---------|---------|
| demo-try.sh | Full CIBA walkthrough, colored output | `npm run try` |
| demo-timeout.sh | Timeout path walkthrough | `bash demo-timeout.sh` |
| demo-ci.sh | CI-friendly (no fuser/jq) | `npm run try:ci` |

## Improvement Cycle 2026-03-27 08:40 UTC
- Pulled latest: repo already up to date
- Tests: 217 passing, 100% line/stmt/function on all 4 core modules, 98.93% branch (1 uncovered: ciba.ts:130)
- demo-try.sh: verified comprehensive (6 steps, colored output, server startup/shutdown)
- demo-timeout.sh (DEMO_FORCE_TIMEOUT path) and demo-ci.sh (CI-friendly, no fuser/jq) also verified
- No changes needed — everything was already in excellent shape
- Priority "ADD TESTS AND TRY-OUT SCRIPT" was already fully implemented from prior sessions

## What Was Just Completed
- Verified 217 tests all passing with 100% line/stmt/function coverage on ciba.ts, scopes.ts, tokenVault.ts, vaultgate.ts
- Verified 15 test files comprehensive across unit, integration, edge cases, CIBA flow, denial, timeout, CLI
- Verified demo-try.sh fully operational (starts server, runs READ→WRITE→STATUS→REVOKE→verify flow)
- Verified demo-timeout.sh (DEMO_FORCE_TIMEOUT path) and demo-ci.sh (CI-friendly) both exist
- Verified pre-commit-reality-check.sh passes all 18 checks
- Verified OCI build workflow (build-oci.yml), test workflow (test.yml), demo workflow (demo.yml)
- Verified no phantom packages, all npm packages exist, simulation properly labeled

## What's Next (ordered)
1. **Auth0 Token Vault real setup** — Set up Slack OAuth connection in Auth0 dashboard
2. **Test real CIBA flow** — POST to /bc-authorize with real credentials, see Guardian push
3. **Record demo video** — Cinematic 90-second video showing the "magic moment" of phone push
4. **Install pre-commit hook** — Symlink pre-commit-reality-check.sh for local devs

## Credentials & Config
- AUTH0_DOMAIN: dev-1nucg4kju154har5.eu.auth0.com ✅
- AUTH0_CLIENT_ID: mhXNlcSKawZrhWhPmBr2DpZF5K6oEgBv ✅
- AUTH0_CLIENT_SECRET: set ✅
- AUTH0_TOKEN_VAULT_CONNECTION_ID: ❌ needs setup
- CIBA_LOGIN_HINT: ❌ needs user's Auth0 email
- VAULTGATE_MODE: demo (switch to real after CIBA test)

## Links
- Repo: https://github.com/nokai-dev/vaultgate
- Hackathon: https://authorizedtoact.devpost.com
- Auth0 Token Vault docs: https://auth0.com/ai/docs/intro/token-vault
- Auth0 CIBA docs: https://auth0.com/docs/authenticate/login/oidc-conformant-authentication/oidc-adoption-ciba

---

## Watchdog Log
- 2026-03-27 03:35 UTC: Continuous improvement cycle — all automation in excellent shape. 217 tests passing, 100% coverage on core modules, all 3 demo scripts operational.
