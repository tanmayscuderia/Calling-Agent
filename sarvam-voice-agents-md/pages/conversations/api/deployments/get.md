# Get deployment

Source: https://docs.sarvam.ai/conversations/api/deployments/get

GET

/api/app-authoring/v1/orgs/:org\_id/workspaces/:workspace\_id/deployments/:deployment\_id

```python
import requests

url = "https://apps.sarvam.ai/api/app-authoring/v1/orgs/org_id/workspaces/workspace_id/deployments/deployment_id"

response = requests.get(url)

print(response.json())
```

```json
{
  "deployment_id": "dep-a1b2c3d4",
  "app_id": "my-support-agent",
  "app_version": 3,
  "connection_configs": [
    {
      "connection_id": "conn-exotel-001",
      "phone_numbers": [
        "+918047168000"
      ]
    }
  ],
  "channel_direction": "inbound",
  "created_by": "user@company.com",
  "created_at": "2026-03-01T10:00:00Z",
  "updated_at": "2026-03-15T14:30:00Z",
  "name": "Customer Support Line",
  "status": "active",
  "description": "Main support deployment for EN and HI",
  "inbound_config": {
    "start_time": "09:00",
    "end_time": "18:00",
    "allowed_days": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
    ],
    "timezone": "Asia/Kolkata"
  },
  "updated_by": "user@company.com"
}
```

Get full details of a deployment including its agent version, connection config, inbound schedule, and current status.

### Path parameters

org\_idstringRequired

workspace\_idstringRequired

deployment\_idstringRequired

### Response

Successful Response

deployment\_idstring

Unique identifier for the deployment

app\_idstring

ID of the agent

app\_versioninteger

Version of the agent

connection\_configslist of objects

Telephony connection configurations

channel\_directionenum

Direction of calls (inbound, outbound, or both)

created\_bystring

User who created this deployment

created\_atdatetime

Timestamp when created (ISO 8601)

updated\_atdatetime

Timestamp when last updated (ISO 8601)

namestring or nullOptional

Name of the deployment

statusenum or nullOptional

Current status of the deployment

descriptionstring or nullOptional

Optional description

inbound\_configobject or nullOptional

Inbound call schedule configuration

updated\_bystring or nullOptional

User who last updated this deployment

### Errors

422

Unprocessable Entity Error
