# VoicePilot — 24-48 Hour Build Checklist

## Hour 0-4: Foundation ⏱️
**Goal:** Electron app running with basic screen capture

### Setup (Hour 0-1)
- [ ] Initialize project: `npm init -y`
- [ ] Install Electron: `npm install electron --save-dev`
- [ ] Install React + Vite: `npm install react react-dom` + `npm install vite @vitejs/plugin-react --save-dev`
- [ ] Create basic folder structure
- [ ] Set up `package.json` scripts for dev/build

### Electron Shell (Hour 1-2)
- [ ] Create `electron.js` (main process entry)
- [ ] Create `preload.js` (IPC bridge)
- [ ] Create basic window (800x600)
- [ ] Test: `npm run dev` opens Electron window

### Screen Capture (Hour 2-4)
- [ ] Implement `desktopCapturer` API
- [ ] Create screen selection UI
- [ ] Test: Can capture entire screen?
- [ ] Implement region selection (click + drag)
- [ ] Test: Can capture specific region?
- [ ] Encode frames to base64 JPEG

**Checkpoint:** Can capture screen region and display it?

---

## Hour 4-8: Gemini Integration ⏱️
**Goal:** Stream video + audio to Gemini Live API

### API Setup (Hour 4-5)
- [ ] Get Gemini API key from Google Cloud Console
- [ ] Install WebSocket client: `npm install ws`
- [ ] Create `geminiClient.js` module
- [ ] Implement WebSocket connection
- [ ] Test: Can connect to Gemini Live API?

### Video Streaming (Hour 5-6)
- [ ] Stream captured frames to Gemini
- [ ] Set frame rate (5 FPS for demo)
- [ ] Test: Gemini receives video stream?
- [ ] Handle connection errors/reconnects

### Audio Streaming (Hour 6-8)
- [ ] Implement Web Audio API in renderer
- [ ] Capture microphone input
- [ ] Stream audio chunks to main process
- [ ] Forward audio to Gemini
- [ ] Test: Gemini receives audio stream?

**Checkpoint:** Can send video + audio to Gemini and get responses?

---

## Hour 8-12: Code Detection ⏱️
**Goal:** Identify component from visual highlight

### File Parser (Hour 8-9)
- [ ] Create `fileSystem.js` module
- [ ] Read hardcoded `LandingPage.jsx`
- [ ] Parse component structure
- [ ] Extract CSS class names

### Component Registry (Hour 9-10)
- [ ] Create `componentRegistry.js`
- [ ] Hardcode visual → component mappings:
  - Button (x: 400, y: 300, w: 120, h: 40)
  - Hero Section (x: 0, y: 0, w: 800, h: 400)
  - Heading (x: 200, y: 150, w: 400, h: 60)
  - Feature Cards (x: 50, y: 500, w: 700, h: 300)
- [ ] Test: Can lookup component from coordinates?

### Gemini Prompt Engineering (Hour 10-12)
- [ ] Craft system prompt for component detection
- [ ] Include component registry in context
- [ ] Parse Gemini response (JSON format)
- [ ] Test: Gemini correctly identifies highlighted component?

**Checkpoint:** Highlight element → Gemini identifies correct component?

---

## Hour 12-16: Change Application ⏱️
**Goal:** Modify CSS and apply changes

### CSS Modifier (Hour 12-13)
- [ ] Create `cssModifier.js` module
- [ ] Implement property changers:
  - [ ] Color (background-color, color)
  - [ ] Spacing (padding, margin)
  - [ ] Typography (font-size, font-weight)
  - [ ] Layout (display, grid, flex)
- [ ] Generate valid CSS from Gemini response

### File Writer (Hour 13-14)
- [ ] Write modified CSS back to file
- [ ] Preserve JSX structure
- [ ] Handle syntax errors gracefully
- [ ] Test: File updates correctly?

### Hot Reload (Hour 14-16)
- [ ] Set up file watcher (chokidar)
- [ ] Trigger React Fast Refresh on change
- [ ] Test: Change applies instantly in preview?
- [ ] Add error boundary for failed reloads

**Checkpoint:** Change CSS → File updates → Preview refreshes automatically?

---

## Hour 16-20: UI Polish ⏱️
**Goal:** Professional-looking interface

### Control Panel (Hour 16-17)
- [ ] Build React UI for control panel
- [ ] Start/Stop capture buttons
- [ ] Status display (Listening, Capturing, Thinking, Applied)
- [ ] Visual feedback animations

### Highlight Overlay (Hour 17-18)
- [ ] Canvas overlay for selection
- [ ] Draw glowing border around selected area
- [ ] Smooth animations
- [ ] Clear visual feedback

