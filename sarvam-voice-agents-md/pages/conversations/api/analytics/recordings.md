# Get recordings

Source: https://docs.sarvam.ai/conversations/api/analytics/recordings

GET

/api/analytics/v1/:org\_id/:workspace\_id/:app\_id/recordings/:interaction\_id

```python
import requests

url = "https://apps.sarvam.ai/api/analytics/v1/org_id/workspace_id/app_id/recordings/interaction_id"

response = requests.get(url)

print(response.json())
```

```
{}
```

Fetch recording for a specific interaction

### Path parameters

org\_idstringRequired

Organization ID

workspace\_idstringRequired

Workspace ID

app\_idstringRequired

Agent ID

interaction\_idstringRequired

Interaction ID

### Headers

X-API-Keystring or nullOptional

### Response

Successful Response

### Errors

422

Unprocessable Entity Error
