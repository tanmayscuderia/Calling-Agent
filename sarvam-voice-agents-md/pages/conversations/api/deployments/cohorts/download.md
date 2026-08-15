# Download cohort file

Source: https://docs.sarvam.ai/conversations/api/deployments/cohorts/download

GET

/api/scheduling/v1/orgs/:org\_id/workspaces/:workspace\_id/deployments/:deployment\_id/cohorts/:cohort\_id/files

```python
import requests

url = "https://apps.sarvam.ai/api/scheduling/v1/orgs/org_id/workspaces/workspace_id/deployments/deployment_id/cohorts/cohort_id/files"

querystring = {"file_type":"cohort"}

response = requests.get(url, params=querystring)

print(response.json())
```

Download a file associated with a cohort. \*\*Available file types:\*\* - \`cohort\` — The original uploaded CSV - \`rejected\_records\` — CSV of rows that failed validation, with an appended \`rejected\_reason\` column - \`cohort\_transformation\` — The JSON transformation config used during processing

### Path parameters

org\_idstringRequired

workspace\_idstringRequired

deployment\_idstringRequired

cohort\_idstringRequired

### Query parameters

file\_typeenumRequired

Type of cohort file to download.

Allowed values:

### Response

Successful Response

### Errors

422

Unprocessable Entity Error
