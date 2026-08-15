# List deployments

Source: https://docs.sarvam.ai/conversations/api/deployments/list

GET

/api/app-authoring/v1/orgs/:org\_id/workspaces/:workspace\_id/deployments

```python
import requests

url = "https://apps.sarvam.ai/api/app-authoring/v1/orgs/org_id/workspaces/workspace_id/deployments"

response = requests.get(url)

print(response.json())
```

```json
{
  "items": [
    {
      "deployment_id": "dep-a1b2c3d4",
      "app_id": "my-support-agent",
      "app_version": 3,
      "phone_numbers": [
        "+918047168000"
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
  ],
  "total": 1,
  "limit": 10,
  "offset": 0,
  "next_page_uri": null,
  "prev_page_uri": null
}
```

List all deployments in the workspace with optional filtering, sorting, and pagination.

### Path parameters

org\_idstringRequired

workspace\_idstringRequired

### Query parameters

offsetintegerOptional`>=0`Defaults to `0`

Number of records to skip

limitintegerOptional`1-100`Defaults to `10`

Number of records to return (max 100)

sort\_bystring or nullOptional

Field to sort by

sort\_orderstring or nullOptional

Sort order (asc or desc)

searchstring or nullOptional

Search query string

### Response

Successful Response

itemslist of objects

List of deployments on this page

totalinteger

Total number of deployments matching the query

limitinteger

Maximum number of items per page

offsetinteger

Number of items skipped

next\_page\_uristring or nullOptional

URI to fetch the next page, or null if this is the last page

prev\_page\_uristring or nullOptional

URI to fetch the previous page, or null if this is the first page

### Errors

422

Unprocessable Entity Error
