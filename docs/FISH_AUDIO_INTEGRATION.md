# Fish Audio Integration Plan (Deferred — Not Yet Implemented)

> **Status: PLANNED — do not implement yet.** This doc captures the full research and
> integration design so we can pick it up later. Nothing in the codebase currently
> uses Fish Audio.
>
> Researched: Aug 2026 · Source docs: `fish-audio-docs-md/` (local copy of docs.fish.audio)

---

## 1. Why Fish Audio

Fish Audio (fish.audio) is a voice AI platform with both STT and TTS in one API:

| Feature | Endpoint | Cost |
|---------|----------|------|
| **TTS** (text→speech) | `POST https://api.fish.audio/v1/tts` | `s2.1-pro-free` = **$0** · `s2.1-pro` = $15/M UTF-8 bytes |
| **STT** (speech→text) | `POST https://api.fish.audio/v1/asr` (BETA) | `transcribe-1` = $0.36/audio-hour |
| **Streaming TTS** | WebSocket (`tts-live`) | same TTS pricing |
| **Voice cloning** | `POST /v1/model` | free (IVC instant cloning) |
| **Voice design** | `POST /v1/voice-design` | $0.01/successful request |

Key facts from the docs:

- **TTS models:** `s2.1-pro` (recommended prod), `s2.1-pro-free` (free dev tier), `s2-pro`, `s1`.
- **TTS formats:** `mp3`, `wav`, `pcm`, `opus` (48 kHz). Opus is WhatsApp's native
  voice-note codec — no transcoding needed.
- **Prosody control:** `speed` (0.5–2.0), `volume` (−20..20), `normalize_loudness`.
- **Latency modes:** `low` / `balanced` / `normal`.
- **Telephony:** can synthesize directly at 8 kHz WAV/PCM for SIP/IVR pipelines.
- **Rate limits are concurrency-based:** 5 concurrent (Starter) → 15 (≥$100 paid) → 50 (≥$1000 paid).
- **ASR** returns `{ text, duration, segments[] }` — accepts form-data file upload.
- JS SDK exists (`fish-audio`) but its `Backends` type is outdated; **direct REST
  `fetch()` is the cleaner path** (matches our `llmClient.ts` pattern).

## 2. Target Architecture

```
Voice note arrives (WhatsApp) / Mic input (Call demo)
         ↓
  Fish Audio ASR → text        POST api.fish.audio/v1/asr
         ↓
  DeepSeek (existing llmClient.ts) — lead parsing, inventory search, reply
         ↓
  Fish Audio TTS → opus/mp3    POST api.fish.audio/v1/tts (s2.1-pro-free)
         ↓
  Reply sent as voice note (WhatsApp) / played in browser (Call demo)
```

Design principles (mirrors our messaging-adapter philosophy):

- Direct REST wrapper, no SDK dependency.
- Graceful fallback: if `FISH_AUDIO_API_KEY` is missing or a call fails, fall back
  to current behavior (placeholder text for voice notes, browser `speechSynthesis`
  for the call demo).
- Keep STT and TTS independent toggles (understand voice now, reply-with-voice later).

## 3. Implementation Plan (4 Phases)

### Phase 1 — Fish Audio client + config  *(quick win, no user-facing change)*

**New file: `backend/src/ai/fishAudioClient.ts`**

```ts
// Sketch — direct REST wrapper, mirrors llmClient.ts style
const ASR_URL = "https://api.fish.audio/v1/asr";
const TTS_URL = "https://api.fish.audio/v1/tts";

export interface TranscribeResult { text: string; duration?: number }
export interface SynthesizeOptions {
  format?: "mp3" | "wav" | "pcm" | "opus";   // default "mp3" (opus for WhatsApp)
  sampleRate?: number;                        // 8000 for telephony, 48000 for opus
  voiceId?: string;                           // reference_id (cloned/designed voice)
  latency?: "low" | "balanced" | "normal";
  speed?: number;                             // 0.5–2.0
}

export async function transcribe(
  audio: Buffer, mimeType: string, language?: string
): Promise<TranscribeResult | null>          // null = disabled/failed → caller falls back

export async function synthesize(
  text: string, opts?: SynthesizeOptions
): Promise<Buffer | null>                    // null → caller falls back to text
```

Notes:
- TTS request: JSON body, `Authorization: Bearer <key>`, `model: s2.1-pro-free` **header**
  (the model is a header, not a body field — per API reference).
- ASR request: `multipart/form-data` with `audio` file field (+ optional `language`,
  `ignore_timestamps`). Node 20+ has native `FormData`/`Blob`, or use `form-data` pkg
  (check what Fastify multipart gives us first).
- Add timeouts + single retry; log failures via existing logger; never throw into the
  WhatsApp pipeline.

**Modify: `backend/src/config.ts`**

```ts
fishAudio: {
  apiKey: process.env.FISH_AUDIO_API_KEY || "",
  ttsModel: process.env.FISH_AUDIO_TTS_MODEL || "s2.1-pro-free",
  voiceId: process.env.FISH_AUDIO_VOICE_ID || "",   // empty = default voice
  sttLanguage: process.env.FISH_AUDIO_STT_LANGUAGE || "", // "" = auto-detect
}
```