### Command Log (Hour 18-19)
- [ ] Display voice commands as text
- [ ] Show AI responses
- [ ] Show applied changes
- [ ] Scrollable history

### Error Handling (Hour 19-20)
- [ ] Handle API errors gracefully
- [ ] Show user-friendly error messages
- [ ] Add retry buttons
- [ ] Fallback to mock responses if needed

**Checkpoint:** UI looks polished and professional?

---

## Hour 20-24: Demo Prep ⏱️
**Goal:** All 4 demo commands work reliably

### Demo Project (Hour 20-21)
- [ ] Create `demo/LandingPage.jsx`
- [ ] Build landing page with:
  - Red "Get Started" button
  - Cramped hero section
  - Small headline text
  - Stacked feature cards
- [ ] Style with CSS modules
- [ ] Test: Page renders correctly?

### Command Testing (Hour 21-23)
- [ ] Test Command 1: "Make this button blue"
- [ ] Test Command 2: "Add more padding here"
- [ ] Test Command 3: "Make this font bigger and bolder"
- [ ] Test Command 4: "Make these cards a grid layout, three columns"
- [ ] Fix any bugs
- [ ] Document exact coordinates for each element

### Practice Runs (Hour 23-24)
- [ ] Run through full demo 3 times
- [ ] Time each segment
- [ ] Adjust timing as needed
- [ ] Record practice run for backup

**Checkpoint:** All 4 commands work 100% reliably?

---

## Hour 24-36: Buffer + Extras ⏱️
**Goal:** Add SHOULD HAVE features if time permits

### Code Diff View (Hour 24-28)
- [ ] Show before/after code side-by-side
- [ ] Syntax highlighting
- [ ] Highlight changed lines
- [ ] Collapsible panel

### Apply/Reject Buttons (Hour 28-32)
- [ ] Preview changes before applying
- [ ] "Apply" button commits changes
- [ ] "Reject" button discards
- [ ] Smooth transitions

### Polish (Hour 32-36)
- [ ] Add loading states
- [ ] Smooth animations
- [ ] Better error messages
- [ ] Test on clean machine

**Checkpoint:** Demo is polished and feature-complete?

---

## Hour 36-48: Final Polish ⏱️
**Goal:** Submit winning entry

### Demo Video (Hour 36-40)
- [ ] Record 90-second demo
- [ ] Edit with cuts/transitions
- [ ] Add background music (optional)
- [ ] Export in correct format
- [ ] Create thumbnail

### Devpost Submission (Hour 40-44)
- [ ] Write compelling description
- [ ] Add screenshots/GIFs
- [ ] List technologies used
- [ ] Write "How we built it" section
- [ ] Write "Challenges we faced" section
- [ ] Add team members

### Final Testing (Hour 44-46)
- [ ] Test on fresh machine
- [ ] Verify all dependencies listed
- [ ] Create setup instructions
- [ ] Test build process

### Buffer (Hour 46-48)
- [ ] Fix any last-minute bugs
- [ ] Submit 30 minutes before deadline
- [ ] Celebrate! 🎉

---

## DAILY CHECKLIST

### Day 1 (Hours 0-24)
- [ ] Foundation complete (screen capture works)
- [ ] Gemini integration complete (streaming works)
- [ ] Code detection complete (component mapping works)
- [ ] Change application complete (file write + reload works)
- [ ] UI is functional (not necessarily pretty)
- [ ] Demo project created
- [ ] At least 2 commands working

### Day 2 (Hours 24-48)
- [ ] All 4 demo commands working
- [ ] UI polished and professional
- [ ] Demo video recorded and edited
- [ ] Devpost submission complete
- [ ] Tested on clean machine
- [ ] Submitted before deadline

---

## EMERGENCY SHORTCUTS

**If running behind schedule, cut these first:**

1. **Code Diff View** — Can demo without it
2. **Apply/Reject Buttons** — Auto-apply is fine
3. **Animations** — Functional > pretty
4. **Error Handling** — Demo on happy path only
5. **Multiple CSS Properties** — Single property changes work

**Never cut these (demo-critical):**
- Screen capture
- Voice input
- Gemini integration
- File write
- Hot reload
- All 4 demo commands

---

## SUCCESS CRITERIA

**Day 1 Success:**
- Can capture screen region
- Can stream to Gemini
- Can identify component
- Can change one CSS property
- Preview updates automatically

**Day 2 Success:**
- All 4 demo commands work
- UI looks professional
- 90-second video complete
- Devpost submission live
- Submitted on time

---

## REMEMBER

> **"Working demo > Impressive-but-broken demo"**

- Ruthlessly cut features if behind schedule
- Test early, test often
- Record backup videos
- Sleep at least 4 hours
- Submit 30 minutes early

**You've got this! 🚀**
