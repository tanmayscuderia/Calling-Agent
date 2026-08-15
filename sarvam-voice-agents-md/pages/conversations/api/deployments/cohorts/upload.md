# Upload cohort

Source: https://docs.sarvam.ai/conversations/api/deployments/cohorts/upload

POST

/api/scheduling/v1/orgs/:org\_id/workspaces/:workspace\_id/deployments/:deployment\_id/cohorts/upload

```python
import requests

url = "https://apps.sarvam.ai/api/scheduling/v1/orgs/org_id/workspaces/workspace_id/deployments/deployment_id/cohorts/upload"

files = {
    "cohort_file": "open('(binary CSV file)', 'rb')",
    "cohort_transformation_file": "open('(binary JSON file)', 'rb')"
}
payload = { "name": "April Users Batch 1" }

response = requests.post(url, data=payload, files=files)

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

Upload a cohort of users for a deployment. When a known user calls in, the agent receives their personalized variables (name, balance, language, etc.) for a tailored conversation. Upload as multipart form-data with three fields: - \`name\` — Cohort name (1–50 characters) - \`cohort\_file\` — CSV file with a header row and user data - \`cohort\_transformation\_file\` — JSON file that maps CSV columns to phone numbers and agent variables

### Path parameters

org\_idstringRequired

workspace\_idstringRequired

deployment\_idstringRequired

### Request

This endpoint expects a multipart form with multiple files.

namestringRequired`format: "^[\w\- ]{1,50}$"``<=50 characters`

Cohort name (1-50 characters)

cohort\_filefileRequired

CSV file containing the cohort data

cohort\_transformation\_filefileRequired

JSON file defining how CSV columns map to agent variables

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
