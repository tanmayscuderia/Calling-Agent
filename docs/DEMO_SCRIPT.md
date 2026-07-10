# Demo Script — WhatsApp AI + Calling Agent Platform

Step-by-step walkthrough to demonstrate the full product to a client.

> **This script uses Real Estate as the default demo**, but the platform supports 12 industries out of the box. Each industry has its own persona, inventory schema, intents, and reply templates — all configurable from the Agent Settings UI with no code changes.

## Supported Industries

| Industry | Default Persona | Inventory Type |
|----------|----------------|----------------|
| 🏢 **Real Estate** *(default demo)* | Priya (Sales Assistant) | real_estate_units |
| 🎓 Education | Meera (Admissions Counselor) | education_programs |
| 🏥 Healthcare | Aarti (Appointment Coordinator) | — |
| 💰 Finance | Arjun (Financial Advisor) | — |
| 🛍️ E-Commerce | Riya (Shopping Assistant) | ecommerce_products |
| ✈️ Travel | Karan (Travel Consultant) | travel_packages |
| 💪 Fitness | Maya (Fitness Consultant) | fitness_plans |
| 🍽️ Restaurant | Chef (Reservation Manager) | — |
| ⚖️ Legal | Vikram (Legal Intake Specialist) | — |
| 🚗 Automotive | Raj (Sales Advisor) | — |
| 💅 Salon/Spa | Nikki (Booking Assistant) | salon_services |
| 🛡️ Insurance | Anjali (Insurance Advisor) | — |

> **To demo a different industry:** Go to `/dashboard/agent-settings`, select an industry template, customize persona/name/inventory fields, then send test WhatsApp messages. The AI will adapt automatically.

---

## Pre-Demo Checklist

- [ ] Backend running (`cd backend && npm run dev`)
- [ ] Frontend running (`cd frontend && npm run dev`)
- [ ] DeepSeek API key set in `.env`
- [ ] Supabase migrations run + demo seed loaded
- [ ] Test phone available (different from bridge phone)
- [ ] Internet working

---

## Step 1: Show Inventory (30 sec)

**Open:** http://localhost:3000/dashboard/inventory

**Say:** "Here's the property inventory. We've pre-loaded 5 demo properties across Noida."

**Show:**
- 5 properties in the table
- Point out: Project, Location, Configuration, Price Range, Possession
- Mention filters: City, Sector, Configuration, Budget

---

## Step 2: Show Dashboard (30 sec)

**Open:** http://localhost:3000/dashboard

**Say:** "This is the main dashboard. It shows live metrics — leads, conversations, AI replies, calls."

**Show:**
- Stat cards (Total Leads, Hot Leads, Open Conversations, AI Replies Today, Calls, Properties)
- Notice the staggered card entrance animations and smooth spring hovers

**Optional UI Polish note:** "Every interaction has been polished — route transitions, hover states, the call modal. This isn't a rough prototype; the UI feels like a finished product."

---

## Step 3: Connect WhatsApp (2 min)

**Open:** http://localhost:3000/dashboard/whatsapp

**Do:**
1. Click **Start Bridge**
2. Look at backend terminal — see QR code
3. On your phone: WhatsApp → Settings → Linked Devices → Link a Device
4. Scan the QR code

**Say:** "The bridge connects via WhatsApp Web. This is for prototype speed — production uses Meta Cloud API."

**Status changes to:** `connected`

---

## Step 4: Test AI Reply — Message 1 (1 min)

**From the test phone, send WhatsApp to the bridge number:**

```
Hi, I am looking for a 3BHK in Noida around 2 crore
```

**Expected AI reply (within 3-5 seconds):**

```
Yes, we have a 3BHK option in Sector 150 around ₹1.65–2.1 Cr.
Are you looking for end-use or investment?
```

**Say:** "The AI extracted intent: 3BHK, Noida, 2 Cr budget. It searched the inventory, found Demo Heights, and replied in a natural sales tone."

---

## Step 5: Test AI Reply — Message 2 (1 min)

**Send:**

```
End use, possession by 2027 is fine
```

**Expected AI reply:**

```
Great. Demo Heights in Sector 150 fits this: 3BHK, approx ₹1.65–2.1 Cr,
possession 2027. Would you like a callback or site visit?
```

**Say:** "The AI remembered the context, confirmed the property matches, and is now pushing for a conversion action — callback or site visit."

---

## Step 6: Test AI Reply — Message 3 (1 min)

**Send:**

```
Yes call me today evening
```

**Expected AI reply:**

```
Sure, I have noted that. Our team can call you today evening.
Please share your preferred time slot.
```

---

## Step 7: Show CRM Lead (2 min)

**Open:** http://localhost:3000/dashboard/leads

