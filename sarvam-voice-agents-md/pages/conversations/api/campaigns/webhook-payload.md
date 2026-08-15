# Campaigns webhook payload

Source: https://docs.sarvam.ai/conversations/api/campaigns/webhook-payload

After each call attempt completes — whether or not it connected — Sarvam sends a `POST` request to your webhook URL with the attempt result. Configure the webhook URL in the campaign’s `app_config.webhook_config`.

## Payload schema

| Field | Type | Description |
| --- | --- | --- |
| `app_id` | string (required) | ID of the agent. |
| `app_version` | integer (required) | Version of the agent. |
| `attempt_id` | string (required) | Unique identifier for this call attempt. |
| `campaign_id` | string (required) | Campaign this attempt belongs to. |
| `cohort_id` | string (required) | Cohort this attempt belongs to. |
| `completion_status` | string (required) | Outcome of the call. One of `completed`, `partial`, `failed`. |
| `connectivity_status` | string | null | Whether the call connected. One of `connected`, `busy`, `no_answer`, `failed`, or `null`. |
| `next_action_status` | string | null | Next action for the retry engine (`retry`, `reschedule`, `business_retry`, `short_duration_retry`, `provider_error_retry`, `internal_error_retry`), or `null` if terminal. |
| `failure_reason` | string | null | Reason for failure, if applicable. |
| `user_identifier` | string (required) | Unique identifier for the user (from cohort transformation config). |
| `user_phone_number` | string (required) | Phone number of the user in E.164 format. |
| `agent_phone_number` | string | null | Phone number used by the agent for the call. |
| `duration` | number | null | Call duration in seconds. `null` if the call did not connect. |
| `interaction_id` | string | null | Unique interaction ID for retrieving transcripts and recordings. `null` if the call did not connect. |
| `retry_attempt` | integer (required) | Which attempt this is (`0` = first attempt, `1` = first retry, and so on). |
| `executed_at` | string | null | Timestamp when the call was executed (ISO 8601). |
| `initial_agent_variables` | object | null | Agent variables passed to the call from the cohort. |
| `final_agent_variables` | object | null | Agent variables at the end of the conversation. `null` if the call did not connect. |
| `interaction_transcript` | array | null | Transcript of the conversation as a list of turns. Each turn has `role` (`"agent"` or `"user"`) and `en_text`. `null` if the call did not connect. |
| `metadata` | object | null | Custom metadata from the webhook configuration. |

## Examples

### Connected attempt

```json
{
  "app_id": "my-agent-app",
  "app_version": 1,
  "attempt_id": "019d392a-4f5a-7db3-904a-6ecebb9aac96",
  "campaign_id": "welcome-campaign-2026",
  "cohort_id": "cohort-batch-01",
  "completion_status": "completed",
  "connectivity_status": "connected",
  "next_action_status": null,
  "failure_reason": null,
  "user_identifier": "user-1001",
  "user_phone_number": "+919876543210",
  "agent_phone_number": "+91804XXXXXXX",
  "duration": 42.5,
  "interaction_id": "20260329/a1b2c3d4-10:30:00-e5f6a7b8",
  "retry_attempt": 0,
  "executed_at": "2026-03-29T10:30:45+05:30",
  "initial_agent_variables": {
    "customer_name": "Rahul Kumar",
    "outstanding_amount": "1500"
  },
  "final_agent_variables": {
    "payment_confirmed": "yes",
    "sentiment": "positive"
  },
  "interaction_transcript": [
    { "role": "agent", "en_text": "Hello Rahul, I'm calling about your pending payment of 1500 rupees." },
    { "role": "user", "en_text": "Yes, I'll pay today." }
  ],
  "metadata": { "team": "collections" }
}
```

### Not connected attempt

```json
{
  "app_id": "my-agent-app",
  "app_version": 1,
  "attempt_id": "019d392a-11c6-72bd-8eb7-c37e84bbd1f3",
  "campaign_id": "welcome-campaign-2026",
  "cohort_id": "cohort-batch-01",
  "completion_status": "failed",
  "connectivity_status": "failed",
  "next_action_status": "retry",
  "failure_reason": "TelephonyProvider: Rate Limit Exceeded",
  "user_identifier": "user-1002",
  "user_phone_number": "+919876543211",
  "agent_phone_number": "+91804XXXXXXX",
  "duration": null,
  "interaction_id": null,
  "retry_attempt": 1,
  "executed_at": "2026-03-29T10:40:26+05:30",
  "initial_agent_variables": {
    "customer_name": "Priya Sharma",
    "outstanding_amount": "2500"
  },
  "final_agent_variables": null,
  "interaction_transcript": null,
  "metadata": { "team": "collections" }
}
```
