# Instant Outbound webhook payload

Source: https://docs.sarvam.ai/conversations/api/instant-outbound/webhook-payload

After each instant outbound call attempt completes — whether or not it connected — Sarvam sends a `POST` request to the webhook URL you provided in `webhook_config` when creating the call. Use this to track call outcomes, sync agent-extracted data to your systems, and trigger downstream workflows.

## Payload schema

| Field | Type | Description |
| --- | --- | --- |
| `attempt_id` | string (required) | Unique identifier for this call attempt. Matches the `attempt_id` returned in the Create Instant Outbound Call response. |
| `status` | string (required) | Outcome of the call attempt. One of `connected`, `no_answer`, `busy`, `failed` (see below). |
| `channel_info` | object (required) | Information about the telephony channel used for the call. |
| `duration` | number | null | Call duration in seconds. `null` if the call did not connect. |
| `interaction_id` | string | null | Unique interaction ID for retrieving transcripts and recordings via the Analytics API. `null` if the call did not connect. |
| `failure_reason` | string | null | Human-readable reason for failure, typically prefixed with the provider name (e.g. `"exotel: Phone number is registered under TRAI NDNC"`). `null` on successful or unanswered calls. |
| `final_agent_variables` | object | null | Agent variables at the end of the conversation, containing any data extracted or updated during the call. `null` if the call did not connect. |
| `webhook_config` | object | null | The webhook configuration passed when creating the call, echoed back for correlation. |
| `interaction_transcript` | array | null | Transcript of the conversation as a list of turns. `null` if the call did not connect. |

### `status` values

| Value | Meaning |
| --- | --- |
| `connected` | Call was answered and a conversation took place. |
| `no_answer` | The recipient did not pick up. |
| `busy` | The recipient’s line was busy. |
| `failed` | Call could not be placed (provider error, invalid number, and so on). |

### `channel_info` properties

| Field | Type | Description |
| --- | --- | --- |
| `channel_type` | string (required) | Type of communication channel. One of `"v2v"`, `"whatsapp"`. |
| `channel_provider` | string (required) | Telephony provider used to place the call (e.g. `"exotel"`, `"twilio"`). |
| `agent_phone_number` | string (required) | Phone number used by the agent for this call, in E.164 format. |

### `webhook_config` properties

| Field | Type | Description |
| --- | --- | --- |
| `url` | string (required) | The webhook URL the payload was delivered to. |
| `metadata` | object | null | Custom metadata you attached to the webhook configuration. Useful for passing through external IDs or routing tags. |

### `interaction_transcript` item

| Field | Type | Description |
| --- | --- | --- |
| `role` | string (required) | Speaker role — `"agent"` or `"user"`. |
| `en_text` | string (required) | English text of the turn (translated if the conversation was in another language). |

## Examples

### Connected call

```json
{
  "attempt_id": "44b4f89d-252b-4585-ad2e-0ed5842cc6c5",
  "status": "connected",
  "channel_info": {
    "channel_type": "v2v",
    "channel_provider": "exotel",
    "agent_phone_number": "+91804XXXXXXX"
  },
  "duration": 16.83,
  "interaction_id": "20250920/1ae056a30013510b66a6a0",
  "failure_reason": null,
  "final_agent_variables": {
    "customer_name": "Amit",
    "disposition": "NA",
    "call_step": "IDENTITY VERIFIED",
    "tenure": "10 years"
  },
  "webhook_config": {
    "url": "https://your-server.example.com/webhook",
    "metadata": null
  },
  "interaction_transcript": [
    { "role": "agent", "en_text": "Hello, am I speaking with Amit?" },
    { "role": "user", "en_text": "Yes, this is Amit." },
    { "role": "agent", "en_text": "Great, I'm calling regarding your account. Could you confirm your date of birth for verification?" },
    { "role": "user", "en_text": "Sure, it's 15th March 1990." }
  ]
}
```

### No answer

```json
{
  "attempt_id": "df5b6536-5130-4a43-bc5d-6771d1f93355",
  "status": "no_answer",
  "channel_info": {
    "channel_type": "v2v",
    "channel_provider": "exotel",
    "agent_phone_number": "+91804XXXXXXX"
  },
  "duration": null,
  "interaction_id": null,
  "failure_reason": null,
  "final_agent_variables": null,
  "webhook_config": {
    "url": "https://your-server.example.com/webhook",
    "metadata": null
  },
  "interaction_transcript": null
}
```

### Provider failure

```json
{
  "attempt_id": "951e49d8-d9a5-45a9-aed4-c42366d29129",
  "status": "failed",
  "channel_info": {
    "channel_type": "v2v",
    "channel_provider": "exotel",
    "agent_phone_number": "+91804XXXXXXX"
  },
  "duration": null,
  "interaction_id": null,
  "failure_reason": "exotel: Phone number is registered under TRAI NDNC",
  "final_agent_variables": null,
  "webhook_config": {
    "url": "https://your-server.example.com/webhook",
    "metadata": null
  },
  "interaction_transcript": null
}
```

The `webhook_config` object is echoed back in every payload. If you passed custom `metadata` when creating the call, it appears here — useful for correlating webhooks with your internal records.
