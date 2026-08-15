# Speakers & voice

Source: https://docs.sarvam.ai/conversations/build/voice-language

Configure how the agent sounds. These controls live in the **Speaking** section of the agent’s [Settings](https://docs.sarvam.ai/conversations/build/conversation-settings).

## Voice

Pick the **voice**, who your agent sounds like (for example, `Shubh`). Preview it with the play button, and use the gear for voice-specific configuration.

## Speaking speed

**Speaking speed** controls how fast the agent talks, set with a slider (for example, `1.05x`).

## Pitch

**Pitch** raises or lowers the tone of voice, set with a slider (for example, `0.00`).

## Pronunciation dictionary

Upload a **pronunciation dictionary** (Advanced) so names, brands, and terms are spoken the way you want. It takes a **JSON file up to 5 MB**, and a **sample file** is downloadable if you’re unsure of the format.

Pronunciations are configured **per language and per word**, so the same term can be handled differently in each language. Under a top-level `pronunciations` key, add a block per language, then `"word": "how to say it"` pairs:

```json
{
  "pronunciations": {
    "Odia": {
      "Women & Child Development Department": "ମହିଳା ଓ ଶିଶୁ ବିକାଶ ବିଭାଗ",
      "installment": "କିସ୍ତି"
    },
    "Hindi": {
      "cotton": "cotton",
      "B2B": "B to B"
    },
    "English": {
      "cotton": "cotton",
      "B2B": "B to B"
    },
    "Bengali": {
      "cotton": "cotton",
      "B2B": "B to B"
    }
  }
}
```

**Phonemes are not supported yet.** For brand and proper-noun pronunciations, replace the term with its **Indic-script spelling** (for example, the Hindi word for it). Indic languages, including Hindi, are highly phonetic and information-rich, so writing a term in Indic script usually yields the most accurate pronunciation. Spell out abbreviations the way they should be read (for example, `B2B` becomes `B to B`).

## Voice cloning (enterprise)

Voice cloning is available to **enterprise** customers only (the rest of the voice catalogue is available to everyone). Enterprises can clone a custom voice for a brand persona or a specific speaker. See [Content Agents voice cloning](https://docs.sarvam.ai/creative-voice-cloning) for the overlapping cloning flow.

## Languages

Language behaviour is configured in [Conversation settings → Language personalisation](https://docs.sarvam.ai/conversations/build/conversation-settings#language-personalisation): the **starting language**, **switch language during call** (the agent follows the caller when they change language), the **languages allowed**, **auto-detected language switch**, and **output numbers in Indic**. The greeting can also produce [translations](https://docs.sarvam.ai/conversations/build/navigating-workspace#greeting) across those languages.

![Agent Settings showing Language personalisation controls for starting language, switch during call, and languages allowed.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/c3c14581104b782bb215584eb908950370c9223826ff376dfad99ac77fb2453c/voice-agents/images/settings-language.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091910Z&X-Amz-Expires=604800&X-Amz-Signature=676e2c5069e9acb48e1177afa75989d08b2e4586d278ba0a1893be7eb2bbec79&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Language personalisation in Settings.