**Modify: `.env.example`**

```
FISH_AUDIO_API_KEY=
FISH_AUDIO_TTS_MODEL=s2.1-pro-free
FISH_AUDIO_VOICE_ID=
FISH_AUDIO_STT_LANGUAGE=
AI_VOICE_REPLIES=false        # Phase 3 toggle
```

### Phase 2 — WhatsApp voice note understanding

**Modify: `backend/src/whatsapp/baileysClient.ts`** (audio media download section,
currently sets placeholder `[voice note — please send your query as text]`)

Flow:
1. Download voice note buffer (already implemented).
2. Call `fishAudioClient.transcribe(buffer, mimeType)`.
3. If transcript returned → set `parsed.text` to transcript, keep `messageType: "audio"`,
   store transcript in `metadata.transcript`.
4. If null/disabled → keep existing placeholder behavior.

Because every downstream step (lead create, intent extraction, inventory search,
reply) reads `parsed.text`, **the whole AI pipeline works with voice notes unchanged**.
Zero frontend changes. Mark the saved `customer_messages` row as transcribed in
`metadata` for auditing.

### Phase 3 — WhatsApp voice replies (toggle: `AI_VOICE_REPLIES=true`)

After `realEstateAgent.respondToMessage` produces the reply text:

1. `synthesize(reply, { format: "opus" })` → opus buffer (WhatsApp-native).
2. Upload to Supabase Storage (`storageService.ts`) → public URL.
3. Send via Baileys as `{ audio: { url }, mimetype: "audio/ogg; codecs=opus", ptt: true }`
   instead of `{ text: reply }`.
4. Still save the **text** reply in `customer_messages.body` + audio URL in `media_url`.
5. On any TTS failure → send text reply (graceful fallback).

### Phase 4 — Call demo with real audio (mic in, spoken agent out)

**Modify: `backend/src/routes/calls.routes.ts`** — `POST /api/calls/:id/turn`:
- Accept `multipart/form-data` with an audio file in addition to JSON text.
- Transcribe customer audio → run call agent → `synthesize(agentReply, { format: "mp3" })`.
- Return `{ agentReply, callSessionId, audioBase64? }` (base64 audio in JSON keeps
  the frontend simple for now; switch to a binary endpoint if payload size hurts).

**Modify: `frontend/src/components/CallDemoModal.tsx`**:
- Mic button using `MediaRecorder` (send recorded blob as the turn input).
- Play agent reply via `<audio>` when `audioBase64` present; else fall back to
  `speechSynthesis` (current behavior).
- Keep the text input as a permanent fallback.

## 4. Cost & Rate-Limit Notes (for demo planning)

- TTS on `s2.1-pro-free` = $0 — safe for unlimited demo runs.
- ASR ≈ $0.36/hour → a typical 20-second demo voice note ≈ $0.002. Negligible.
- Starter tier = **5 concurrent requests** — fine for a single-bridge demo; the docs'
  formula: `QPS ≈ concurrency / avg_request_duration`. A voice-agent turn (~4s) ≈ 75 QPM at 5 concurrency.
- 1M UTF-8 bytes ≈ 180k English words ≈ 12h speech — a paid-TTS fallback budget
  reference if we ever switch off the free model.

## 5. Prerequisites / Open Items Before Implementation

- [ ] Fish Audio account + API key (fish.audio/auth/signup → API Keys page).
- [ ] Decide agent voice: default voice, or design/clone one and capture `FISH_AUDIO_VOICE_ID`.
- [ ] Confirm multipart approach for ASR from Node (native `FormData` vs `form-data` pkg).
- [ ] Confirm Supabase Storage bucket for generated audio (Phase 3) + public-read policy.
- [ ] Decide whether call-demo audio returns base64-in-JSON or a binary stream (Phase 4).
- [ ] Optional later: streaming TTS over WebSocket for lower latency (FlushEvent at
      turn boundaries) — not needed for the demo.

## 6. Reference Docs (local copies)

- API reference: `fish-audio-docs-md/pages/api-reference/endpoint/openapi-v1/text-to-speech.md`
- ASR: `fish-audio-docs-md/pages/api-reference/endpoint/openapi-v1/speech-to-text.md`
- Voice-agent loop cookbook: `fish-audio-docs-md/pages/developer-guide/sdk-guide/cookbook/voice-agent-loop.md`
- Realtime LLM→speech: `fish-audio-docs-md/pages/developer-guide/sdk-guide/cookbook/realtime-llm-to-speech.md`
- Telephony 8kHz: `fish-audio-docs-md/pages/developer-guide/sdk-guide/cookbook/telephony-8khz-audio.md`
- Pricing/limits: `fish-audio-docs-md/pages/developer-guide/models-pricing/pricing-and-rate-limits.md`
- JS SDK reference: `fish-audio-docs-md/pages/api-reference/sdk/javascript/api-reference.md`

## 7. Suggested Build Order When We Resume

1. Phase 1 (client + config + env) — half day.
2. Phase 2 (voice-note transcription) — highest demo impact, ~15 lines in `baileysClient.ts`.
3. Phase 4 (call demo audio) — mic + TTS playback.
4. Phase 3 (voice replies) — only if the client wants AI voice-note replies.