# VoicePilot — Scope Document
## Frontend Development Edition
**Hackathon:** 24-48 Hour Build | Gemini Live API + Google Cloud

---

## 1. EXECUTIVE SUMMARY

**VoicePilot** is a voice-controlled frontend development assistant that lets developers highlight any UI element and change it with natural language commands.

**The Magic:** "Make this button blue" → AI sees your highlight, finds the code, changes it → You see it update instantly.

---

## 2. SCOPE CLASSIFICATION

### 🔴 MUST HAVE (Demo-Critical)
These MUST work for the 90-second demo. No exceptions.

| Feature | Description | Demo Role |
|---------|-------------|-----------|
| **Screen Capture** | Real-time screen capture of highlighted area | Shows AI "seeing" what user points at |
| **Voice Input** | Capture voice command via microphone | Natural language interaction |
| **Gemini Live API** | Stream video + audio to Gemini Live | Core sponsor tech showcase |
| **React Component Detection** | Identify React component from visual highlight | Technical wow factor |
| **CSS Property Changes** | Modify colors, spacing, fonts, sizes | Tangible visual changes |
| **Live Preview** | Show updated component immediately | Instant gratification |
| **Single File Support** | Work with one hardcoded React file | Scope constraint |

### 🟡 SHOULD HAVE (Demo-Enhancing)
Nice additions if time permits, but demo works without them.

| Feature | Description | Why Not Critical |
|---------|-------------|------------------|
| **Code Diff View** | Show before/after code side-by-side | Visual polish, not core workflow |
| **Apply/Reject Buttons** | User confirmation before applying | Can auto-apply for demo speed |
| **Multiple CSS Properties** | Change multiple properties at once | Single changes work fine |
| **Component Tree View** | Show detected component hierarchy | Eye candy, not essential |

### 🟢 NICE TO HAVE (Post-Demo)
Do NOT build these during hackathon.

| Feature | Why Cut |
|---------|---------|
| Multi-framework support (Vue, Svelte, Angular) | Pick ONE framework (React) |
| Complex code generation (add new components) | Start with simple CSS changes |
| Undo/redo functionality | Can restart demo if needed |
| GitHub PR integration | Direct file edit is faster for demo |
| Collaboration features | Single user demo |
| Deployment automation | Local demo only |
| Real project file system support | Hardcoded file path is fine |

---

## 3. TECHNICAL ARCHITECTURE

### Stack Decision

