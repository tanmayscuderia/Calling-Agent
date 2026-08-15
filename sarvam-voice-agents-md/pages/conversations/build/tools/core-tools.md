# Core tools

Source: https://docs.sarvam.ai/conversations/build/tools/core-tools

Core tools are **built-in** tools the harness provides. They run **during the call**, and each is enabled automatically based on the agent’s settings and what’s attached, rather than added by hand.

| Core tool | What it does | Enabled when |
| --- | --- | --- |
| **End call** | Lets the agent hang up when the conversation is finished | Always available, it’s a required tool call |
| **KB Query** | Searches the attached knowledge base for answers to factual questions | A [knowledge base](https://docs.sarvam.ai/conversations/build/knowledge-base) is attached |
| **Voicemail detection** | Detects answering machines and leaves a voicemail | ”Voicemail” is enabled in [settings](https://docs.sarvam.ai/conversations/build/conversation-settings#voicemail-detection-and-message) |
| **Language switch** | Lets the agent change the spoken language mid-call | ”Switch language during call” is enabled in [settings](https://docs.sarvam.ai/conversations/build/conversation-settings#language-personalisation) |
