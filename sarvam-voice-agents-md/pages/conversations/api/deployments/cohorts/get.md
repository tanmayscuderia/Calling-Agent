# Get cohort

Source: https://docs.sarvam.ai/conversations/api/deployments/cohorts/get

GET

/api/scheduling/v1/orgs/:org\_id/workspaces/:workspace\_id/deployments/:deployment\_id/cohorts/:cohort\_id

```python
import requests

url = "https://apps.sarvam.ai/api/scheduling/v1/orgs/org_id/workspaces/workspace_id/deployments/deployment_id/cohorts/cohort_id"

response = requests.get(url)

print(response.json())
```

```json
{
  "name": "April Users Batch 1",
  "cohort_id": "coh-x1y2z3",
  "status": "completed",
  "source_type": "file_upload",
  "created_by": "user@company.com",
  "created_at": "2026-04-01T09:00:00Z",
  "updated_at": "2026-04-01T09:02:30Z",
  "result": {
    "total_records": 5000,
    "valid_records": 4850,
    "rejected_records": 150
  },
  "updated_by": null
}
```

Get metadata for a specific cohort including its processing status and result counts (total records, valid, rejected).

### Path parameters

org\_idstringRequired

workspace\_idstringRequired

deployment\_idstringRequired

cohort\_idstringRequired

### Response

Successful Response

namestring

Name of the resource

cohort\_idstring

Unique identifier for the cohort

statusenum

Current status

source\_typeenum

How the cohort was uploaded

created\_bystring

User who created this resource

created\_atdatetime

Timestamp when the resource was created (ISO 8601)

updated\_atdatetime

Timestamp when the resource was last updated (ISO 8601)

resultobject or nullOptional

Processing result with record counts

updated\_bystring or nullOptional

User who last updated this resource

### Errors

422

Unprocessable Entity Error
