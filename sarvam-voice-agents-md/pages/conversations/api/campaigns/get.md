# Get campaign

Source: https://docs.sarvam.ai/conversations/api/campaigns/get

GET

/api/scheduling/v1/orgs/:org\_id/workspaces/:workspace\_id/campaigns/:campaign\_id

```python
import requests

url = "https://apps.sarvam.ai/api/scheduling/v1/orgs/org_id/workspaces/workspace_id/campaigns/campaign_id"

response = requests.get(url)

print(response.json())
```

```json
{
  "name": "Q1 Payment Reminders",
  "campaign_id": "camp-a1b2c3d4",
  "status": "active",
  "app_id": "payment-reminder-agent",
  "created_by": "user@company.com",
  "created_at": "2026-03-28T10:00:00Z",
  "updated_at": "2026-04-01T09:00:00Z",
  "app_config": {
    "app_id": "payment-reminder-agent",
    "app_type": "agent",
    "app_version": 2,
    "attempts_per_second": 2,
    "connection_configs": [
      {
        "connection_id": "conn-exotel-001",
        "phone_numbers": [
          "+918047168000"
        ],
        "weight": 1
      }
    ],
    "retry_config": {
      "max_retries": 3,
      "retry_interval_minutes": 30
    }
  },
  "start_timestamp": "2026-04-01T09:00:00Z",
  "end_timestamp": "2026-04-15T18:00:00Z",
  "allowed_schedule": {
    "allowed_start_time": "09:00",
    "allowed_end_time": "18:00",
    "allowed_days": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
    ],
    "timezone": "Asia/Kolkata"
  },
  "description": "Remind customers about upcoming payment due dates",
  "app_type": "agent",
  "app_version": 2,
  "updated_by": "user@company.com"
}
```

Get full details of a campaign including its agent configuration, schedule, and retry policy.

### Path parameters

org\_idstringRequired

workspace\_idstringRequired

campaign\_idstringRequired

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

app\_configobject

Agent configuration for the campaign

start\_timestampdatetime

Campaign start time (ISO 8601)

end\_timestampdatetime

Campaign end time (ISO 8601)

allowed\_scheduleobject

Schedule constraints for when the campaign can run

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
