# Create deployment

Source: https://docs.sarvam.ai/conversations/api/deployments/create

POST

/api/app-authoring/v1/orgs/:org\_id/workspaces/:workspace\_id/deployments

```python
import requests

url = "https://apps.sarvam.ai/api/app-authoring/v1/orgs/org_id/workspaces/workspace_id/deployments"

payload = {
    "name": "Customer Support Line",
    "app_id": "my-support-agent",
    "app_version": 3,
    "connection_configs": [
        {
            "connection_id": "conn-exotel-001",
            "phone_numbers": ["+918047168000"]
        }
    ],
    "description": "Main support deployment for EN and HI",
    "inbound_config": {
        "start_time": "09:00",
        "end_time": "18:00",
        "allowed_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "timezone": "Asia/Kolkata"
    }
}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)

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

Create a new deployment that connects an agent to a phone number for inbound calls.

The deployment is created in `active` status and immediately begins accepting calls. Optionally configure an `inbound_config` schedule to restrict calls to specific hours and days.

### Path parameters

org\_idstringRequired

workspace\_idstringRequired

### Request

This endpoint expects an object.

namestringRequired`format: "^[\w\- ]{1,50}$"``<=50 characters`

Deployment name. Alphanumeric, hyphens, underscores and spaces allowed. Max 50 characters.

app\_idstringRequired

ID of the agent

app\_versionintegerRequired

Version of the agent to deploy

connection\_configslist of objectsRequired

Telephony connection configurations with phone numbers

descriptionstring or nullOptional`<=150 characters`

Optional deployment description. Max 150 characters.

inbound\_configobject or nullOptional

Optional inbound call schedule configuration

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
