# List cohorts

Source: https://docs.sarvam.ai/conversations/api/campaigns/cohorts/list

GET

/api/scheduling/v1/orgs/:org\_id/workspaces/:workspace\_id/campaigns/:campaign\_id/cohorts

```python
import requests

url = "https://apps.sarvam.ai/api/scheduling/v1/orgs/org_id/workspaces/workspace_id/campaigns/campaign_id/cohorts"

response = requests.get(url)

print(response.json())
```

```json
{
  "items": [
    {
      "name": "April Batch 1",
      "cohort_id": "coh-x1y2z3",
      "status": "completed",
      "source_type": "file_upload",
      "created_by": "user@company.com",
      "created_at": "2026-04-01T09:00:00Z",
      "updated_at": "2026-04-01T09:05:00Z",
      "result": {
        "total_records": 10000,
        "valid_records": 9750,
        "rejected_records": 250
      },
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

List all cohorts belonging to a campaign with pagination, sorting, and search.

### Path parameters

org\_idstringRequired

workspace\_idstringRequired

campaign\_idstringRequired

### Query parameters

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

List of cohorts on this page

totalinteger

Total number of cohorts matching the query

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
