# VoicePilot Demo Script

## 90-Second Demo Flow

### Opening (0-10 seconds)
**Visual:** Show VoicePilot control panel on screen
**Narration:** "Meet VoicePilot - the AI-powered code editor that lets you modify your React apps using just your voice and screen."

### Problem (10-25 seconds)
**Visual:** Quick cuts showing traditional coding workflow
- Switching between VS Code and browser
- Finding the right CSS property
- Saving, refreshing, checking
**Narration:** "Traditional coding means constant context switching. You're bouncing between your editor, browser, and documentation. It's slow and breaks your flow."

### Solution Introduction (25-35 seconds)
**Visual:** Back to VoicePilot control panel
**Action:** Click "Start Session" button
**Narration:** "VoicePilot changes everything. Just start a session and speak naturally."

### Demo - Command 1 (35-50 seconds)
**Visual:** Split screen - VoicePilot on left, Preview window on right showing LandingPage
**Action:** Speak "Make the button blue"
**Visual:** 
- Screen capture highlights the button
- Command appears in log
- Code modification shown
- Preview updates instantly with blue button
**Narration:** "Say 'Make the button blue' - VoicePilot captures your screen, identifies the button, and updates your code instantly."

### Demo - Command 2 (50-65 seconds)
**Action:** Speak "Add more padding to the hero section"
**Visual:**
- Hero section highlighted
- Padding increased in preview
- CSS change shown in log
**Narration:** "Or 'Add more padding to the hero section' - the AI understands context and makes precise changes."

### Demo - Command 3 (65-75 seconds)
**Action:** Speak "Make the title bigger"
**Visual:**
- Title highlighted
- Font size increased
- Change reflected immediately
**Narration:** "No keyboard, no mouse hunting, just your voice."

### Magic Moment (75-85 seconds)
**Visual:** Show all three changes side by side
**Narration:** "Three changes, zero typing, one seamless workflow."

### Future & CTA (85-90 seconds)
**Visual:** Show GitHub repo, Cloud Run URL, and team info
**Narration:** "VoicePilot - The future of code editing. Built with Gemini Live API."

---

## Technical Demo Notes

### Pre-Demo Setup
1. Start backend: `python src/main.py` (port 8080)
2. Start frontend: `npm run dev` in frontend directory
3. Open preview window showing LandingPage.html
4. Test WebSocket connection

### Voice Commands to Demo
1. "Make the button blue" → Changes button background to #3B82F6
2. "Add more padding to the hero section" → Increases hero padding
3. "Make the title bigger" → Increases h1 font-size

### Fallback Plan
If voice recognition fails:
- Use text input in control panel
- Show pre-recorded video of working demo
- Focus on architecture and code quality

### Key Points to Emphasize
- Real-time screen analysis
- Natural language understanding
- Instant code modification
- Live preview updates
- No context switching

---

## Post-Demo Q&A Preparation

### Expected Questions

**Q: How does the screen capture work?**
A: Uses Electron's desktopCapturer API to capture the preview window, then sends frames to Gemini for visual analysis.

**Q: What about accuracy?**
A: Uses hardcoded component mappings for the demo to ensure 100% reliability. In production, would use AI-based component detection.

**Q: Can it handle complex changes?**
A: Currently focused on CSS property modifications. Architecture supports expansion to component generation and layout changes.

**Q: How is this different from GitHub Copilot?**
A: Copilot is text-based in the editor. VoicePilot is multimodal - voice + vision + direct file modification with instant preview.

**Q: What's the latency?**
A: Screen capture → AI analysis → Code modification → Preview update happens in under 2 seconds for the demo.

---

## Backup Demo Video

If live demo fails, show pre-recorded video:
- 60 seconds of the working demo
- Voice commands with visual feedback
- Code changes and preview updates
- End with architecture diagram

---

## Submission Checklist

- [ ] Demo video recorded (90 seconds)
- [ ] GitHub repo public
- [ ] Cloud Run deployment live
- [ ] README complete
- [ ] Architecture diagram included
- [ ] Screenshots of deployment proof