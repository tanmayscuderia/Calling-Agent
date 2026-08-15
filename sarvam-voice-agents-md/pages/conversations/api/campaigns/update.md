# Update campaign

Source: https://docs.sarvam.ai/conversations/api/campaigns/update

PATCH

/api/scheduling/v1/orgs/:org\_id/workspaces/:workspace\_id/campaigns/:campaign\_id

```python
import requests

url = "https://apps.sarvam.ai/api/scheduling/v1/orgs/org_id/workspaces/workspace_id/campaigns/campaign_id"

payload = {
    "name": "Q1 Payment Reminders v2",
    "end_timestamp": "2026-04-30T18:00:00Z",
    "allowed_schedule": {
        "allowed_start_time": "08:00",
        "allowed_end_time": "20:00",
        "allowed_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "timezone": "Asia/Kolkata"
    }
}
headers = {"Content-Type": "application/json"}

response = requests.patch(url, json=payload, headers=headers)

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

Update a campaign’s configuration. Only allowed when the campaign is in `paused` or `scheduled` status.

You can update the name, description, agent configuration, end timestamp, and allowed schedule.

### Path parameters

org\_idstringRequired

workspace\_idstringRequired

campaign\_idstringRequired

### Request

This endpoint expects an object.

namestring or nullOptional

Updated campaign name. Alphanumeric, hyphens, underscores and spaces allowed. Max 50 characters.

descriptionstring or nullOptional`<=150 characters`

Updated campaign description. Max 150 characters.

app\_configobject or nullOptional

Updated agent configuration

end\_timestampdatetime or nullOptional

Updated campaign end time (ISO 8601)

allowed\_scheduleobject or nullOptional

Updated schedule constraints

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
