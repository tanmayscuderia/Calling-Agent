# Delete deployment

Source: https://docs.sarvam.ai/conversations/api/deployments/delete

DELETE

/api/app-authoring/v1/orgs/:org\_id/workspaces/:workspace\_id/deployments/:deployment\_id

```python
import requests

url = "https://apps.sarvam.ai/api/app-authoring/v1/orgs/org_id/workspaces/workspace_id/deployments/deployment_id"

response = requests.delete(url)

print(response.json())
```

Permanently delete a deployment. This immediately stops all inbound call handling for the associated phone numbers.

### Path parameters

org\_idstringRequired

workspace\_idstringRequired

deployment\_idstringRequired

### Response

Successful Response

### Errors

422

Unprocessable Entity Error