**Show:**
- New lead appeared (from the test phone number)
- Temperature badge: **Hot** (red)
- Status: **Qualified**
- Budget: ₹2 Cr
- Location: Noida / Sector 150
- Configuration: 3BHK

**Click the lead** to open detail page.

**Show:**
- **Preferences section** — auto-filled by AI (3BHK, Noida, 2 Cr, end-use, 2027)
- **AI Summary** — auto-generated lead summary
- **Conversation History** — all messages with AI-generated badges
- **Recommended Properties** — Demo Heights with match score
- **Follow-ups** — callback scheduled

**Say:** "Every message updated the lead automatically. The AI extracted preferences, scored the lead as hot, and scheduled a follow-up."

---

## Step 8: Show Conversations Inbox (1 min)

**Open:** http://localhost:3000/dashboard/conversations

**Show:**
- WhatsApp-style inbox
- Conversation list on left
- Chat messages on right
- AI-generated messages have a badge
- Human handoff button

**Say:** "You can see all conversations here. If you want to take over from AI, click Human Handoff — the AI stops replying."

---

## Step 9: AI Call Demo (2 min)

**Open:** Lead detail page → Click **Start AI Call Demo**

**What happens:**
1. Call modal opens
2. AI (Priya) speaks opening line via browser TTS:
   > "Hi, this is Priya from Demo Realty. I saw your enquiry for a 3BHK in Noida. Is this a good time?"
3. You type the customer reply:
   ```
   Yes
   ```
4. AI responds:
   > "Great. Is this for end-use or investment?"
5. Continue conversation:
   ```
   End use
   ```
6. AI:
   > "Perfect. We have Demo Heights in Sector 150, 3BHK around ₹1.65–2.1 Cr. Would you like to schedule a site visit?"
7. Type:
   ```
   Yes schedule it
   ```
8. AI wraps up

**Click End Call**

**Show:**
- Call summary generated
- Outcome: `site_visit_requested`
- Lead temperature updated to **Hot**
- Follow-up created automatically
- Transcript saved in call session

---

## Step 10: Show Upload Feature (1 min)

**Open:** http://localhost:3000/dashboard/upload

**Say:** "You can upload new inventory via CSV. Here's the format."

**Show:**
- Expected CSV columns listed
- Upload button
- Or click "Seed Sample Data" to re-load demos

---

## Step 11: Show Agent Settings (Multi-Industry) (1 min)

**Open:** http://localhost:3000/dashboard/agent-settings

**Say:** "The platform isn't locked to real estate. You can switch industries, customize the AI persona, and configure inventory fields — all from this UI."

**Show:**
- Industry template selector (12 industries)
- Persona name + role (editable)
- System prompt (auto-generated from template)
- Inventory fields (configurable per industry)
- Intent mappings (what the AI extracts from messages)
- Reply templates (customizable tone/style)

**Optional:** Switch to "Education" template live, show how the prompt and fields change instantly.

---

## Post-Demo Talking Points

### What the client is buying:
1. **WhatsApp lead monitoring** — every message captured
2. **AI property qualification** — instant, grounded replies
3. **Inventory-grounded** — AI never invents properties
4. **CRM visibility** — full pipeline, temperature, status
5. **Calling-agent follow-up** — automated call summaries
6. **Human handoff** — seamless AI-to-human transition

### Production migration:
> "This prototype uses a WhatsApp Web bridge for fast demonstration.
> The production deployment will use Meta Cloud API.
> The AI, CRM, inventory upload, lead qualification, and calling-agent
> workflows are the main product and remain the same."

### Key differentiators:
- AI only recommends **actual inventory** (no hallucination)
- Lead scoring is **automatic** (hot/warm/cold)
- Every AI action is **logged** for audit
- **Multi-channel ready** (WhatsApp today, Telegram/Web tomorrow)
- **Polished UX** — Framer Motion animations throughout (route transitions, spring hovers, animated call modal, staggered card entrances)

---

## Troubleshooting During Demo

| Issue | Fix |
|-------|-----|
| WhatsApp not connecting | Restart backend, re-scan QR |
| AI not replying | Check `DEEPSEEK_API_KEY` in `.env` |
| No leads appearing | Check `DEFAULT_ORG_ID` in `.env` |
| Call demo no sound | Check browser audio / volume |
| Properties not showing | Run seed: `POST /api/upload/seed-sample` |

---

## Quick API Test (no WhatsApp needed)

```bash
# Test AI without WhatsApp
curl -X POST http://localhost:3001/api/ai/simulate \
  -H "Content-Type: application/json" \
  -d '{"text":"I want a 3BHK in Noida around 2 crore"}'

# Check LLM status
curl http://localhost:3001/api/ai/status

# Check inventory
curl "http://localhost:3001/api/inventory/search?configuration=3BHK&budgetMax=20000000"
```
