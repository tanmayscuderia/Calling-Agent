# Get interactions

Source: https://docs.sarvam.ai/conversations/api/analytics/interactions

GET

/api/analytics/v1/:org\_id/:workspace\_id/:app\_id/interactions

```python
import requests

url = "https://apps.sarvam.ai/api/analytics/v1/org_id/workspace_id/app_id/interactions"

querystring = {"end_datetime":"end_datetime","start_datetime":"start_datetime"}

response = requests.get(url, params=querystring)

print(response.json())
```

```json
{
  "items": [
    {
      "interaction_id": "string",
      "user_identifier": "string",
      "duration_in_seconds": 1.1,
      "start_datetime": "2024-01-15T09:30:00Z",
      "end_datetime": "2024-01-15T09:30:00Z",
      "language_name": "string",
      "num_messages": 1,
      "average_agent_response_time_in_seconds": 1.1,
      "average_user_response_time_in_seconds": 1.1,
      "user_contact_masked": "string",
      "user_contact_hashed": "string",
      "channel_direction": "string",
      "retry_attempt": 1,
      "campaign_id": "string",
      "cohort_id": "string",
      "is_debug_call": 1,
      "audio_url": "string",
      "job_id": "string",
      "channel_type": "string",
      "channel_provider": "string",
      "channel_protocol": "string",
      "server_retry_attempt": 1,
      "failure_reason": "string",
      "ended_by": "string",
      "has_log_issues": 1,
      "agent_variables": {}
    }
  ],
  "total": 1,
  "limit": 1,
  "offset": 1,
  "next_page_uri": "string",
  "prev_page_uri": "string"
}
```

Fetch paginated interactions with filtering and sorting options

### Path parameters

org\_idstringRequired

Organization ID

workspace\_idstringRequired

Workspace ID

app\_idstringRequired

Agent ID

### Headers

X-API-Keystring or nullOptional

### Query parameters

sort\_bystring or nullOptional

Field to sort by

sort\_orderstring or nullOptional

Sort order (asc or desc)

start\_datetimedatetimeRequired

Filter start datetime in UTC (ISO8601)

end\_datetimedatetimeRequired

Filter end datetime in UTC (ISO8601)

limitintegerOptional`1-1000`Defaults to `20`

Max number of records to return

offsetintegerOptional`>=0`Defaults to `0`

Number of records to skip

filter\_conditionsstring or nullOptional

JSON array of filter conditions. Each condition has: id (string), field (from available fields), operator (equals/not\_equals/includes/starts\_with/ends\_with for strings; equals/not\_equals/greater\_than/less\_than for numbers), value. Example: \[{“id”:“1”,“field”:“interaction\_id”,“operator”:“equals”,“value”:“abc123”}\]

### Response

Successful Response

itemslist of objects

totalinteger

limitinteger

offsetinteger

next\_page\_uristring or nullOptional

prev\_page\_uristring or nullOptional

### Errors

422

Unprocessable Entity Error
