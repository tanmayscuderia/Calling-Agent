# List Models

Source: https://docs.fish.audio/api-reference/endpoint/model/list-models

List Models

```
curl --request GET \
  --url https://api.fish.audio/model \
  --header 'Authorization: Bearer <token>'
```

```
{
  "total": 123,
  "items": [
    {
      "_id": "<string>",
      "title": "<string>",
      "tags": [
        "<string>"
      ],
      "created_at": "2023-11-07T05:31:56Z",
      "updated_at": "2023-11-07T05:31:56Z",
      "like_count": 123,
      "mark_count": 123,
      "shared_count": 123,
      "task_count": 123,
      "author": {
        "_id": "<string>",
        "nickname": "<string>",
        "avatar": "<string>"
      },
      "description": "",
      "cover_image": "",
      "train_mode": "full",
      "samples": [],
      "languages": [],
      "lock_visibility": false,
      "dmca_taken_down": false,
      "default_text": "",
      "source": "<string>",
      "pvc_notice_period_months": 123,
      "pvc_released_at": "2023-11-07T05:31:56Z",
      "pvc_retire_requested_at": "2023-11-07T05:31:56Z",
      "pvc_retire_effective_at": "2023-11-07T05:31:56Z",
      "quality": {
        "created_at": "2023-11-07T05:31:56Z",
        "updated_at": "2023-11-07T05:31:56Z",
        "audios": [
          {
            "filename": "<string>",
            "duration_ms": 123,
            "language": "unknown",
            "quality": {},
            "quality_passed": false,
            "quality_reason": ""
          }
        ]
      },
      "unliked": false,
      "liked": false,
      "marked": false
    }
  ],
  "max_offset": 123,
  "accessible_upper_bound": 123,
  "window_limited": false,
  "total_is_exact": true,
  "has_more": true
}
```

GET

/

model

List Models

```
curl --request GET \
  --url https://api.fish.audio/model \
  --header 'Authorization: Bearer <token>'
```

```
{
  "total": 123,
  "items": [
    {
      "_id": "<string>",
      "title": "<string>",
      "tags": [
        "<string>"
      ],
      "created_at": "2023-11-07T05:31:56Z",
      "updated_at": "2023-11-07T05:31:56Z",
      "like_count": 123,
      "mark_count": 123,
      "shared_count": 123,
      "task_count": 123,
      "author": {
        "_id": "<string>",
        "nickname": "<string>",
        "avatar": "<string>"
      },
      "description": "",
      "cover_image": "",
      "train_mode": "full",
      "samples": [],
      "languages": [],
      "lock_visibility": false,
      "dmca_taken_down": false,
      "default_text": "",
      "source": "<string>",
      "pvc_notice_period_months": 123,
      "pvc_released_at": "2023-11-07T05:31:56Z",
      "pvc_retire_requested_at": "2023-11-07T05:31:56Z",
      "pvc_retire_effective_at": "2023-11-07T05:31:56Z",
      "quality": {
        "created_at": "2023-11-07T05:31:56Z",
        "updated_at": "2023-11-07T05:31:56Z",
        "audios": [
          {
            "filename": "<string>",
            "duration_ms": 123,
            "language": "unknown",
            "quality": {},
            "quality_passed": false,
            "quality_reason": ""
          }
        ]
      },
      "unliked": false,
      "liked": false,
      "marked": false
    }
  ],
  "max_offset": 123,
  "accessible_upper_bound": 123,
  "window_limited": false,
  "total_is_exact": true,
  "has_more": true
}
```

#### Authorizations

[​

](https://docs.fish.audio/api-reference/endpoint/model/list-models#authorization-authorization)

Authorization

string

header

required

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

#### Query Parameters

[​

](https://docs.fish.audio/api-reference/endpoint/model/list-models#parameter-page-size)

page\_size

integer

default:10

Page size

Required range: `1 <= x <= 100`

[​

](https://docs.fish.audio/api-reference/endpoint/model/list-models#parameter-page-number)

page\_number

integer

default:1

Page number

Required range: `x >= 1`

[​

](https://docs.fish.audio/api-reference/endpoint/model/list-models#parameter-one-of-0)

title

string | null

Title to filter models

[​

](https://docs.fish.audio/api-reference/endpoint/model/list-models#parameter-one-of-0)

tag

string\[\]string

Tag to filter models

[​

](https://docs.fish.audio/api-reference/endpoint/model/list-models#parameter-self)

self

boolean

default:false

If True, return models owned by the active workspace

[​

](https://docs.fish.audio/api-reference/endpoint/model/list-models#parameter-one-of-0)

author\_id

string | null

Author ID to filter public models; ignored if self is True

[​

](https://docs.fish.audio/api-reference/endpoint/model/list-models#parameter-one-of-0)

language

string\[\]string

Language to filter models

[​

](https://docs.fish.audio/api-reference/endpoint/model/list-models#parameter-one-of-0)

title\_language

string\[\]string

Title language to filter models

[​

](https://docs.fish.audio/api-reference/endpoint/model/list-models#parameter-sort-by)

sort\_by

enum<string>

default:score

Available options:

`score`,

`task_count`,

`created_at`

#### Response

200 - application/json

Request fulfilled, document follows

[​

](https://docs.fish.audio/api-reference/endpoint/model/list-models#response-total)

total

integer

required

[​

](https://docs.fish.audio/api-reference/endpoint/model/list-models#response-items)

items

ModelEntity · object\[\]

required

Show child attributes

[​

](https://docs.fish.audio/api-reference/endpoint/model/list-models#response-max-offset-one-of-0)

max\_offset

integer | null

[​

](https://docs.fish.audio/api-reference/endpoint/model/list-models#response-accessible-upper-bound-one-of-0)

accessible\_upper\_bound

integer | null

[​

](https://docs.fish.audio/api-reference/endpoint/model/list-models#response-window-limited)

window\_limited

boolean

default:false

[​

](https://docs.fish.audio/api-reference/endpoint/model/list-models#response-total-is-exact)

total\_is\_exact

boolean

default:true

[​

](https://docs.fish.audio/api-reference/endpoint/model/list-models#response-has-more-one-of-0)

has\_more

boolean | null

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/endpoint/model/list-models.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/endpoint/model/list-models)
