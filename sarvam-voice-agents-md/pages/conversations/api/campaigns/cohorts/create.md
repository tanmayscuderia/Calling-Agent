# Create cohort

Source: https://docs.sarvam.ai/conversations/api/campaigns/cohorts/create

POST

/api/scheduling/v1/orgs/:org\_id/workspaces/:workspace\_id/campaigns/:campaign\_id/cohorts

```python
import requests

url = "https://apps.sarvam.ai/api/scheduling/v1/orgs/org_id/workspaces/workspace_id/campaigns/campaign_id/cohorts"

payload = {
    "name": "string",
    "source": { "url": "string" },
    "cohort_transformation": { "phone_number": { "column_name": "string" } }
}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)

print(response.json())
```

```json
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
```

Create a cohort from a pre-signed URL source with a transformation configuration.

### Path parameters

org\_idstringRequired

workspace\_idstringRequired

campaign\_idstringRequired

### Request

This endpoint expects an object.

namestringRequired

sourceobjectRequired

Source of the cohort data

cohort\_transformationobjectRequired

Configuration for how CSV columns map to phone numbers and agent variables

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
