# List campaigns

Source: https://docs.sarvam.ai/conversations/api/campaigns/list

GET

/api/scheduling/v1/orgs/:org\_id/workspaces/:workspace\_id/campaigns

```python
import requests

url = "https://apps.sarvam.ai/api/scheduling/v1/orgs/org_id/workspaces/workspace_id/campaigns"

response = requests.get(url)

print(response.json())
```

```json
{
  "items": [
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
  ],
  "total": 1,
  "limit": 10,
  "offset": 0,
  "next_page_uri": null,
  "prev_page_uri": null
}
```

List campaigns in the workspace with optional filtering by status, search, sorting, and pagination.

### Path parameters

org\_idstringRequired

workspace\_idstringRequired

### Query parameters

campaign\_statusenum or nullOptional

Campaign lifecycle status: `scheduled` → `active` → `ended`. Can be `paused` or `cancelled` at any point.

Allowed values:

offsetintegerOptional`>=0`Defaults to `0`

Number of records to skip

limitintegerOptional`1-100`Defaults to `10`

Number of records to return (max 100)

sort\_bystring or nullOptionalDefaults to `created_at`

Field to sort by

sort\_orderstring or nullOptionalDefaults to `desc`

Sort order (asc or desc)

searchstring or nullOptional

Search query string

### Response

Successful Response

itemslist of objects

List of campaigns on this page

totalinteger

Total number of campaigns matching the query

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
