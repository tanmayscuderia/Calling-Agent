# Update status

Source: https://docs.sarvam.ai/conversations/api/campaigns/update-status

PUT

/api/scheduling/v1/orgs/:org\_id/workspaces/:workspace\_id/campaigns/:campaign\_id/status

```python
import requests

url = "https://apps.sarvam.ai/api/scheduling/v1/orgs/org_id/workspaces/workspace_id/campaigns/campaign_id/status"

payload = { "action": "pause" }
headers = {"Content-Type": "application/json"}

response = requests.put(url, json=payload, headers=headers)

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

Change the status of a campaign by sending a `pause`, `resume`, or `cancel` action.

### Path parameters

org\_idstringRequired

workspace\_idstringRequired

campaign\_idstringRequired

### Request

This endpoint expects an object.

actionenumRequired

The new status to set for the campaign

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