```
┌─────────────────────────────────────────────────────────────────┐
│                    TECHNICAL ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   ELECTRON APP  │────▶│  GEMINI LIVE API│◀────│   GOOGLE CLOUD  │
│  (Main Process) │     │   (Multimodal)  │     │   (Vertex AI)   │
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │
         │ Manages
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  SCREEN CAPTURE │     │   REACT PREVIEW │     │   FILE SYSTEM   │
│  (desktopCapturer)    │   (Renderer Process)    │   (Node.js fs)  │
│  • Highlight area     │   • Live component      │   • Read/Write  │
│  • Stream frames      │   • Hot reload          │   • Watch file  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Why Electron?

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Electron** ✅ | Native screen capture, file system access, single executable | Larger bundle | **CHOSEN** |
| Browser Extension | Lighter, easier distribution | No file system access, complex messaging | ❌ |
| Web App | Simplest to build | Can't access local files, screen capture limited | ❌ |
| VS Code Extension | Developer context | Complex API, limited screen capture | ❌ |

### Why React?

- **Most popular framework** = judges understand it
- **Component-based** = clear mapping from visual to code
- **CSS-in-JS or CSS modules** = easy property targeting
- **Hot reload** = instant visual feedback

### Why Direct File Edit (not GitHub PR)?

- **Speed:** No API calls, no auth, no latency
- **Reliability:** Works offline, no network dependencies
- **Demo flow:** Instant apply → instant see result
- **Scope:** Can add PR integration post-hackathon

---

## 4. GCP SERVICES (Minimal)

| Service | Purpose | Why Needed |
|---------|---------|------------|
| **Vertex AI** | Host Gemini Live API endpoint | Required by hackathon |
| **Cloud Storage** | (Optional) Store demo assets | Only if needed |

**Keep it simple:** Use Gemini Live API directly, minimal GCP configuration.

---

## 5. DEMO SCENARIO: 90-SECOND SCRIPT

### The Story
**Meet Sarah**, a frontend developer building a landing page. She's in the zone, but tweaking UI is slowing her down. With VoicePilot, she changes her entire page in seconds—without touching a line of code.

### Frame-by-Frame Breakdown

#### **0:00-0:10 — The Hook (Problem)**
- **Visual:** Split screen. Left: Sarah typing CSS. Right: The same page, unchanged.
- **Voiceover:** "Tweaking UI shouldn't mean hunting through CSS files..."
- **Action:** Sarah sighs, closes VS Code, opens VoicePilot.

#### **0:10-0:25 — Command 1: Color Change (The Magic)**
- **Visual:** Sarah highlights the "Get Started" button on her landing page.
- **Voice:** "Make this button blue"
- **AI Response:** "Changing button background to blue (#3B82F6)"
- **Result:** Button instantly turns blue.
- **Voiceover:** "Just point and speak."

#### **0:25-0:40 — Command 2: Spacing (Range)**
- **Visual:** Sarah highlights the entire hero section.
- **Voice:** "Add more padding here"
- **AI Response:** "Increasing padding from 16px to 48px"
- **Result:** Hero section breathes, looks more premium.
- **Voiceover:** "Spacing, sizing, positioning..."

#### **0:40-0:55 — Command 3: Typography (Polish)**
- **Visual:** Sarah highlights the headline text.
- **Voice:** "Make this font bigger and bolder"
- **AI Response:** "Increasing font-size to 48px, font-weight to 700"
- **Result:** Headline pops, hierarchy improves.
- **Voiceover:** "Typography adjustments in seconds."

#### **0:55-1:15 — Command 4: Layout (Wow Factor)**
- **Visual:** Sarah highlights the feature cards section.
- **Voice:** "Make these cards a grid layout, three columns"
- **AI Response:** "Converting to CSS Grid, 3 columns, 24px gap"
- **Result:** Cards rearrange into clean grid.
- **Voiceover:** "Even complex layout changes..."

#### **1:15-1:25 — The Reveal (Before/After)**
- **Visual:** Side-by-side comparison: Original page vs. VoicePilot-enhanced page.
- **Voiceover:** "From this... to this. No code written."

#### **1:25-1:30 — The Future**
- **Visual:** VoicePilot logo, tagline: "Code with your voice."
- **Voiceover:** "VoicePilot. The future of frontend development."

---

## 6. HARDCODED/MOCKED ELEMENTS

### What's Hardcoded (Acceptable for Demo)

| Element | Hardcoded Value | Why |
|---------|-----------------|-----|
| **Target File** | `/demo/LandingPage.jsx` | Single file, predictable path |
| **Component Mapping** | Visual element → Component name lookup table | Simplifies AI detection |
| **CSS Properties** | Predefined set: colors, spacing, fonts, flex/grid | Limits scope, ensures demo success |
| **Demo Project** | Pre-built React app with styled components | Consistent starting state |
| **AI Responses** | (Optional) Fallback to canned responses if API slow | Demo insurance |

### What's Real (Must Work)

| Element | Implementation |
|---------|----------------|
| **Screen Capture** | Real Electron desktopCapturer API |
| **Voice Input** | Real Web Audio API + Gemini Live streaming |
| **Gemini Live API** | Real multimodal streaming to Vertex AI |
| **File Changes** | Real Node.js fs.writeFile |
| **Hot Reload** | Real React Fast Refresh |

---

## 7. BUILD CHECKLIST (24-48 Hours)

### Hour 0-4: Foundation
- [ ] Initialize Electron app with React
- [ ] Set up basic window (main + renderer processes)
- [ ] Configure screen capture (desktopCapturer)
- [ ] Test: Can capture screen region?

### Hour 4-8: Gemini Integration
- [ ] Set up Gemini Live API connection
- [ ] Implement video frame streaming
- [ ] Implement audio streaming
- [ ] Test: Can send screen + voice to Gemini?

### Hour 8-12: Code Detection
- [ ] Parse React component file
- [ ] Build visual element → component mapping
- [ ] Implement CSS property extraction
- [ ] Test: Can identify component from highlight?

### Hour 12-16: Change Application
- [ ] Implement CSS modification logic
- [ ] Write changes to file system
- [ ] Trigger React hot reload
- [ ] Test: Can change a color property?

### Hour 16-20: UI Polish
- [ ] Build Electron UI (start/stop, status)
- [ ] Add visual feedback (highlight overlay)
- [ ] Add command history/log
- [ ] Test: Full workflow end-to-end?

### Hour 20-24: Demo Prep
- [ ] Create demo React project (landing page)
- [ ] Test all 4 demo commands
- [ ] Record practice runs
- [ ] Fix any blocking bugs

### Hour 24-36: Buffer/Extras
- [ ] Add code diff view (SHOULD HAVE)
- [ ] Add apply/reject buttons (SHOULD HAVE)
- [ ] Polish UI animations
- [ ] Test on clean machine

### Hour 36-48: Final Polish
- [ ] Create demo video
- [ ] Write Devpost submission
- [ ] Final bug fixes
- [ ] Submit before deadline

---

## 8. RISK MITIGATION

| Risk | Mitigation |
|------|------------|
| Gemini Live API latency | Cache responses, have canned fallbacks |
| Screen capture permissions | Test early, include permission prompts |
| File system access | Use Node.js fs, test on target OS |
| React hot reload fails | Add manual refresh button as backup |
| Component detection fails | Hardcode mappings for demo elements |
| Voice recognition errors | Show text transcript, allow retry |

---

## 9. SUCCESS CRITERIA

**Demo is successful if:**
1. ✅ User can highlight any element on screen
2. ✅ User can speak a command
3. ✅ AI identifies the correct component
4. ✅ AI generates valid CSS change
5. ✅ Change applies and shows immediately
6. ✅ All 4 demo commands work reliably
7. ✅ 90-second video tells a clear story

**Demo is NOT successful if:**
- ❌ Requires code typing during demo
- ❌ Changes take >3 seconds to apply
- ❌ AI misidentifies components frequently
- ❌ Requires refreshing/restarting app

---

## 10. POST-HACKATHON ROADMAP

**If we win / continue:**
1. Multi-framework support (Vue, Svelte)
2. VS Code extension
3. GitHub PR integration
4. Undo/redo history
5. Team collaboration features
6. Deployment pipeline integration

---

**Scope Guardian Approval:** This document defines the MINIMUM scope for a winning demo. Any feature not listed here is OUT OF SCOPE for the 24-48 hour build.

**Remember:** Working demo > Impressive-but-broken demo. Ruthlessly cut. Ship what works.
