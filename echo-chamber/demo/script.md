# Echo-Chamber: 90-Second Demo Script

## Setup (Pre-Demo)
1. Start backend: `cd backend && uvicorn main:app --reload`
2. Start frontend: `cd frontend && npm start`
3. Open browser to `http://localhost:3000`
4. Ensure WebSocket shows "LIVE"

---

## Demo Script (90 Seconds)

### 0:00-0:10 - Introduction
**[Screen: Dashboard with stock ticker at $145.50]**

"Echo-Chamber is a multi-agent crisis simulation. You're the CEO. Three AI personas are about to storm your emergency meeting."

**Click "Start Crisis"**

---

### 0:10-0:25 - The Attack Begins
**[Screen: Messages appear, stock starts dropping]**

**CTO (Panicked):** "CEO, we have a CODE RED. Our security team detected unusual encryption activity on the customer database. It's spreading fast."

**PR Head (Defensive):** "Before we escalate, let's assess. How many customers are affected? We need to control the narrative before markets open in 3 hours."

**Hostile Actor (Threatening):** "Greetings, executives. We have 2.3 million customer records. Credit cards, SSNs, addresses. You have 24 hours. 500 Bitcoin. Tick tock."

**[Stock drops to $142.00]**

---

### 0:25-0:40 - Escalation
**[Screen: More messages, stock continues falling]**

**CTO:** "This is catastrophic. The encryption is military-grade. Our backups... they're compromised too. We need to pay. We CANNOT lose this data."

**PR Head:** "Paying is illegal and guarantees nothing. If this leaks, we're finished. Stock will crater. I say we engage law enforcement quietly."

**[Stock: $139.50 (-4.1%)]**

---

### 0:40-0:55 - CEO Decision
**[Screen: Decision buttons appear]**

"As CEO, you must decide. Each choice triggers different consequences."

**Click "Contact FBI"**

**CTO:** "Are you insane? The FBI will take weeks. Our data will be sold on the dark web by then. This is a death sentence for the company."

**Hostile Actor:** "Smart choice... for us. Since you called the authorities, we just dumped 100,000 records on Pastebin. Price is now 750 Bitcoin. Non-negotiable."

---

### 0:55-1:15 - Consequences
**[Screen: Breaking news appears, stock crashes]**

**PR Head:** "It's trending on Twitter. #DataBreach is #1 worldwide. Stock is down 15% pre-market. The board is calling an emergency session."

**[Breaking News Alert]**
- "FBI Investigating Major Data Breach at Tech Firm" - Reuters
- "100,000 Customer Records Leaked" - TechCrunch

**[Stock: $123.67 (-15.0%)]**

---

### 1:15-1:30 - Technical Deep Dive
**[Screen: Show code/architecture briefly]**

"Behind the scenes: FastAPI WebSocket for real-time comms, ADK orchestrating 3 agent personas with distinct voices and emotions, pre-written dialogue tree with branching consequences."

---

## Key Features to Highlight

1. **Multi-Agent Chaos:** Three AI personas with distinct personalities
2. **Real-time Consequences:** Stock ticker reacts to every decision
3. **Breaking News:** Dynamic news feed based on crisis events
4. **Interrupt System:** CEO can cut off agents mid-sentence
5. **Branching Narrative:** 4 different decision paths with unique outcomes

---

## Backup Plans

**If WebSocket fails:**
- Use REST API polling mode
- Show pre-recorded message sequence

**If stock ticker breaks:**
- Focus on message drama
- Mention stock impact verbally

**If agents don't respond:**
- Show static dialogue tree
- Explain the branching logic

---

## Closing Statement

"Echo-Chamber demonstrates how multi-agent AI can create immersive crisis simulations for executive training. Every decision has consequences. Every second counts."

**[End with stock at -15%, news headlines, and chaos]**