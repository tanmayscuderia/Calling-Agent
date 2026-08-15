# Get transcripts

Source: https://docs.sarvam.ai/conversations/api/analytics/transcripts

GET

/api/analytics/v1/:org\_id/:workspace\_id/:app\_id/transcripts/:interaction\_id

```python
import requests

url = "https://apps.sarvam.ai/api/analytics/v1/org_id/workspace_id/app_id/transcripts/interaction_id"

response = requests.get(url)

print(response.json())
```

```
{}
```

Fetch transcript for a specific interaction

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
