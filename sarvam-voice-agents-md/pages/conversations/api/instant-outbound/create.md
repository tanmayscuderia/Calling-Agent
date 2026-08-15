# Create outbound call

Source: https://docs.sarvam.ai/conversations/api/instant-outbound/create

POST

/api/outbounds/v1/orgs/:org\_id/workspaces/:workspace\_id/outbounds

```python
import requests

url = "https://apps.sarvam.ai/api/outbounds/v1/orgs/org_id/workspaces/workspace_id/outbounds"

payload = {
    "app_config": {
        "app_id": "string",
        "app_version": 1,
        "connection_config": {
            "connection_id": "string",
            "agent_phone_number": "string"
        }
    },
    "user_config": { "user_phone_number": "string" }
}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)

print(response.json())
```

```json
{
  "attempt_id": "string"
}
```

### Path parameters

org\_idstringRequired

workspace\_idstringRequired

### Request

This endpoint expects an object.

app\_configobjectRequired

user\_configobjectRequired

webhook\_configobject or nullOptional

### Response

Successful Response

attempt\_idstring

### Errors

422

Unprocessable Entity Error
