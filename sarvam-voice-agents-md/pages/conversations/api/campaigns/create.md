# Create campaign

Source: https://docs.sarvam.ai/conversations/api/campaigns/create

POST

/api/scheduling/v1/orgs/:org\_id/workspaces/:workspace\_id/campaigns

```python
import requests

url = "https://apps.sarvam.ai/api/scheduling/v1/orgs/org_id/workspaces/workspace_id/campaigns"

payload = {
    "name": "Q1 Payment Reminders",
    "app_config": {
        "app_id": "agent-abc123",
        "app_type": "agent",
        "app_version": 1,
        "attempts_per_second": 2,
        "connection_configs": [
            {
                "connection_id": "conn-xyz",
                "phone_numbers": ["+918041234567"],
                "weight": 1
            }
        ],
        "retry_config": {
            "max_retries": 3,
            "retry_interval_minutes": 30,
            "retry_on": {
                "busy": { "enabled": True },
                "no_answer": { "enabled": True },
                "short_duration": {
                    "enabled": True,
                    "threshold_seconds": 30
                }
            }
        },
        "webhook_config": {
            "metadata": { "team": "collections" },
            "url": "https://your-server.com/webhook"
        }
    },
    "start_timestamp": "2026-04-01T09:00:00Z",
    "end_timestamp": "2026-04-15T18:00:00Z",
    "allowed_schedule": {
        "allowed_start_time": "09:00",
        "allowed_end_time": "18:00",
        "allowed_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "timezone": "Asia/Kolkata"
    },
    "description": "Outbound reminder calls for Q1 overdue accounts"
}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)

print(response.json())
```

```json
{
  "name": "Q1 Payment Reminders",
  "campaign_id": "camp-a1b2c3d4",
  "status": "scheduled",
  "app_id": "payment-reminder-agent",
  "created_by": "user@company.com",
  "created_at": "2026-03-28T10:00:00Z",
  "updated_at": "2026-03-28T10:00:00Z",
  "description": "Remind customers about upcoming payment due dates",
  "app_type": "agent",
  "app_version": 2,
  "updated_by": null
}
```

Create a new campaign that ties an agent to a schedule, rate, and retry policy.

The campaign will be created in `scheduled` status. It starts automatically when `start_timestamp` is reached.

### Path parameters

org\_idstringRequired

workspace\_idstringRequired

### Request

This endpoint expects an object.

namestringRequired

app\_configobjectRequired

Agent configuration for the campaign

start\_timestampdatetimeRequired

Campaign start time (ISO 8601)

end\_timestampdatetimeRequired

Campaign end time (ISO 8601)

allowed\_scheduleobjectRequired

Schedule constraints for when the campaign can run

descriptionstring or nullOptional`<=150 characters`

Optional campaign description. Max 150 characters.

### Response

Successful Response

namestring

Name of the resource

campaign\_idstring

Unique identifier for the campaign

statusenum

Current status

app\_idstring

ID of the agent

created\_bystring

User who created this resource

created\_atdatetime

Timestamp when the resource was created (ISO 8601)

updated\_atdatetime

Timestamp when the resource was last updated (ISO 8601)

descriptionstring or nullOptional

Optional description

app\_typeenumOptional

Type of agent

app\_versioninteger or nullOptional

Version of the agent to use

updated\_bystring or nullOptional

User who last updated this resource

### Errors

422

Unprocessable Entity Error
